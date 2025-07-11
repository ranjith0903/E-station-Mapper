import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Filter, Zap, Clock, DollarSign, Search, Navigation, AlertCircle, Info, CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LiveStatus from '../components/LiveStatus';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker for user location
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Component to handle map center updates
function MapUpdater({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 15); // Zoom in closer for user location
    }
  }, [center, map]);
  
  return null;
}

export default function MapView() {
  const [stations, setStations] = useState([]);
  const [position, setPosition] = useState([20.5937, 78.9629]); // Default: India
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    maxPrice: '',
    plugType: '',
    distance: '5000'
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(true);

  useEffect(() => {
    getCurrentLocation();
    // Initialize with some default notifications
    setNotifications([
      {
        id: 1,
        type: 'info',
        title: 'Welcome to E-Station Mapper!',
        message: 'Find and book charging stations near you. Use filters to narrow down your search.',
        timestamp: new Date(),
        persistent: true
      }
    ]);
  }, []);

  const getCurrentLocation = () => {
    setLocationLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPosition = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPosition);
          setUserLocation(newPosition); // Store user location separately
          fetchStations(newPosition[0], newPosition[1]);
          toast.success('Location found! Showing nearby stations.');
          addNotification('success', 'Location Updated', 'Your current location has been detected and nearby stations are being loaded.');
          setLocationLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = 'Unable to get your location. Using default location.';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          toast.error(errorMessage);
          addNotification('error', 'Location Error', errorMessage);
          fetchStations(position[0], position[1]);
          setLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
      addNotification('error', 'Browser Not Supported', 'Geolocation is not supported by this browser. Using default location.');
      fetchStations(position[0], position[1]);
      setLocationLoading(false);
    }
  };

  const fetchStations = async (lat, lng) => {
    setLoading(true);
    try {
      let url = `/api/stations/nearby?lat=${lat}&lng=${lng}&maxDistance=${filters.distance}`;
      if (filters.type) url += `&type=${filters.type}`;
      if (filters.maxPrice) url += `&price=${filters.maxPrice}`;
      if (filters.plugType) url += `&plugType=${filters.plugType}`;
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setStations(data);
        
        // Add notifications based on station data
        const newNotifications = [];
        
        if (data.length === 0) {
          newNotifications.push({
            id: Date.now(),
            type: 'warning',
            title: 'No Stations Found',
            message: 'No charging stations found in your area. Try increasing the search distance or check back later.',
            timestamp: new Date(),
            persistent: false
          });
        } else {
          // Check for stations with special status
          const busyStations = data.filter(station => station.status === 'in_use');
          const availableStations = data.filter(station => station.status === 'available');
          
          if (busyStations.length > 0) {
            newNotifications.push({
              id: Date.now() + 1,
              type: 'info',
              title: 'Station Status Update',
              message: `${busyStations.length} station(s) are currently in use. Check wait times before booking.`,
              timestamp: new Date(),
              persistent: false
            });
          }
          
          if (availableStations.length > 0) {
            newNotifications.push({
              id: Date.now() + 2,
              type: 'success',
              title: 'Available Stations',
              message: `${availableStations.length} station(s) are available for immediate booking!`,
              timestamp: new Date(),
              persistent: false
            });
          }
        }
        
        // Add new notifications (limit to 5 most recent)
        setNotifications(prev => {
          const combined = [...prev.filter(n => n.persistent), ...newNotifications];
          return combined.slice(-5);
        });
        
      } else {
        console.error('API returned non-array data:', data);
        setStations([]);
        toast.error('Invalid data received from server');
      }
    } catch (err) {
      console.error('Error fetching stations:', err);
      setStations([]);
      toast.error('Failed to fetch stations. Please try again.');
      
      // Add error notification
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to fetch station data. Please check your internet connection and try again.',
        timestamp: new Date(),
        persistent: false
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchStations(position[0], position[1]);
    setShowFilters(false);
    
    // Add notification about filter application
    const filterCount = Object.values(filters).filter(v => v && v !== '5000').length;
    if (filterCount > 0) {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'info',
        title: 'Filters Applied',
        message: `Applied ${filterCount} filter(s) to your search.`,
        timestamp: new Date(),
        persistent: false
      }]);
    }
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.filter(n => n.persistent));
  };

  const addNotification = (type, title, message) => {
    setNotifications(prev => [...prev, {
      id: Date.now(),
      type,
      title,
      message,
      timestamp: new Date(),
      persistent: false
    }]);
  };

  const getStationIcon = (types) => {
    const isFast = types.some(type => type.toLowerCase().includes('fast'));
    const isSuperFast = types.some(type => type.toLowerCase().includes('super'));
    
    if (isSuperFast) return '🔴';
    if (isFast) return '🟡';
    return '🟢';
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Find Charging Stations</h1>
          <p className="text-gray-600 mt-1">Discover nearby EV charging stations</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Info className="h-4 w-4" />
            <span>{showNotifications ? 'Hide' : 'Show'} Messages</span>
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
          
          <button
            onClick={getCurrentLocation}
            disabled={locationLoading}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            {locationLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Finding...</span>
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                <span>My Location</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications Section */}
      {showNotifications && notifications.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Messages & Updates</h3>
            <button
              onClick={clearAllNotifications}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          </div>
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 ${getNotificationStyles(notification.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <h4 className="font-medium">{notification.title}</h4>
                    <p className="text-sm mt-1">{notification.message}</p>
                    <p className="text-xs opacity-75 mt-2">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {!notification.persistent && (
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Stations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Charging Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="input-field"
              >
                <option value="">All Types</option>
                <option value="slow">Slow Charging</option>
                <option value="fast">Fast Charging</option>
                <option value="superfast">Super Fast Charging</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price (₹/hr)
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="Any price"
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plug Type
              </label>
              <select
                value={filters.plugType}
                onChange={(e) => handleFilterChange('plugType', e.target.value)}
                className="input-field"
              >
                <option value="">All Plugs</option>
                <option value="Type-1">Type-1</option>
                <option value="Type-2">Type-2</option>
                <option value="CCS">CCS</option>
                <option value="CHAdeMO">CHAdeMO</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distance (km)
              </label>
              <select
                value={filters.distance}
                onChange={(e) => handleFilterChange('distance', e.target.value)}
                className="input-field"
              >
                <option value="1000">1 km</option>
                <option value="3000">3 km</option>
                <option value="5000">5 km</option>
                <option value="10000">10 km</option>
                <option value="20000">20 km</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button onClick={applyFilters} className="btn-primary">
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="card p-0 overflow-hidden">
        <div className="h-96 md:h-[600px] relative">
          <MapContainer
            center={position}
            zoom={13}
            className="h-full w-full"
            style={{ minHeight: '400px' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <MapUpdater center={userLocation} />
            
            {/* User Location Marker */}
            {userLocation && (
              <Marker position={userLocation} icon={userLocationIcon}>
                <Popup>
                  <div className="text-center">
                    <div className="font-medium text-blue-600">Your Location</div>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Station Markers */}
            {stations.map(station => (
              <Marker 
                key={station._id} 
                position={[station.location.coordinates[1], station.location.coordinates[0]]}
              >
                <Popup className="station-popup">
                  <div className="min-w-80 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {getStationIcon(station.types)} {station.name}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{station.address}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4" />
                          <span>₹{station.price}/hour</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4" />
                          <span>{station.types.join(', ')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {station.isAvailable24x7 
                              ? 'Available 24/7' 
                              : station.availabilitySlots.map(slot => `${slot.start}-${slot.end}`).join(', ')
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Live Status Component */}
                    <LiveStatus stationId={station._id} showDetailed={true} />
                    
                    <div className="flex space-x-2">
                      <Link
                        to={`/booking/${station._id}/${station.price}`}
                        className="btn-primary flex-1 text-center"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Station List */}
      {stations.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Nearby Stations ({stations.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.map(station => (
              <div key={station._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {getStationIcon(station.types)} {station.name}
                  </h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{station.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>₹{station.price}/hour</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span>{station.types.join(', ')}</span>
                  </div>
                </div>
                
                {/* Station-specific messages below each card */}
                <div className="mb-3">
                  <LiveStatus stationId={station._id} showDetailed={true} />
                </div>
                
                <Link
                  to={`/booking/${station._id}/${station.price}`}
                  className="btn-primary w-full text-center"
                  onClick={() => {
                    addNotification('info', 'Booking Started', `Opening booking page for ${station.name}`);
                  }}
                >
                  Book Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Loading stations...</span>
          </div>
        </div>
      )}

      {/* No Stations Found */}
      {!loading && stations.length === 0 && (
        <div className="card">
          <div className="text-center py-12">
            <Zap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No charging stations found nearby</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or location</p>
          </div>
        </div>
      )}
    </div>
  );
} 