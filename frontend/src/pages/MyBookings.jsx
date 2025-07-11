import React, { useEffect, useState } from 'react';
import { Zap, MapPin, Clock, DollarSign, XCircle, Loader2, CheckCircle, AlertCircle, Play, Square } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [startingSession, setStartingSession] = useState(null);
  const [endingSession, setEndingSession] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, ongoing, completed, cancelled

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
      } else {
        toast.error('Failed to fetch bookings');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    setCancelling(bookingId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success('Booking cancelled');
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to cancel booking');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setCancelling(null);
    }
  };

  const handleStartSession = async (bookingId) => {
    setStartingSession(bookingId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bookings/${bookingId}/start`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success('Charging session started');
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'ongoing', actualStart: new Date() } : b));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to start session');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setStartingSession(null);
    }
  };

  const handleEndSession = async (bookingId) => {
    setEndingSession(bookingId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bookings/${bookingId}/end`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success('Charging session ended');
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'completed', actualEnd: new Date() } : b));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to end session');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setEndingSession(null);
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getSessionDuration = (booking) => {
    if (booking.status === 'ongoing' && booking.actualStart) {
      const duration = Math.floor((Date.now() - new Date(booking.actualStart).getTime()) / (1000 * 60));
      return formatDuration(duration);
    }
    if (booking.status === 'completed' && booking.sessionDuration) {
      return formatDuration(booking.sessionDuration);
    }
    return null;
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  // Google Maps Directions Handler
  const handleDirections = (station) => {
    if (!station || !station.location) return toast.error('Station location not available');
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    toast.loading('Getting your location...');
    navigator.geolocation.getCurrentPosition(
      pos => {
        toast.dismiss();
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const destLat = station.location.coordinates[1];
        const destLng = station.location.coordinates[0];
        const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=driving`;
        window.open(url, '_blank');
      },
      err => {
        toast.dismiss();
        toast.error('Could not get your location');
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">Track your previous and pending bookings</p>
        </div>
        <div className="flex space-x-2">
          {['all', 'pending', 'ongoing', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === status ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Zap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No bookings found</p>
          </div>
        ) : (
          filteredBookings.map(booking => (
            <div key={booking._id} className="card flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 md:space-x-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">{booking.station?.name || 'Station'}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{booking.station?.address || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {booking.slot?.start ? new Date(booking.slot.start).toLocaleString() : 'N/A'}
                    {' '}to{' '}
                    {booking.slot?.end ? new Date(booking.slot.end).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                  <DollarSign className="h-4 w-4" />
                  <span>₹{booking.amount}</span>
                </div>
                
                {/* Session Duration */}
                {getSessionDuration(booking) && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600 mt-1">
                    <Clock className="h-4 w-4" />
                    <span>Session: {getSessionDuration(booking)}</span>
                  </div>
                )}
                
                {booking.status === 'cancelled' && booking.cancelReason && (
                  <div className="flex items-center space-x-2 text-xs text-red-600 mt-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{booking.cancelReason}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-2 md:space-y-0 md:space-x-2 md:flex-row md:items-center">
                {booking.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStartSession(booking._id)}
                      disabled={startingSession === booking._id}
                      className="btn-primary flex items-center space-x-2"
                    >
                      {startingSession === booking._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      <span>Start</span>
                    </button>
                    <button
                      onClick={() => handleCancel(booking._id)}
                      disabled={cancelling === booking._id}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      {cancelling === booking._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
                
                {booking.status === 'ongoing' && (
                  <button
                    onClick={() => handleEndSession(booking._id)}
                    disabled={endingSession === booking._id}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    {endingSession === booking._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    <span>End Session</span>
                  </button>
                )}
                
                {booking.status === 'completed' && (
                  <span className="flex items-center text-green-600 text-xs mt-2 md:mt-0">
                    <CheckCircle className="h-4 w-4 mr-1" /> Completed
                  </span>
                )}
                
                {booking.status === 'cancelled' && (
                  <span className="flex items-center text-red-600 text-xs mt-2 md:mt-0">
                    <XCircle className="h-4 w-4 mr-1" /> Cancelled
                  </span>
                )}
                {booking.station && booking.station.location && (
                  <button
                    className="btn-secondary"
                    onClick={() => handleDirections(booking.station)}
                  >
                    Get Directions
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 