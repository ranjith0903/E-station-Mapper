import React, { useState } from 'react';
import { MapPin, Search, Loader2, Navigation, Globe, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LocationPicker({ onLocationSelect, initialPosition = [20.5937, 78.9629] }) {
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState(initialPosition);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [locationFound, setLocationFound] = useState(false);

  // Multiple geocoding services for better coverage
  const geocodeAddress = async (searchAddress) => {
    if (!searchAddress.trim()) return;

    setLoading(true);
    setLocationFound(false);

    try {
      // Try multiple geocoding services
      const results = await Promise.allSettled([
        // OpenStreetMap Nominatim (Primary)
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=5&countrycodes=in&addressdetails=1`),
        // OpenStreetMap Nominatim (Global search)
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=5&addressdetails=1`),
        // Try with different search terms
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress + ', India')}&limit=3&countrycodes=in`),
      ]);

      let allResults = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.ok) {
          result.value.json().then(data => {
            if (data && data.length > 0) {
              allResults = [...allResults, ...data];
            }
          });
        }
      });

      // Wait a bit for all results to be processed
      setTimeout(() => {
        if (allResults.length > 0) {
          // Remove duplicates and sort by relevance
          const uniqueResults = allResults.filter((result, index, self) => 
            index === self.findIndex(r => r.place_id === result.place_id)
          );

          const bestResult = uniqueResults[0];
          const newCoordinates = [parseFloat(bestResult.lat), parseFloat(bestResult.lon)];
          
          setCoordinates(newCoordinates);
          setAddress(bestResult.display_name);
          setSuggestions(uniqueResults.slice(1, 6)); // Show other options
          setLocationFound(true);
          
          onLocationSelect(newCoordinates, bestResult.display_name);
          toast.success('Location found!');
        } else {
          toast.error('Address not found. Try a different address or use manual coordinates.');
          setShowManualInput(true);
        }
        setLoading(false);
      }, 500);

    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Geocoding service unavailable. Please use manual coordinates.');
      setShowManualInput(true);
      setLoading(false);
    }
  };

  // Search suggestions as user types
  const searchSuggestions = async (searchTerm) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=8&countrycodes=in&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    setLocationFound(false);
    searchSuggestions(value);
  };

  const handleSuggestionClick = (suggestion) => {
    const newCoordinates = [parseFloat(suggestion.lat), parseFloat(suggestion.lon)];
    setCoordinates(newCoordinates);
    setAddress(suggestion.display_name);
    setSuggestions([]);
    setLocationFound(true);
    onLocationSelect(newCoordinates, suggestion.display_name);
    toast.success('Location selected!');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    geocodeAddress(address);
  };

  const handleManualCoordinates = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Please enter valid coordinates');
      return;
    }
    
    if (lat < -90 || lat > 90) {
      toast.error('Latitude must be between -90 and 90');
      return;
    }
    
    if (lng < -180 || lng > 180) {
      toast.error('Longitude must be between -180 and 180');
      return;
    }

    const newCoordinates = [lat, lng];
    setCoordinates(newCoordinates);
    setLocationFound(true);
    onLocationSelect(newCoordinates, `Manual Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
    toast.success('Manual coordinates set!');
    setShowManualInput(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoordinates = [position.coords.latitude, position.coords.longitude];
          setCoordinates(newCoordinates);
          setAddress('Current Location');
          setLocationFound(true);
          onLocationSelect(newCoordinates, 'Current Location');
          toast.success('Current location set!');
          setLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Unable to get current location. Please enter address manually.');
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const popularLocations = [
    { name: 'Mumbai Central', coords: [19.0760, 72.8777], address: 'Mumbai Central Railway Station, Mumbai, Maharashtra' },
    { name: 'Delhi Airport', coords: [28.5562, 77.1025], address: 'Indira Gandhi International Airport, New Delhi, Delhi' },
    { name: 'Bangalore Tech Park', coords: [12.9716, 77.5946], address: 'Electronic City Phase 1, Bangalore, Karnataka' },
    { name: 'Chennai Marina', coords: [13.0827, 80.2707], address: 'Marina Beach, Chennai, Tamil Nadu' },
    { name: 'Hyderabad Hitech City', coords: [17.3850, 78.4867], address: 'Hitech City, Madhapur, Hyderabad, Telangana' },
    { name: 'Kolkata Park Street', coords: [22.5726, 88.3639], address: 'Park Street, Kolkata, West Bengal' },
    { name: 'Pune Koregaon Park', coords: [18.5204, 73.8567], address: 'Koregaon Park, Pune, Maharashtra' },
    { name: 'Ahmedabad SG Road', coords: [23.0225, 72.5714], address: 'SG Road, Ahmedabad, Gujarat' },
    { name: 'Jaipur City Palace', coords: [26.9124, 75.7873], address: 'City Palace, Jaipur, Rajasthan' },
    { name: 'Lucknow Hazratganj', coords: [26.8467, 80.9462], address: 'Hazratganj, Lucknow, Uttar Pradesh' },
    { name: 'Chandigarh Sector 17', coords: [30.7333, 76.7794], address: 'Sector 17, Chandigarh' },
    { name: 'Indore Rajendra Nagar', coords: [22.7196, 75.8573], address: 'Rajendra Nagar, Indore, Madhya Pradesh' }
  ];

  const handlePopularLocationClick = (location) => {
    setCoordinates(location.coords);
    setAddress(location.address);
    setSuggestions([]);
    setLocationFound(true);
    onLocationSelect(location.coords, location.address);
    toast.success(`Location set to ${location.name}!`);
  };

  return (
    <div className="space-y-4">
      {/* Address Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Station Address *
        </label>
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={address}
              onChange={handleAddressChange}
              placeholder="Enter address (e.g., 'Mumbai Central' or 'Delhi Airport')"
              className="input-field pl-10 pr-12"
              required
            />
            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
              ) : (
                <Search className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </form>

        {/* Address Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="text-sm font-medium text-gray-900">
                  {suggestion.display_name.split(',')[0]}
                </div>
                <div className="text-xs text-gray-500">
                  {suggestion.display_name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={getCurrentLocation}
          disabled={loading}
          className="flex items-center px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors disabled:opacity-50"
        >
          <Navigation className="h-4 w-4 mr-1" />
          Use My Location
        </button>
        
        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          <Globe className="h-4 w-4 mr-1" />
          Manual Coordinates
        </button>
      </div>

      {/* Manual Coordinate Input */}
      {showManualInput && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="text-sm font-medium text-yellow-800 mb-3">Enter Coordinates Manually</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-yellow-700 mb-1">Latitude</label>
              <input
                type="number"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="e.g., 19.0760"
                step="any"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-yellow-700 mb-1">Longitude</label>
              <input
                type="number"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="e.g., 72.8777"
                step="any"
                className="input-field text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleManualCoordinates}
            className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-md transition-colors"
          >
            Set Coordinates
          </button>
        </div>
      )}

      {/* Popular Locations */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Select Popular Locations
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {popularLocations.map((location, index) => (
            <button
              key={index}
              onClick={() => handlePopularLocationClick(location)}
              className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-left"
            >
              {location.name}
            </button>
          ))}
        </div>
      </div>

      {/* Coordinates Display */}
      <div className={`p-3 rounded-lg ${locationFound ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">
            Selected Coordinates:
          </div>
          {locationFound && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
        </div>
        <div className="text-sm font-mono text-gray-800 mt-1">
          Latitude: {coordinates[0].toFixed(6)}
        </div>
        <div className="text-sm font-mono text-gray-800">
          Longitude: {coordinates[1].toFixed(6)}
        </div>
      </div>

      {/* Enhanced Instructions */}
      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
        <strong>💡 Tips for Better Address Recognition:</strong>
        <ul className="mt-1 space-y-1">
          <li>• Try shorter, more specific terms (e.g., "Mumbai Central" instead of full address)</li>
          <li>• Use landmark names or popular places</li>
          <li>• If address not found, use "Use My Location" or "Manual Coordinates"</li>
          <li>• Popular locations are pre-configured for quick selection</li>
          <li>• You can always enter coordinates manually if needed</li>
        </ul>
      </div>
    </div>
  );
} 