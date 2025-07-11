import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import RoutingMachine from 'react-leaflet-routing-machine';

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY || 'YOUR_ORS_API_KEY_HERE';

function SetMapView({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [position, map]);
  return null;
}

export default function StationDirections({ stationCoords, stationName, onClose }) {
  const [userLocation, setUserLocation] = useState(null);
  const [geoError, setGeoError] = useState(null);

  useEffect(() => {
    if (!userLocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        err => setGeoError('Could not get your location')
      );
    }
  }, [userLocation]);

  if (geoError) {
    return <div className="text-red-600">{geoError}</div>;
  }
  if (!userLocation) {
    return <div>Getting your location...</div>;
  }

  return (
    <div className="w-full h-96 relative">
      <button onClick={onClose} className="absolute top-2 right-2 z-10 bg-white rounded-full shadow p-2">✕</button>
      <MapContainer center={userLocation} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <SetMapView position={userLocation} />
        <Marker position={userLocation} />
        <Marker position={stationCoords} />
        <RoutingMachine
          waypoints={[
            L.latLng(userLocation[0], userLocation[1]),
            L.latLng(stationCoords[0], stationCoords[1])
          ]}
          lineOptions={{ styles: [{ color: 'blue', weight: 5 }] }}
          routerOptions={{
            serviceUrl: `https://api.openrouteservice.org/v2/directions/driving-car`,
            profile: 'driving-car',
            urlParameters: {
              api_key: ORS_API_KEY
            }
          }}
          createMarker={() => null}
        />
      </MapContainer>
      <div className="mt-2 text-sm text-gray-600">Directions to <b>{stationName}</b></div>
    </div>
  );
} 