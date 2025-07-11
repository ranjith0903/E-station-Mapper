import React, { useState } from 'react';
import { Zap, DollarSign, Clock, Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import LocationPicker from '../components/LocationPicker';

export default function StationRegister() {
  const [coordinates, setCoordinates] = useState([20.5937, 78.9629]);
  const [address, setAddress] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    types: [],
    plugTypes: [],
    price: '',
    isAvailable24x7: false,
    availabilitySlots: []
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const chargingTypes = ['slow', 'fast', 'superfast'];
  const plugTypes = ['CCS', 'Type-1', 'CHAdeMO', 'Type-2'];

  const handleLocationSelect = (coords, selectedAddress) => {
    setCoordinates(coords);
    setAddress(selectedAddress);
    // Clear location error when user selects a location
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  const handlePlugTypeChange = (plugType) => {
    setFormData(prev => ({
      ...prev,
      plugTypes: prev.plugTypes.includes(plugType)
        ? prev.plugTypes.filter(p => p !== plugType)
        : [...prev.plugTypes, plugType]
    }));
  };

  const addAvailabilitySlot = () => {
    setFormData(prev => ({
      ...prev,
      availabilitySlots: [...prev.availabilitySlots, { start: '', end: '' }]
    }));
  };

  const updateAvailabilitySlot = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      availabilitySlots: prev.availabilitySlots.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const removeAvailabilitySlot = (index) => {
    setFormData(prev => ({
      ...prev,
      availabilitySlots: prev.availabilitySlots.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Station name is required';
    }

    if (!address.trim()) {
      newErrors.location = 'Please select a location using the address picker';
    }

    if (formData.types.length === 0) {
      newErrors.types = 'Please select at least one charging type';
    }

    if (formData.plugTypes.length === 0) {
      newErrors.plugTypes = 'Please select at least one plug type';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    // Validate availability slots only if not 24/7
    if (!formData.isAvailable24x7) {
      if (formData.availabilitySlots.length === 0) {
        newErrors.availabilitySlots = 'Please add at least one availability slot';
      } else {
        formData.availabilitySlots.forEach((slot, index) => {
          if (!slot.start || !slot.end) {
            newErrors.availabilitySlots = 'Please fill all time slots';
          }
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const body = {
        name: formData.name,
        address: address,
        location: { type: 'Point', coordinates: [coordinates[1], coordinates[0]] },
        types: formData.types,
        plugTypes: formData.plugTypes,
        price: Number(formData.price),
        isAvailable24x7: formData.isAvailable24x7,
        availabilitySlots: formData.isAvailable24x7 ? [] : formData.availabilitySlots
      };

      const res = await fetch('/api/stations/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success('Station registered successfully!');
        // Reset form
        setFormData({
          name: '',
          types: [],
          plugTypes: [],
          price: '',
          isAvailable24x7: false,
          availabilitySlots: []
        });
        setCoordinates([20.5937, 78.9629]);
        setAddress('');
      } else {
        toast.error(data.error || 'Failed to register station');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Register Your Station</h1>
        <p className="text-gray-600 mt-1">
          Add your charging station to help EV users find and book your services
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Station Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Station Name *
            </label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={`input-field ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter station name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Location Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <LocationPicker onLocationSelect={handleLocationSelect} />
            {address && (
              <p className="mt-2 text-sm text-gray-600">{address}</p>
            )}
            {errors.location && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.location}
              </p>
            )}
          </div>

          {/* Charging Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Charging Types *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {chargingTypes.map(type => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.types.includes(type)}
                    onChange={() => handleTypeChange(type)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
            {errors.types && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.types}
              </p>
            )}
          </div>

          {/* Plug Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plug Types *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plugTypes.map(plugType => (
                <label key={plugType} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.plugTypes.includes(plugType)}
                    onChange={() => handlePlugTypeChange(plugType)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{plugType}</span>
                </label>
              ))}
            </div>
            {errors.plugTypes && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.plugTypes}
              </p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price per Hour (₹) *
            </label>
            <input
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              className={`input-field ${errors.price ? 'border-red-500' : ''}`}
              placeholder="Enter price per hour"
              min="0"
              step="0.01"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.price}
              </p>
            )}
          </div>

          {/* 24/7 Availability Option */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isAvailable24x7"
                checked={formData.isAvailable24x7}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Available 24/7 (Always Open)
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Check this if your station is available round the clock. If unchecked, you'll need to specify specific time slots below.
            </p>
          </div>

          {/* Availability Slots - Only show if not 24/7 */}
          {!formData.isAvailable24x7 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Availability Slots *
                </label>
                <button
                  type="button"
                  onClick={addAvailabilitySlot}
                  className="btn-secondary flex items-center space-x-1 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Slot</span>
                </button>
              </div>
              
              {formData.availabilitySlots.length === 0 ? (
                <p className="text-sm text-gray-500">No availability slots added yet.</p>
              ) : (
                <div className="space-y-3">
                  {formData.availabilitySlots.map((slot, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateAvailabilitySlot(index, 'start', e.target.value)}
                        className="input-field flex-1"
                        placeholder="Start time"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateAvailabilitySlot(index, 'end', e.target.value)}
                        className="input-field flex-1"
                        placeholder="End time"
                      />
                      <button
                        type="button"
                        onClick={() => removeAvailabilitySlot(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {errors.availabilitySlots && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.availabilitySlots}
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Register Station</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 