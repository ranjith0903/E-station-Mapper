import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import { toast } from 'react-hot-toast';
import { 
  Truck, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  DollarSign, 
  MapPin, 
  Zap,
  Phone,
  Mail,
  Navigation,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import BookNowButton from '../components/BookNowButton';

const OnWheelServices = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    radius: 50,
    chargingType: '',
    plugType: '',
    maxPrice: '',
    urgency: 'medium'
  });

  const chargingTypeOptions = ['slow', 'fast', 'superfast'];
  const plugTypeOptions = ['Type-1', 'Type-2', 'CCS', 'CHAdeMO', 'Tesla Supercharger'];
  const urgencyOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'emergency', label: 'Emergency', color: 'text-red-600' }
  ];

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = [position.coords.latitude, position.coords.longitude];
          setUserLocation(location);
          fetchNearbyServices(location[0], location[1]);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location. Please enable location access.');
        }
      );
    }
  }, []);

  const fetchNearbyServices = async (lat, lng) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat,
        lng,
        radius: filters.radius,
        ...(filters.chargingType && { chargingType: filters.chargingType }),
        ...(filters.plugType && { plugType: filters.plugType }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice })
      });

      const response = await fetch(`/api/onwheel-services/nearby?${params}`);
      const data = await response.json();

      if (response.ok) {
        setServices(data);
      } else {
        toast.error(data.message || 'Failed to fetch services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    if (userLocation) {
      fetchNearbyServices(userLocation[0], userLocation[1]);
    }
    setShowFilters(false);
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
  };



  const customIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  const truckIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEgM0gxN1YxN0gxVjNaTTE3IDE3SDE5VjE5SDE3VjE3Wk0xNyAxN0gxNVYxOUgxN1YxN1pNMTcgMTdIMjFWMjBIMTdWMTdaTTE3IDE3SDE5VjE1SDE3VjE3Wk0xNyAxN0gxNVYxNUgxN1YxN1oiIHN0cm9rZT0iIzM2N0Y5NyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">On-Wheel Charging Services</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Search Filters
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Radius (km)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={filters.radius}
                    onChange={(e) => handleFilterChange('radius', e.target.value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10km</span>
                    <span>{filters.radius}km</span>
                    <span>200km</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Charging Type
                  </label>
                  <select
                    value={filters.chargingType}
                    onChange={(e) => handleFilterChange('chargingType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    {chargingTypeOptions.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plug Type
                  </label>
                  <select
                    value={filters.plugType}
                    onChange={(e) => handleFilterChange('plugType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Plugs</option>
                    {plugTypeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price per Hour ($)
                  </label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="No limit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={applyFilters}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search Services
                </button>
              </div>

              {/* Service List */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Available Services ({services.length})
                </h3>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No services found in your area</p>
                    <p className="text-sm">Try adjusting your filters or increasing the search radius</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {services.map((service) => (
                      <div
                        key={service._id}
                        onClick={() => handleServiceSelect(service)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedService?._id === service._id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{service.companyName}</h4>
                            <p className="text-sm text-gray-600">{service.serviceName}</p>
                            
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span>{service.ratings.averageRating.toFixed(1)}</span>
                                <span>({service.ratings.totalReviews})</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>${service.pricePerHour}/hr</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{service.responseTime}min</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1 mt-2">
                              {service.chargingTypes.map(type => (
                                <span
                                  key={type}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          {service.isPremium && (
                            <div className="ml-2">
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                Premium
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Book Now Button */}
                        <div className="mt-3">
                          <BookNowButton service={service} userLocation={userLocation} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map and Service Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* Map */}
              <div className="h-96 relative">
                {userLocation ? (
                  <MapContainer
                    center={userLocation}
                    zoom={10}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {/* User location */}
                    <Marker position={userLocation} icon={customIcon}>
                      <Popup>
                        <div className="text-center">
                          <strong>Your Location</strong>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Service areas */}
                    {services.map((service) => (
                      <Circle
                        key={service._id}
                        center={[service.serviceArea.coordinates[1], service.serviceArea.coordinates[0]]}
                        radius={service.serviceArea.radius * 1000}
                        pathOptions={{
                          color: selectedService?._id === service._id ? '#3B82F6' : '#10B981',
                          fillColor: selectedService?._id === service._id ? '#3B82F6' : '#10B981',
                          fillOpacity: 0.2,
                          weight: 2
                        }}
                      />
                    ))}

                    {/* Service markers */}
                    {services.map((service) => (
                      <Marker
                        key={service._id}
                        position={[service.serviceArea.coordinates[1], service.serviceArea.coordinates[0]]}
                        icon={truckIcon}
                        eventHandlers={{
                          click: () => handleServiceSelect(service)
                        }}
                      >
                        <Popup>
                          <div className="min-w-[200px]">
                            <h3 className="font-semibold text-gray-900">{service.companyName}</h3>
                            <p className="text-sm text-gray-600">{service.serviceName}</p>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <span>${service.pricePerHour}/hr</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{service.responseTime}min response</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{service.serviceArea.radius}km radius</span>
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-500">Loading your location...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Service Details */}
              {selectedService && (
                <div className="p-6 border-t">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedService.companyName}</h2>
                      <p className="text-gray-600">{selectedService.serviceName}</p>
                    </div>
                    <button
                      onClick={() => setSelectedService(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Service Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span>${selectedService.pricePerHour}/hour</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span>{selectedService.responseTime} minutes response time</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-purple-600" />
                          <span>{selectedService.serviceArea.radius}km service radius</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <span>{selectedService.vehicleInfo.capacity}kW charging capacity</span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Charging Types</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedService.chargingTypes.map(type => (
                            <span
                              key={type}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Plug Types</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedService.plugTypes.map(type => (
                            <span
                              key={type}
                              className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-blue-600" />
                          <span>{selectedService.contactInfo.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-green-600" />
                          <span>{selectedService.contactInfo.email}</span>
                        </div>
                        {selectedService.contactInfo.whatsapp && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-600" />
                            <span>WhatsApp: {selectedService.contactInfo.whatsapp}</span>
                          </div>
                        )}
                        {selectedService.contactInfo.website && (
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-purple-600" />
                            <a
                              href={selectedService.contactInfo.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Rating & Reviews</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= selectedService.ratings.averageRating
                                    ? 'text-yellow-500 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {selectedService.ratings.averageRating.toFixed(1)} ({selectedService.ratings.totalReviews} reviews)
                          </span>
                        </div>
                      </div>

                      <div className="mt-6">
                        <BookNowButton service={selectedService} userLocation={userLocation} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnWheelServices;
