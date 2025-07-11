import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Calendar, Clock, DollarSign, MapPin, Zap, CreditCard, AlertCircle, CheckCircle, Play } from 'lucide-react';
import BookingAvailability from '../components/BookingAvailability';
import toast from 'react-hot-toast';

const stripePromise = loadStripe('pk_test_51QBqViHVrEESOxZHwP3ur6Ga3060peMawzOmlj7qrPi5IWPLdVRHtUjyudYiXT874RgzwpKtYu46QyRsJkHqaF8C00heb4jEYZ');

function BookingForm({ stationId, amount, station }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    hours: 1
  });
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showAvailability, setShowAvailability] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    
    // Auto-fill the form with selected slot
    const startDate = new Date(slot.start);
    const endDate = new Date(slot.end);
    
    setFormData(prev => ({
      ...prev,
      date: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: endDate.toTimeString().slice(0, 5),
      hours: Math.ceil(slot.duration / 60)
    }));
    
    setShowAvailability(false);
    
    if (slot.isImmediate) {
      toast.success('Immediate booking selected! You can start charging in 5 minutes.');
    } else {
      toast.success('Time slot selected! Complete your booking details below.');
    }
  };

  const calculateEndTime = (startTime, hours) => {
    if (!startTime) return '';
    const [hours_, minutes] = startTime.split(':');
    const startDate = new Date();
    startDate.setHours(parseInt(hours_), parseInt(minutes), 0);
    startDate.setHours(startDate.getHours() + parseInt(hours));
    return startDate.toTimeString().slice(0, 5);
  };

  const handleHoursChange = (e) => {
    const hours = parseInt(e.target.value);
    setFormData(prev => ({ 
      ...prev, 
      hours,
      endTime: calculateEndTime(prev.startTime, hours)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Please select a start time';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Please select an end time';
    }

    if (formData.hours < 1) {
      newErrors.hours = 'Minimum booking is 1 hour';
    }

    if (formData.hours > 24) {
      newErrors.hours = 'Maximum booking is 24 hours';
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

    if (!stripe || !elements) {
      toast.error('Stripe is not loaded');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      // Calculate total amount
      const totalAmount = amount * formData.hours;
      
      console.log('Creating payment intent for amount:', totalAmount);
      
      // 1. Create payment intent
      const paymentRes = await fetch('/api/payment/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: totalAmount })
      });

      console.log('Payment intent response status:', paymentRes.status);

      if (!paymentRes.ok) {
        const errorData = await paymentRes.json().catch(() => ({}));
        console.error('Payment intent error:', errorData);
        throw new Error(errorData.error || `Payment failed: ${paymentRes.status}`);
      }

      const { clientSecret } = await paymentRes.json();
      console.log('Payment intent created successfully');

      // 2. Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: billingDetails.name || 'EV User',
            email: billingDetails.email,
            phone: billingDetails.phone,
          },
        }
      });

      if (result.error) {
        console.error('Stripe payment error:', result.error);
        toast.error(result.error.message || 'Payment failed');
        return;
      }

      console.log('Payment confirmed successfully');

      // 3. Create booking
      const slot = {
        start: new Date(`${formData.date}T${formData.startTime}`),
        end: new Date(`${formData.date}T${formData.endTime}`)
      };

      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          station: stationId, 
          slot, 
          amount: totalAmount, 
          paymentIntentId: result.paymentIntent.id,
          isImmediate: selectedSlot?.isImmediate || false
        })
      });

      if (bookingRes.ok) {
        toast.success('Booking confirmed! Check your email for details.');
        navigate('/dashboard');
      } else {
        const bookingData = await bookingRes.json();
        console.error('Booking creation error:', bookingData);
        toast.error(bookingData.error || 'Booking failed');
      }
    } catch (err) {
      console.error('Booking error:', err);
      toast.error(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = amount * formData.hours;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Book Charging Station</h1>
        <p className="text-gray-600 mt-1">Complete your booking and payment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Availability and Station Info */}
        <div className="space-y-6">
          {/* Station Info */}
          {station && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Station Details</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  <span className="font-medium">{station.name}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{station.address}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Zap className="h-4 w-4" />
                  <span>{station.types.join(', ')} • {station.plugTypes.join(', ')}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span>₹{station.price}/hour</span>
                </div>
              </div>
            </div>
          )}

          {/* Availability Component */}
          <BookingAvailability 
            stationId={stationId} 
            onSlotSelect={handleSlotSelect}
          />
        </div>

        {/* Right Column - Booking Form */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Booking Details</h2>
              {!showAvailability && (
                <button
                  onClick={() => setShowAvailability(true)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Change Time Slot
                </button>
              )}
            </div>

            {selectedSlot && (
              <div className={`mb-4 p-3 border rounded-lg ${
                selectedSlot.isImmediate 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {selectedSlot.isImmediate ? (
                    <Play className="h-4 w-4 text-blue-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    selectedSlot.isImmediate ? 'text-blue-800' : 'text-green-800'
                  }`}>
                    {selectedSlot.isImmediate ? 'Immediate Booking' : 'Selected Time Slot'}
                  </span>
                </div>
                <div className={`mt-1 text-sm ${
                  selectedSlot.isImmediate ? 'text-blue-700' : 'text-green-700'
                }`}>
                  {new Date(selectedSlot.start).toLocaleDateString()} • {new Date(selectedSlot.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedSlot.end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  {selectedSlot.isImmediate && (
                    <div className="mt-1 text-xs font-medium">
                      ⚡ Start charging in 5 minutes
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date and Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`input-field ${errors.date ? 'border-red-500' : ''}`}
                    disabled={selectedSlot}
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.date}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleChange}
                    className={`input-field ${errors.startTime ? 'border-red-500' : ''}`}
                    disabled={selectedSlot}
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.startTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Hours Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Hours) *
                </label>
                <select
                  name="hours"
                  value={formData.hours}
                  onChange={handleHoursChange}
                  className={`input-field ${errors.hours ? 'border-red-500' : ''}`}
                  disabled={selectedSlot}
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12, 24].map(hour => (
                    <option key={hour} value={hour}>
                      {hour} {hour === 1 ? 'Hour' : 'Hours'}
                    </option>
                  ))}
                </select>
                {errors.hours && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.hours}
                  </p>
                )}
              </div>

              {/* End Time Display */}
              {formData.startTime && formData.hours && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>End Time: {formData.endTime}</span>
                  </div>
                </div>
              )}

              {/* Payment Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                
                <div className="space-y-4">
                  {/* Amount Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Rate per hour:</span>
                      <span>₹{amount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Duration:</span>
                      <span>{formData.hours} hour{formData.hours > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold text-lg border-t pt-2 mt-2">
                      <span>Total Amount:</span>
                      <span>₹{totalAmount}</span>
                    </div>
                  </div>

                  {/* Billing Details */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={billingDetails.name}
                        onChange={(e) => setBillingDetails(prev => ({ ...prev, name: e.target.value }))}
                        className="input-field"
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={billingDetails.email}
                        onChange={(e) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))}
                        className="input-field"
                        placeholder="Enter your email"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={billingDetails.phone}
                        onChange={(e) => setBillingDetails(prev => ({ ...prev, phone: e.target.value }))}
                        className="input-field"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  {/* Card Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Details
                    </label>
                    <div className="border border-gray-300 rounded-md p-3">
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: '#424770',
                              '::placeholder': {
                                color: '#aab7c4',
                              },
                            },
                            invalid: {
                              color: '#9e2146',
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !selectedSlot}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Booking() {
  const { stationId, amount } = useParams();
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStation = async () => {
      try {
        const res = await fetch(`/api/stations/${stationId}`);
        if (res.ok) {
          const data = await res.json();
          setStation(data);
        }
      } catch (err) {
        console.error('Error fetching station:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStation();
  }, [stationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <BookingForm stationId={stationId} amount={parseFloat(amount)} station={station} />
    </Elements>
  );
} 