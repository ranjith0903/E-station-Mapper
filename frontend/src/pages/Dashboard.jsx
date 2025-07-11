import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, DollarSign, Zap, TrendingUp, Users, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard({ auth }) {
  const [bookings, setBookings] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalEarnings: 0,
    activeStations: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, [auth]);

  const fetchDashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      // Fetch bookings
      const bookingsRes = await fetch('/api/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bookingsData = await bookingsRes.json();
      setBookings(bookingsData);

      // If owner, fetch stations
      if (auth?.role === 'owner') {
        const stationsRes = await fetch('/api/stations/my-stations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const stationsData = await stationsRes.json();
        setStations(stationsData);
        
        // Calculate stats
        const totalEarnings = bookingsData.reduce((sum, booking) => sum + (booking.amount || 0), 0);
        setStats({
          totalBookings: bookingsData.length,
          totalEarnings,
          activeStations: stationsData.length
        });
      } else {
        setStats({
          totalBookings: bookingsData.length,
          totalEarnings: 0,
          activeStations: 0
        });
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {auth?.name}! Here's your {auth?.role === 'owner' ? 'station management' : 'booking'} overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        {auth?.role === 'owner' && (
          <>
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalEarnings}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Stations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeStations}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Owner: My Stations */}
      {auth?.role === 'owner' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">My Stations</h2>
            <Link to="/station/register" className="btn-primary">
              Add New Station
            </Link>
          </div>
          
          {stations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stations.map(station => (
                <div key={station._id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900">{station.name}</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Zap className="h-3 w-3" />
                      <span>{station.types.join(', ')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3" />
                      <span>₹{station.price}/hr</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{station.plugTypes.join(', ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Zap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No stations yet</p>
              <p className="text-sm">Add your first charging station to start earning</p>
            </div>
          )}
        </div>
      )}

      {/* Bookings */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {auth?.role === 'owner' ? 'Recent Bookings' : 'My Bookings'}
        </h2>
        
        {bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Station
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map(booking => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.station?.name || 'Unknown Station'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.slot?.start ? formatDate(booking.slot.start) : 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{booking.amount || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No bookings yet</p>
            <p className="text-sm">
              {auth?.role === 'owner' 
                ? 'Bookings will appear here when users book your stations'
                : 'Start by finding and booking a charging station'
              }
            </p>
            {auth?.role === 'user' && (
              <Link to="/" className="btn-primary mt-4">
                Find Stations
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 