import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import polyline from '@mapbox/polyline';

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY || 'YOUR_ORS_API_KEY_HERE';

function haversineDistance([lat1, lon1], [lat2, lon2]) {
  // Returns distance in km
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function EVTripPlanner() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [range, setRange] = useState(200);
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);

  // Geocode address to [lng, lat] using ORS geocode API
  const geocode = async (query) => {
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].geometry.coordinates; // [lng, lat]
    }
    throw new Error('Location not found');
  };

  // Sample points along the route at smaller intervals for optimal charging stops
  const sampleRoutePoints = (coords, rangeKm) => {
    if (!coords || coords.length < 2) return [];
    
    console.log(`Total route coordinates: ${coords.length}`);
    
    // Sample more frequently to catch stations near the route
    const sampleInterval = Math.min(50, Math.max(30, rangeKm * 0.2)); // 20% of range, min 30km, max 50km
    
    let points = [coords[0]]; // Start point
    let dist = 0;
    let lastIdx = 0;
    
    // Use a smaller step size to get more sample points
    const stepSize = Math.max(1, Math.floor(coords.length / 40)); // Check every 2.5% of coordinates
    
    for (let i = stepSize; i < coords.length; i += stepSize) {
      const d = haversineDistance(coords[lastIdx], coords[i]);
      dist += d;
      
      if (dist >= sampleInterval) {
        points.push(coords[i]);
        dist = 0;
        lastIdx = i;
      }
    }
    
    points.push(coords[coords.length - 1]); // End point
    
    console.log(`Sampled ${points.length} points along route`);
    return points;
  };

  // Find stations near a point (lat, lng) with larger radius to catch off-route stations
  const findNearbyStations = async ([lat, lng]) => {
    console.log(`Checking for stations near: [${lat}, ${lng}]`);
    // Use your backend API to find stations within 20km to catch stations slightly off the route
    const res = await fetch(`/api/stations/nearby?lat=${lat}&lng=${lng}&maxDistance=20000`);
    if (!res.ok) return [];
    const data = await res.json();
    console.log(`Found ${data.length} stations near [${lat}, ${lng}]`);
    return data;
  };

  const handlePlan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRoute(null);
    setStops([]);
    let errorMsg = '';
    try {
      toast.loading('Geocoding locations...');
      console.log('Geocoding start:', start);
      const startCoords = await geocode(start); // [lng, lat]
      console.log('Start coords:', startCoords);
      const endCoords = await geocode(end);     // [lng, lat]
      console.log('End coords:', endCoords);
      toast.loading('Getting route...');
      // Get route from ORS
      const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&geometry_format=geojson`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates: [startCoords, endCoords] }) // [ [lng, lat], [lng, lat] ]
      });
      const data = await res.json();
      console.log('ORS route response:', data);
      if (data.error) throw new Error(data.error.message || 'Route error');
      if (!data.routes || !data.routes[0]) throw new Error('Route not found');
      let coords = [];
      if (typeof data.routes[0].geometry === 'string') {
        // Decode polyline string
        coords = polyline.decode(data.routes[0].geometry);
        // polyline.decode returns [lat, lng], which is what Leaflet expects
      } else if (data.routes[0].geometry && data.routes[0].geometry.coordinates) {
        coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      } else {
        console.error('Route object:', data.routes[0]);
        throw new Error('Route geometry not found.');
      }
      setRoute(coords);
      console.log('Route coordinates:', coords);
      toast.loading('Finding charging stops...');
      // Sample points along the route
      const samplePoints = sampleRoutePoints(coords, range);
      console.log('Sampled points:', samplePoints);
      // For each, find nearby stations
      const stopsArr = [];
      for (let i = 1; i < samplePoints.length - 1; i++) {
        const stations = await findNearbyStations(samplePoints[i]);
        console.log(`Stations near point ${i}:`, stations);
        if (stations.length > 0) {
          console.log(`Adding stop at point ${i} with ${stations.length} stations`);
          stopsArr.push({ point: samplePoints[i], stations });
        }
      }
      console.log('Final stops array:', stopsArr);
      setStops(stopsArr);
      toast.success('Trip planned!');
    } catch (err) {
      errorMsg = err.message || 'Failed to plan trip';
      toast.error(errorMsg);
      setRoute([]); // Ensure map is not shown if route fails
    } finally {
      toast.dismiss();
      setLoading(false);
      if (errorMsg) console.error('Trip Planner Error:', errorMsg);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">EV Trip Planner</h1>
      <form onSubmit={handlePlan} className="card p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Location</label>
          <input value={start} onChange={e => setStart(e.target.value)} className="input-field" placeholder="e.g. Mumbai" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Destination</label>
          <input value={end} onChange={e => setEnd(e.target.value)} className="input-field" placeholder="e.g. Pune" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle Range (km)</label>
          <input type="number" value={range} onChange={e => setRange(Number(e.target.value))} className="input-field" min={50} max={1000} required />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Planning...' : 'Plan Trip'}</button>
      </form>
      {route && route.length > 0 && (
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-2">Route & Suggested Charging Stops</h2>
          <MapContainer center={route[0]} zoom={7} style={{ height: 400, width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={route} color="blue" />
            {/* Start and End Markers */}
            <Marker position={route[0]}><Popup>Start</Popup></Marker>
            <Marker position={route[route.length - 1]}><Popup>Destination</Popup></Marker>
            {/* Charging Stops */}
            {stops.map((stop, idx) => (
              <Marker key={idx} position={stop.point}>
                <Popup>
                  <div>
                    <b>Charging Stop {idx + 1}</b>
                    <ul className="mt-2 space-y-1">
                      {stop.stations.map(station => (
                        <li key={station._id}>
                          <b>{station.name}</b><br />
                          {station.address}<br />
                          ₹{station.price}/hr
                        </li>
                      ))}
                    </ul>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Suggested Stops:</h3>
            {stops.length === 0 ? <div>No charging stops needed (or found) within your range.</div> : (
              <ol className="list-decimal ml-6 space-y-2">
                {stops.map((stop, idx) => (
                  <li key={idx}>
                    <b>Stop {idx + 1}:</b> {stop.stations[0]?.name || 'Charging Station'} ({stop.stations[0]?.address || 'No address'})
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 