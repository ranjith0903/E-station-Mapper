import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, AlertCircle, CheckCircle, Zap, Loader2, Play } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingAvailability({ stationId, onSlotSelect }) {
  const [availability, setAvailability] = useState(null);
  const [stationStatus, setStationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [immediateBooking, setImmediateBooking] = useState(false);
  const [currentUserBooking, setCurrentUserBooking] = useState(null);

  useEffect(() => {
    fetchAvailability();
    fetchStationStatus();
    fetchCurrentUserBooking();
    
    // Refresh status every 30 seconds
    const statusInterval = setInterval(fetchStationStatus, 30000);
    return () => clearInterval(statusInterval);
  }, [stationId, selectedDate]);

  const fetchAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bookings/station/${stationId}/availability?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAvailability(data);
      } else {
        console.error('Failed to fetch availability');
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bookings/station/${stationId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setStationStatus(data);
      }
    } catch (err) {
      console.error('Error fetching station status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchCurrentUserBooking = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bookings?station=${stationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const bookings = await res.json();
        // Find current user's active booking (ongoing, confirmed, or pending for today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const activeBooking = bookings.find(booking => 
          booking.status === 'ongoing' || 
          (booking.status === 'confirmed' && new Date(booking.slot.start) >= today && new Date(booking.slot.start) < tomorrow) ||
          (booking.status === 'pending' && new Date(booking.slot.start) >= today && new Date(booking.slot.start) < tomorrow)
        );
        
        setCurrentUserBooking(activeBooking);
      }
    } catch (err) {
      console.error('Error fetching current user booking:', err);
    }
  };

  const handleImmediateBooking = () => {
    // Check if station is currently in use
    if (stationStatus?.ongoing) {
      toast.error('Station is currently in use. Please wait or book a future slot.');
      return;
    }

    // Check if there are immediate confirmed bookings
    if (stationStatus?.immediateConfirmed && stationStatus.immediateConfirmed.length > 0) {
      const nextBooking = stationStatus.immediateConfirmed[0];
      const startTime = new Date(nextBooking.slot.start);
      const now = new Date();
      const timeUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));
      
      toast.error(`Station is already booked. Next available in ${formatDuration(timeUntilStart)}`);
      return;
    }

    // Check if there are pending bookings in queue
    if (stationStatus?.queueLength > 0) {
      toast.error(`Station has ${stationStatus.queueLength} people in queue. Please wait or book a future slot.`);
      return;
    }

    // Create immediate booking slot (next 5 minutes)
    const now = new Date();
    const startTime = new Date(now.getTime() + 5 * 60 * 1000); // Start in 5 minutes
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const immediateSlot = {
      start: startTime,
      end: endTime,
      duration: 60,
      isImmediate: true
    };

    if (onSlotSelect) {
      onSlotSelect(immediateSlot);
    }
    
    setImmediateBooking(true);
    toast.success('Immediate booking selected! Complete your payment below.');
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric'
      });
    }
  };

  const handleSlotSelect = (slot) => {
    if (onSlotSelect) {
      onSlotSelect({
        start: slot.start,
        end: slot.end,
        duration: slot.duration
      });
    }
  };

  const getNextAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const getStationStatusDisplay = () => {
    if (statusLoading) {
      return (
        <div className="flex items-center space-x-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking status...</span>
        </div>
      );
    }

    if (!stationStatus) {
      return (
        <div className="flex items-center space-x-2 text-gray-500">
          <AlertCircle className="h-4 w-4" />
          <span>Status unavailable</span>
        </div>
      );
    }

    if (stationStatus.ongoing) {
      return (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Currently in use</span>
          </div>
          {stationStatus.estimatedWaitTime && (
            <div className="text-right">
              <div className="text-sm text-red-700">
                Wait time: {formatDuration(stationStatus.estimatedWaitTime)}
              </div>
              {stationStatus.queueLength > 0 && (
                <div className="text-xs text-red-600">
                  {stationStatus.queueLength} in queue
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Check if there are immediate confirmed bookings
    if (stationStatus.immediateConfirmed && stationStatus.immediateConfirmed.length > 0) {
      const nextBooking = stationStatus.immediateConfirmed[0];
      const startTime = new Date(nextBooking.slot.start);
      const now = new Date();
      const timeUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));
      
      return (
        <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Starting soon</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-yellow-700">
              Starts in: {formatDuration(timeUntilStart)}
            </div>
            <div className="text-xs text-yellow-600">
              {nextBooking.user?.name || 'User'} booked
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Available now</span>
        </div>
        <button
          onClick={handleImmediateBooking}
          className="btn-primary text-sm px-3 py-1"
        >
          <Play className="h-3 w-3 mr-1" />
          Book Now
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!availability) {
    return (
      <div className="card">
        <div className="flex items-center justify-center text-gray-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Availability unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Booking Availability</h3>
        <Calendar className="h-5 w-5 text-primary-600" />
      </div>

      {/* Current Station Status */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Current Status</h4>
        {getStationStatusDisplay()}
        
        {/* Current User's Booking */}
        {currentUserBooking && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Your Booking</span>
            </div>
            <div className="mt-1 text-sm text-blue-700">
              <div>Status: <span className="font-medium">{currentUserBooking.status.charAt(0).toUpperCase() + currentUserBooking.status.slice(1)}</span></div>
              <div>Time: {formatTime(currentUserBooking.slot.start)} - {formatTime(currentUserBooking.slot.end)}</div>
              {currentUserBooking.status === 'ongoing' && (
                <div className="text-xs text-blue-600 mt-1">
                  ⚡ Your session is active
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Warning Message for Unavailable Immediate Booking */}
        {stationStatus && (stationStatus.ongoing || (stationStatus.immediateConfirmed && stationStatus.immediateConfirmed.length > 0)) && !currentUserBooking && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Immediate booking not available</span>
            </div>
            <div className="mt-1 text-sm text-orange-700">
              {stationStatus.ongoing ? (
                <span>Station is currently in use. Please wait or book a future time slot.</span>
              ) : stationStatus.immediateConfirmed && stationStatus.immediateConfirmed.length > 0 ? (
                <span>Station is already booked. Check available time slots below.</span>
              ) : (
                <span>Please select a future time slot for booking.</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Date Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {getNextAvailableDates().map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                selectedDate === date 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {formatDate(date)}
            </button>
          ))}
        </div>
      </div>

      {/* Available Time Slots */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Available Time Slots</h4>
        {availability.availableSlots && availability.availableSlots.length > 0 ? (
          <div className="space-y-2">
            {availability.availableSlots.map((slot, index) => (
              <button
                key={index}
                onClick={() => handleSlotSelect(slot)}
                className="w-full p-3 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">
                      {formatTime(slot.start)} - {formatTime(slot.end)}
                    </span>
                  </div>
                  <span className="text-sm text-green-600">
                    {formatDuration(slot.duration)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No available slots for this date</p>
            <p className="text-sm">Try selecting a different date</p>
          </div>
        )}
      </div>

      {/* Future Bookings */}
      {availability.futureBookings && availability.futureBookings.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Future Bookings</span>
          </h4>
          <div className="space-y-2">
            {availability.futureBookings.slice(0, 5).map((booking) => (
              <div key={booking._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">
                    {booking.user?.name || 'User'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(booking.slot.start)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-700">
                    {formatTime(booking.slot.start)} - {formatTime(booking.slot.end)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDuration((new Date(booking.slot.end) - new Date(booking.slot.start)) / (1000 * 60))}
                  </div>
                </div>
              </div>
            ))}
            {availability.futureBookings.length > 5 && (
              <div className="text-xs text-gray-500 text-center">
                +{availability.futureBookings.length - 5} more scheduled bookings
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Tips */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h5 className="text-sm font-medium text-blue-800 mb-2">Booking Tips</h5>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Use "Book Now" for immediate charging if station is available</li>
          <li>• Book in advance to secure your preferred time slot</li>
          <li>• Sessions can be 1-24 hours long</li>
          <li>• You can start your session anytime within your booked slot</li>
          <li>• Check wait times if station is currently in use</li>
        </ul>
      </div>
    </div>
  );
} 