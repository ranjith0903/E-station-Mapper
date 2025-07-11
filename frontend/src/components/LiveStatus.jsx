import React, { useState, useEffect } from 'react';
import { Zap, Clock, Users, Loader2, CheckCircle, AlertCircle, Info, Star, Battery } from 'lucide-react';

export default function LiveStatus({ stationId, showDetailed = false }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [stationId]);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bookings/station/${stationId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('Station status data:', data); // Debug log
        setStatus(data);
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getStatusMessage = () => {
    if (!status) return null;
    
    // Check if there's an ongoing booking or estimated wait time
    const hasOngoingBooking = status.ongoing || (status.estimatedWaitTime && status.estimatedWaitTime > 0);
    
    if (hasOngoingBooking) {
      if (status.estimatedWaitTime <= 5) {
        return {
          type: 'success',
          message: 'Almost ready! Will be available soon.',
          icon: <CheckCircle className="h-4 w-4 text-green-600" />
        };
      } else if (status.estimatedWaitTime <= 15) {
        return {
          type: 'warning',
          message: 'Short wait time. Consider booking this slot.',
          icon: <Clock className="h-4 w-4 text-yellow-600" />
        };
      } else {
        return {
          type: 'error',
          message: 'Long wait time. Consider other stations or book for later.',
          icon: <AlertCircle className="h-4 w-4 text-red-600" />
        };
      }
    } else {
      return {
        type: 'success',
        message: 'Ready for immediate booking!',
        icon: <CheckCircle className="h-4 w-4 text-green-600" />
      };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking status...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Status unavailable</span>
      </div>
    );
  }

  const statusMessage = getStatusMessage();

  // Check if there's any booking activity (ongoing, confirmed, or pending)
  const hasAnyBooking = status.ongoing || 
                       (status.immediateConfirmed && status.immediateConfirmed.length > 0) ||
                       (status.immediateQueue && status.immediateQueue.length > 0) ||
                       (status.estimatedWaitTime && status.estimatedWaitTime > 0);
  const hasQueue = status.queueLength > 0;

  console.log('LiveStatus debug:', {
    stationId,
    hasAnyBooking,
    hasQueue,
    estimatedWaitTime: status.estimatedWaitTime,
    ongoing: status.ongoing,
    immediateConfirmed: status.immediateConfirmed,
    immediateQueue: status.immediateQueue,
    queueLength: status.queueLength
  });

  if (hasAnyBooking) {
    return (
      <div className="space-y-2">
        <div className={`flex items-center justify-between p-3 rounded-md ${
          status.estimatedWaitTime <= 5 ? 'bg-green-50 border border-green-200' :
          status.estimatedWaitTime <= 15 ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-red-600" />
            <div>
              <span className="text-sm font-medium text-red-800">
                {status.ongoing ? 'In Use' : 
                 status.immediateConfirmed && status.immediateConfirmed.length > 0 ? 'Booked Soon' : 
                 status.immediateQueue && status.immediateQueue.length > 0 ? 'In Queue' : 'Booked'}
              </span>
              {showDetailed && statusMessage && (
                <div className="text-xs text-gray-600 mt-1">
                  {statusMessage.message}
                </div>
              )}
            </div>
          </div>
          {status.estimatedWaitTime && (
            <div className="text-right">
              <div className="text-sm font-medium text-red-700">
                Wait: {formatDuration(status.estimatedWaitTime)}
              </div>
              {showDetailed && (
                <div className="text-xs text-gray-500">
                  {status.ongoing ? 'Estimated completion' : 
                   status.immediateConfirmed && status.immediateConfirmed.length > 0 ? 'Next available' :
                   'Queue position'}
                </div>
              )}
            </div>
          )}
        </div>
        
        {hasQueue && (
          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-center space-x-2">
              <Users className="h-3 w-3 text-blue-600" />
              <span className="text-xs text-blue-800">{status.queueLength} in queue</span>
            </div>
            {showDetailed && (
              <div className="text-xs text-blue-600">
                {status.queueLength === 1 ? '1 person ahead' : `${status.queueLength} people ahead`}
              </div>
            )}
          </div>
        )}

        {showDetailed && status.currentUser && (
          <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded-md border border-purple-200">
            <Star className="h-3 w-3 text-purple-600" />
            <span className="text-xs text-purple-800">You have an active booking here</span>
          </div>
        )}

        {showDetailed && status.estimatedWaitTime > 30 && (
          <div className="flex items-center space-x-2 p-2 bg-orange-50 rounded-md border border-orange-200">
            <Info className="h-3 w-3 text-orange-600" />
            <span className="text-xs text-orange-800">Consider booking a future slot instead</span>
          </div>
        )}

        {/* Show confirmed bookings info */}
        {showDetailed && status.immediateConfirmed && status.immediateConfirmed.length > 0 && (
          <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-md border border-yellow-200">
            <Clock className="h-3 w-3 text-yellow-600" />
            <span className="text-xs text-yellow-800">
              {status.immediateConfirmed.length} confirmed booking(s) starting soon
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-3 bg-green-50 rounded-md border border-green-200">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <div>
            <span className="text-sm font-medium text-green-800">Available</span>
            {showDetailed && (
              <div className="text-xs text-green-600 mt-1">
                Ready for immediate booking!
              </div>
            )}
          </div>
        </div>
        {showDetailed && (
          <div className="text-right">
            <div className="text-xs text-green-600">
              <Battery className="h-3 w-3 inline mr-1" />
              Ready
            </div>
          </div>
        )}
      </div>

      {showDetailed && (
        <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-md border border-blue-200">
          <Info className="h-3 w-3 text-blue-600" />
          <span className="text-xs text-blue-800">Perfect time to charge your vehicle</span>
        </div>
      )}
    </div>
  );
} 