import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import { toast } from 'react-hot-toast';
import { 
  Truck, 
  MapPin, 
  Zap, 
  Clock, 
  DollarSign, 
  Phone, 
  Mail, 
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Car,
  Battery,
  Calendar,
  MessageSquare,
  CreditCard
} from 'lucide-react';
import OnWheelPaymentModal from '../components/OnWheelPaymentModal';

const RequestOnWheelService = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { service, userLocation } = location.state || {};

  const [formData, setFormData] = useState({
    serviceId: service?._id || '',
    requestLocation: {
      lat: userLocation?.[0] || 0,
      lng: userLocation?.[1] || 0,
      address: ''
    },
    vehicleInfo: {
      vehicleType: '',
      vehicleNumber: '',
      batteryLevel: '',
      requiredCharge: ''
    },
    chargingRequirements: {
      chargingType: '',
      plugType: '',
      estimatedDuration: ''
    },
    urgency: 'medium',
    contactInfo: {
      phone: '',
      email: '',
      additionalNotes: ''
    },
    schedule: {
      requestedTime: new Date().toISOString().slice(0, 16)
    }
  });

  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(userLocation || null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);

  const vehicleTypeOptions = ['electric-car', 'electric-bike', 'electric-scooter', 'hybrid', 'other'];
  const chargingTypeOptions = ['slow', 'fast', 'superfast'];
  const plugTypeOptions = ['Type-1', 'Type-2', 'CCS', 'CHAdeMO', 'Tesla Supercharger'];
  const urgencyOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600', bgColor: 'bg-green-50' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { value: 'high', label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { value: 'emergency', label: 'Emergency', color: 'text-red-600', bgColor: 'bg-red-50' }
  ];

  useEffect(() => {
    if (!service) {
      toast.error('No service selected. Please go back and select a service.');
      navigate('/onwheel-services');
      return;
    }

    // Get current location if not provided
    if (!currentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(location);
          setFormData(prev => ({
            ...prev,
            requestLocation: {
              ...prev.requestLocation,
              lat: location[0],
              lng: location[1]
            }
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location. Please set it manually.');
        }
      );
    }
  }, [service, currentLocation, navigate]);

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

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        setFormData(prev => ({
          ...prev,
          requestLocation: {
            ...prev.requestLocation,
            lat: e.latlng.lat,
            lng: e.latlng.lng
          }
        }));
      }
    });
    return null;
  };

  const calculateEstimatedCost = () => {
    if (!service || !formData.chargingRequirements.estimatedDuration) return 0;
    
    const basePrice = service.pricePerHour * parseFloat(formData.chargingRequirements.estimatedDuration);
    const travelFee = service.travelFee || 0;
    const total = basePrice + travelFee;
    
    return Math.max(total, service.minimumCharge || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/onwheel-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setCreatedRequest(data.request);
        setShowPaymentModal(true);
        toast.success('Service request created! Please complete payment.');
      } else {
        toast.error(data.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (request) => {
    setShowPaymentModal(false);
    toast.success('Payment successful! Your service request has been confirmed.');
    navigate('/my-onwheel-requests');
  };

  const customIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  const estimatedCost = calculateEstimatedCost();

  if (!service) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate('/onwheel-services')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Truck className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Request On-Wheel Service</h1>
              <p className="text-gray-600">{service.companyName} - {service.serviceName}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Service Summary
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm">${service.pricePerHour}/hour</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{service.responseTime}min response</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">{service.vehicleInfo.capacity}kW capacity</span>
                </div>
              </div>

              <div className="mt-3">
                <h4 className="font-medium text-blue-900 mb-2">Available Charging Types</h4>
                <div className="flex flex-wrap gap-1">
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

              <div className="mt-3">
                <h4 className="font-medium text-blue-900 mb-2">Available Plug Types</h4>
                <div className="flex flex-wrap gap-1">
                  {service.plugTypes.map(type => (
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

            {/* Request Location */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Request Location
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="requestLocation.address"
                    value={formData.requestLocation.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your address or location description"
                    required
                  />
                </div>
              </div>

              <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                <MapContainer
                  center={currentLocation || [0, 0]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapClickHandler />
                  {formData.requestLocation.lat !== 0 && (
                    <Marker
                      position={[formData.requestLocation.lat, formData.requestLocation.lng]}
                      icon={customIcon}
                    />
                  )}
                </MapContainer>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Click on the map to set your exact location
              </p>
            </div>

            {/* Vehicle Information */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    name="vehicleInfo.vehicleNumber"
                    value={formData.vehicleInfo.vehicleNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="e.g., ABC123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Battery Level (%) *
                  </label>
                  <input
                    type="number"
                    name="vehicleInfo.batteryLevel"
                    value={formData.vehicleInfo.batteryLevel}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    min="0"
                    max="100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Charge (kWh)
                  </label>
                  <input
                    type="number"
                    name="vehicleInfo.requiredCharge"
                    value={formData.vehicleInfo.requiredCharge}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    min="0"
                    step="0.1"
                    placeholder="e.g., 20"
                  />
                </div>
              </div>
            </div>

            {/* Charging Requirements */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Charging Requirements
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Charging Type *
                  </label>
                  <select
                    name="chargingRequirements.chargingType"
                    value={formData.chargingRequirements.chargingType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select charging type</option>
                    {chargingTypeOptions.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plug Type *
                  </label>
                  <select
                    name="chargingRequirements.plugType"
                    value={formData.chargingRequirements.plugType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select plug type</option>
                    {plugTypeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Duration (hours) *
                  </label>
                  <input
                    type="number"
                    name="chargingRequirements.estimatedDuration"
                    value={formData.chargingRequirements.estimatedDuration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0.5"
                    max="24"
                    step="0.5"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Urgency and Schedule */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Urgency & Schedule
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Urgency Level *
                  </label>
                  <div className="space-y-2">
                    {urgencyOptions.map(option => (
                      <label
                        key={option.value}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.urgency === option.value
                            ? 'border-orange-500 bg-orange-100'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="urgency"
                          value={option.value}
                          checked={formData.urgency === option.value}
                          onChange={handleInputChange}
                          className="mr-3"
                        />
                        <span className={`font-medium ${option.color}`}>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time
                  </label>
                  <input
                    type="datetime-local"
                    name="schedule.requestedTime"
                    value={formData.schedule.requestedTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Leave empty for immediate service
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
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
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="contactInfo.additionalNotes"
                  value={formData.contactInfo.additionalNotes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Any special instructions or additional information..."
                />
              </div>
            </div>

            {/* Cost Estimate */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Estimate
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">${estimatedCost.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Estimated Total</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-lg font-semibold text-blue-600">
                    ${service.pricePerHour}/hr
                  </div>
                  <div className="text-sm text-gray-600">Base Rate</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-lg font-semibold text-purple-600">
                    ${service.travelFee || 0}
                  </div>
                  <div className="text-sm text-gray-600">Travel Fee</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Note:</strong> This is an estimated cost. The final amount may vary based on actual charging time and any additional services required.
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/onwheel-services')}
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
                    Submitting...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Submit & Pay
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && createdRequest && (
        <OnWheelPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          requestId={createdRequest._id}
          amount={createdRequest.pricing.totalAmount}
          currency={createdRequest.pricing.currency}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default RequestOnWheelService;
