import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import { toast } from 'react-hot-toast';
import { 
  Truck, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  DollarSign, 
  MapPin, 
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const OnWheelServiceRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    serviceName: '',
    description: '',
    serviceArea: {
      lat: 0,
      lng: 0,
      radius: 50
    },
    chargingTypes: [],
    plugTypes: [],
    pricePerHour: '',
    pricePerUnit: '',
    minimumCharge: '',
    travelFee: '',
    maxDistance: '',
    responseTime: '',
    availability: {
      isAvailable24x7: false,
      workingHours: []
    },
    contactInfo: {
      phone: '',
      email: '',
      whatsapp: '',
      website: ''
    },
    vehicleInfo: {
      vehicleType: '',
      capacity: '',
      batteryCapacity: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const chargingTypeOptions = ['slow', 'fast', 'superfast'];
  const plugTypeOptions = ['Type-1', 'Type-2', 'CCS', 'CHAdeMO', 'Tesla Supercharger'];
  const vehicleTypeOptions = ['mobile-charger-van', 'truck', 'car', 'motorcycle'];
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setFormData(prev => ({
            ...prev,
            serviceArea: {
              ...prev.serviceArea,
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location. Please set it manually.');
        }
      );
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleArrayChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleWorkingHoursChange = (day, field, value) => {
    setFormData(prev => {
      const existingDay = prev.availability.workingHours.find(h => h.day === day);
      const updatedHours = existingDay 
        ? prev.availability.workingHours.map(h => 
            h.day === day ? { ...h, [field]: value } : h
          )
        : [...prev.availability.workingHours, { day, [field]: value }];
      
      return {
        ...prev,
        availability: {
          ...prev.availability,
          workingHours: updatedHours
        }
      };
    });
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        setFormData(prev => ({
          ...prev,
          serviceArea: {
            ...prev.serviceArea,
            lat: e.latlng.lat,
            lng: e.latlng.lng
          }
        }));
      }
    });
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/onwheel-services/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Service registered successfully!');
        navigate('/my-onwheel-services');
      } else {
        toast.error(data.message || 'Failed to register service');
      }
    } catch (error) {
      console.error('Error registering service:', error);
      toast.error('Failed to register service');
    } finally {
      setLoading(false);
    }
  };

  const customIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Truck className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Register On-Wheel Service</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    name="serviceName"
                    value={formData.serviceName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your mobile charging service..."
                  required
                />
              </div>
            </div>

            {/* Service Area */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-green-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Service Area
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Radius (km) *
                  </label>
                  <input
                    type="number"
                    name="serviceArea.radius"
                    value={formData.serviceArea.radius}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="1"
                    max="200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Travel Distance (km) *
                  </label>
                  <input
                    type="number"
                    name="maxDistance"
                    value={formData.maxDistance}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="1"
                    max="500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response Time (minutes) *
                  </label>
                  <input
                    type="number"
                    name="responseTime"
                    value={formData.responseTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="5"
                    max="120"
                    required
                  />
                </div>
              </div>

              <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                <MapContainer
                  center={userLocation || [0, 0]}
                  zoom={10}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapClickHandler />
                  {formData.serviceArea.lat !== 0 && (
                    <Marker
                      position={[formData.serviceArea.lat, formData.serviceArea.lng]}
                      icon={customIcon}
                    />
                  )}
                </MapContainer>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Click on the map to set your service base location
              </p>
            </div>

            {/* Charging Capabilities */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Charging Capabilities
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Charging Types *
                  </label>
                  <div className="space-y-2">
                    {chargingTypeOptions.map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.chargingTypes.includes(type)}
                          onChange={(e) => handleArrayChange('chargingTypes', type, e.target.checked)}
                          className="mr-2"
                        />
                        <span className="capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Plug Types *
                  </label>
                  <div className="space-y-2">
                    {plugTypeOptions.map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.plugTypes.includes(type)}
                          onChange={(e) => handleArrayChange('plugTypes', type, e.target.checked)}
                          className="mr-2"
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Type *
                  </label>
                  <select
                    name="vehicleInfo.vehicleType"
                    value={formData.vehicleInfo.vehicleType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  >
                    <option value="">Select vehicle type</option>
                    {vehicleTypeOptions.map(type => (
                      <option key={type} value={type}>
                        {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Charging Capacity (kW) *
                  </label>
                  <input
                    type="number"
                    name="vehicleInfo.capacity"
                    value={formData.vehicleInfo.capacity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    min="1"
                    max="500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Battery Capacity (kWh)
                  </label>
                  <input
                    type="number"
                    name="vehicleInfo.batteryCapacity"
                    value={formData.vehicleInfo.batteryCapacity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    min="0"
                    max="1000"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Hour ($) *
                  </label>
                  <input
                    type="number"
                    name="pricePerHour"
                    value={formData.pricePerHour}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Unit ($/kWh)
                  </label>
                  <input
                    type="number"
                    name="pricePerUnit"
                    value={formData.pricePerUnit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Charge ($)
                  </label>
                  <input
                    type="number"
                    name="minimumCharge"
                    value={formData.minimumCharge}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Travel Fee ($)
                  </label>
                  <input
                    type="number"
                    name="travelFee"
                    value={formData.travelFee}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="contactInfo.phone"
                    value={formData.contactInfo.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="contactInfo.email"
                    value={formData.contactInfo.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    name="contactInfo.whatsapp"
                    value={formData.contactInfo.whatsapp}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="contactInfo.website"
                    value={formData.contactInfo.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-orange-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Availability
              </h2>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="availability.isAvailable24x7"
                    checked={formData.availability.isAvailable24x7}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Available 24/7
                  </span>
                </label>
              </div>

              {!formData.availability.isAvailable24x7 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Working Hours</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {daysOfWeek.map(day => (
                      <div key={day} className="border border-gray-200 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 capitalize mb-2">{day}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="time"
                            onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Start"
                          />
                          <input
                            type="time"
                            onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="End"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Register Service
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnWheelServiceRegister;
