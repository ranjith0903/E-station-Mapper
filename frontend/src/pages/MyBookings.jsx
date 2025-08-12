import React, { useEffect, useState } from 'react';
import { Zap, MapPin, Clock, DollarSign, XCircle, Loader2, CheckCircle, AlertCircle, Play, Square, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import ReviewPromptModal from '../components/ReviewPromptModal';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [startingSession, setStartingSession] = useState(null);
  const [endingSession, setEndingSession] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, ongoing, completed, cancelled
  const [reviewModal, setReviewModal] = useState({ isOpen: false, booking: null });
  const [reviewedBookings, setReviewedBookings] = useState(new Set());

  useEffect(() => {
    fetchBookings();
    // Load reviewed bookings from localStorage
    const savedReviewedBookings = localStorage.getItem('reviewedBookings');
    if (savedReviewedBookings) {
      setReviewedBookings(new Set(JSON.parse(savedReviewedBookings)));
    }
  }, []);

  // Show review prompt for unreviewed completed bookings after loading
  useEffect(() => {
    if (!loading && bookings.length > 0) {
      const unreviewedCompleted = bookings.filter(b => 
        b.status === 'completed' && !reviewedBookings.has(b._id)
      );
      
      // Check if user has disabled review prompts
      const dontShowPrompts = localStorage.getItem('dontShowReviewPrompts') === 'true';
      
      // Only show review prompt if user hasn't seen it recently (once per session)
      const hasShownReviewThisSession = sessionStorage.getItem('hasShownReviewThisSession') === 'true';
      
      // Show review prompt for the most recent unreviewed booking
      if (unreviewedCompleted.length > 0 && !reviewModal.isOpen && !dontShowPrompts && !hasShownReviewThisSession) {
        const mostRecent = unreviewedCompleted.sort((a, b) => 
          new Date(b.actualEnd || b.updatedAt) - new Date(a.actualEnd || a.updatedAt)
        )[0];
        
        // Show prompt after a longer delay and mark as shown
        setTimeout(() => {
          setReviewModal({ isOpen: true, booking: mostRecent });
          sessionStorage.setItem('hasShownReviewThisSession', 'true');
        }, 5000); // Increased delay to 5 seconds
      }
    }
  }, [loading, bookings, reviewedBookings, reviewModal.isOpen]);

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
        const updatedBooking = await res.json();
        toast.success('Charging session ended');
        setBookings(prev => prev.map(b => b._id === bookingId ? updatedBooking : b));
        
        // Show review prompt after a short delay
        setTimeout(() => {
          setReviewModal({ isOpen: true, booking: updatedBooking });
        }, 1000);
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

  // Check for unreviewed completed bookings
  const unreviewedCompletedBookings = bookings.filter(b => 
    b.status === 'completed' && !reviewedBookings.has(b._id)
  );

  // Review submission handler
  const handleSubmitReview = async (stationId, reviewData) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/reviews/${stationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(reviewData)
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to submit review');
    }

    // Mark this booking as reviewed
    if (reviewModal.booking) {
      const newReviewedBookings = new Set([...reviewedBookings, reviewModal.booking._id]);
      setReviewedBookings(newReviewedBookings);
      localStorage.setItem('reviewedBookings', JSON.stringify([...newReviewedBookings]));
    }
  };

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

      {/* Review Reminder Banner - Only show if user hasn't disabled prompts */}
      {unreviewedCompletedBookings.length > 0 && localStorage.getItem('dontShowReviewPrompts') !== 'true' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">
                  Review Your Experience
                </h3>
                <p className="text-sm text-blue-700">
                  You have {unreviewedCompletedBookings.length} completed charging session{unreviewedCompletedBookings.length > 1 ? 's' : ''} to review
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setReviewModal({ isOpen: true, booking: unreviewedCompletedBookings[0] })}
                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                Review Now
              </button>
              <button
                onClick={() => localStorage.setItem('dontShowReviewPrompts', 'true')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center text-green-600 text-xs">
                      <CheckCircle className="h-4 w-4 mr-1" /> Completed
                    </span>
                    {!reviewedBookings.has(booking._id) && (
                      <button
                        onClick={() => setReviewModal({ isOpen: true, booking })}
                        className="btn-secondary flex items-center space-x-1 text-xs"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>Review</span>
                      </button>
                    )}
                  </div>
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

      {/* Review Prompt Modal */}
      <ReviewPromptModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ isOpen: false, booking: null })}
        booking={reviewModal.booking}
        onSubmitReview={handleSubmitReview}
      />
    </div>
  );
} 