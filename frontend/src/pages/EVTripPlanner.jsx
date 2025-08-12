import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { MapPin, Zap, Clock, DollarSign, Star, Calendar, Navigation } from 'lucide-react';
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
            {/* Individual Station Markers */}
            {stops.map((stop, idx) => 
              stop.stations.map(station => (
                <Marker 
                  key={`${idx}-${station._id}`} 
                  position={[station.location.coordinates[1], station.location.coordinates[0]]}
                >
                  <Popup>
                    <div className="min-w-80 space-y-4">
                      <div className="text-center">
                        <h3 className="font-semibold text-lg text-green-600">{station.name}</h3>
                        <p className="text-sm text-gray-600">Charging Station</p>
                      </div>
                      <div className="space-y-3">
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{station.name}</h4>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">{station.averageRating?.toFixed(1) || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span>{station.address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4" />
                              <span>₹{station.price}/hour</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Zap className="w-4 h-4" />
                              <span>{station.types.join(', ')}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>{station.isAvailable24x7 ? '24/7 Available' : 'Limited Hours'}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Link
                              to={`/booking/${station._id}/${station.price}`}
                              className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white text-center py-2 px-3 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                              onClick={() => {
                                toast.success(`Opening booking for ${station.name}`);
                              }}
                            >
                              <Calendar className="w-4 h-4" />
                              <span>Book Now</span>
                            </Link>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(station.address);
                                toast.success('Address copied to clipboard');
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                              title="Copy address for navigation"
                            >
                              <Navigation className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))
            )}
            
            {/* Stop Location Markers (for reference) */}
            {stops.map((stop, idx) => (
              <Marker 
                key={`stop-${idx}`} 
                position={stop.point}
                icon={L.divIcon({
                  className: 'stop-location-marker',
                  html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-weight: bold; font-size: 10px;">S</span></div>',
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-semibold text-blue-600">Stop {idx + 1}</h3>
                    <p className="text-sm text-gray-600">Suggested charging area</p>
                    <p className="text-xs text-gray-500 mt-1">{stop.stations.length} station(s) nearby</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Suggested Charging Stops</h3>
            {stops.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No charging stops needed within your range</p>
                <p className="text-sm text-gray-400 mt-1">Your vehicle can reach the destination without charging</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stops.map((stop, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Stop {idx + 1}</h4>
                        <p className="text-sm text-gray-600">Suggested charging location</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {stop.stations.map(station => (
                        <div key={station._id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{station.name}</h5>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">{station.averageRating?.toFixed(1) || 'N/A'}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{station.address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4" />
                              <span>₹{station.price}/hour</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Zap className="w-4 h-4" />
                              <span>{station.types.join(', ')}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>{station.isAvailable24x7 ? '24/7' : 'Limited'}</span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Link
                              to={`/booking/${station._id}/${station.price}`}
                              className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white text-center py-2 px-3 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                              onClick={() => {
                                toast.success(`Opening booking for ${station.name}`);
                              }}
                            >
                              <Calendar className="w-4 h-4" />
                              <span>Book</span>
                            </Link>
                            <button
                              onClick={() => {
                                // Copy address to clipboard for navigation
                                navigator.clipboard.writeText(station.address);
                                toast.success('Address copied to clipboard');
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                              title="Copy address for navigation"
                            >
                              <Navigation className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 