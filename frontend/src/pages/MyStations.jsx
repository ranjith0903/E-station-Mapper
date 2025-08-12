import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, User, MapPin, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';
import { EMAIL_CONFIG } from '../utils/emailConfig';

const chargingTypes = ['slow', 'fast', 'superfast'];
const plugTypes = ['CCS', 'Type-1', 'CHAdeMO', 'Type-2'];
const acceptModes = [
  { value: 'auto', label: 'Accept Without Request (Auto)' },
  { value: 'request', label: 'Accept On Request (Manual)' }
];

export default function MyStations() {
  const [stations, setStations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    fetchStations();
    fetchPendingBookings();
  }, []);

  const fetchStations = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/stations/my-stations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStations(data);
      else toast.error(data.error || 'Failed to fetch stations');
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingBookings = async () => {
    setLoadingBookings(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Filter for pending bookings for this owner's stations
        const pending = data.filter(booking => 
          booking.status === 'pending' && 
          stations.some(station => station._id === booking.station?._id)
        );
        setPendingBookings(pending);
      }
    } catch (err) {
      console.error('Failed to fetch pending bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const sendBookingConfirmationEmail = async (userEmail, bookingDetails) => {
    try {
      await emailjs.send(
        EMAIL_CONFIG.SERVICE_ID,
        EMAIL_CONFIG.TEMPLATE_ID,
        {
          to_email: userEmail,
          booking_id: bookingDetails.id,
          station_name: bookingDetails.stationName,
          booking_date: bookingDetails.date,
          booking_time: bookingDetails.time,
          amount: bookingDetails.amount,
          user_name: bookingDetails.userName
        },
        EMAIL_CONFIG.PUBLIC_KEY
      );
      console.log('Email sent successfully');
      toast.success('Confirmation email sent to user');
    } catch (error) {
      console.error('Email sending failed:', error);
      toast.error('Email notification failed, but booking was approved');
    }
  };

  const handleApproveBooking = async (bookingId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/bookings/${bookingId}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Booking approved!');
        
        // Find the booking details for email
        const booking = pendingBookings.find(b => b._id === bookingId);
        if (booking && booking.user?.email) {
          await sendBookingConfirmationEmail(booking.user.email, {
            id: booking._id,
            stationName: booking.station?.name || 'Charging Station',
            date: new Date(booking.slot.start).toLocaleDateString(),
            time: `${new Date(booking.slot.start).toLocaleTimeString()} - ${new Date(booking.slot.end).toLocaleTimeString()}`,
            amount: booking.amount,
            userName: booking.user?.name || 'User'
          });
        }
        
        fetchPendingBookings(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to approve booking');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/bookings/${bookingId}/reject`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Booking rejected!');
        fetchPendingBookings(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to reject booking');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const startEdit = (station) => {
    setEditingId(station._id);
    setEditData({
      name: station.name,
      address: station.address,
      price: station.price,
      types: station.types || [],
      plugTypes: station.plugTypes || [],
      isAvailable24x7: station.isAvailable24x7,
      availabilitySlots: station.availabilitySlots || [],
      acceptMode: station.acceptMode || 'auto'
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTypeChange = (type) => {
    setEditData(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  const handlePlugTypeChange = (plugType) => {
    setEditData(prev => ({
      ...prev,
      plugTypes: prev.plugTypes.includes(plugType)
        ? prev.plugTypes.filter(p => p !== plugType)
        : [...prev.plugTypes, plugType]
    }));
  };

  const addSlot = () => {
    setEditData(prev => ({
      ...prev,
      availabilitySlots: [...(prev.availabilitySlots || []), { start: '', end: '' }]
    }));
  };

  const updateSlot = (idx, field, value) => {
    setEditData(prev => ({
      ...prev,
      availabilitySlots: prev.availabilitySlots.map((slot, i) =>
        i === idx ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const removeSlot = (idx) => {
    setEditData(prev => ({
      ...prev,
      availabilitySlots: prev.availabilitySlots.filter((_, i) => i !== idx)
    }));
  };

  const saveEdit = async (id) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const body = {
        ...editData,
        price: Number(editData.price),
        availabilitySlots: editData.isAvailable24x7 ? [] : editData.availabilitySlots
      };
      const res = await fetch(`/api/stations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Station updated');
        setEditingId(null);
        fetchStations();
      } else {
        toast.error(data.error || 'Update failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Stations</h1>
        <p className="text-gray-600 mt-1">Manage your charging stations and bookings</p>
      </div>

      {/* Pending Bookings Section */}
      {pendingBookings.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-yellow-600" />
            Pending Bookings ({pendingBookings.length})
          </h2>
          <div className="space-y-4">
            {pendingBookings.map(booking => (
              <div key={booking._id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {booking.user?.name || 'Unknown User'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        {booking.station?.name || 'Unknown Station'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        {new Date(booking.slot.start).toLocaleDateString()} • {new Date(booking.slot.start).toLocaleTimeString()} - {new Date(booking.slot.end).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ₹{booking.amount}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleApproveBooking(booking._id)}
                      className="btn-primary flex items-center space-x-1 text-sm"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleRejectBooking(booking._id)}
                      className="btn-secondary flex items-center space-x-1 text-sm"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stations Section */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Stations</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : stations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No stations registered yet.</p>
            <p className="text-sm mt-1">Add your first charging station to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stations.map(station => (
              <div key={station._id} className="border border-gray-200 rounded-lg p-4">
                {editingId === station._id ? (
                  <form onSubmit={(e) => { e.preventDefault(); saveEdit(station._id); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium">Station Name</label>
                        <input
                          name="name"
                          type="text"
                          value={editData.name}
                          onChange={handleEditChange}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Address</label>
                        <input
                          name="address"
                          type="text"
                          value={editData.address}
                          onChange={handleEditChange}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Price per Hour (₹)</label>
                        <input
                          name="price"
                          type="number"
                          value={editData.price}
                          onChange={handleEditChange}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Charging Types</label>
                        <div className="space-y-2">
                          {chargingTypes.map(type => (
                            <label key={type} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editData.types?.includes(type)}
                                onChange={() => handleTypeChange(type)}
                                className="mr-2"
                              />
                              {type}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Plug Types</label>
                        <div className="space-y-2">
                          {plugTypes.map(plugType => (
                            <label key={plugType} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editData.plugTypes?.includes(plugType)}
                                onChange={() => handlePlugTypeChange(plugType)}
                                className="mr-2"
                              />
                              {plugType}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="isAvailable24x7"
                            checked={editData.isAvailable24x7}
                            onChange={handleEditChange}
                            className="mr-2"
                          />
                          24/7 Available
                        </label>
                      </div>
                      {!editData.isAvailable24x7 && (
                        <div>
                          <label className="block text-sm font-medium">Availability Slots</label>
                          <div className="space-y-2">
                            {editData.availabilitySlots?.map((slot, idx) => (
                              <div key={idx} className="flex space-x-2">
                                <input
                                  type="time"
                                  value={slot.start}
                                  onChange={(e) => updateSlot(idx, 'start', e.target.value)}
                                  className="input-field flex-1"
                                />
                                <input
                                  type="time"
                                  value={slot.end}
                                  onChange={(e) => updateSlot(idx, 'end', e.target.value)}
                                  className="input-field flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeSlot(idx)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button type="button" onClick={addSlot} className="btn-secondary text-sm">
                              Add Slot
                            </button>
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium">Accept Mode</label>
                        <select name="acceptMode" value={editData.acceptMode} onChange={handleEditChange} className="input-field">
                          {acceptModes.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button type="submit" className="btn-primary" disabled={loading}>Save</button>
                      <button type="button" className="btn-secondary" onClick={cancelEdit} disabled={loading}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="font-semibold text-lg">{station.name}</div>
                      <div className="text-gray-600 text-sm">{station.address}</div>
                      <div className="text-gray-700 text-sm">₹{station.price}/hr</div>
                      <div className="text-xs text-gray-500">{station.isAvailable24x7 ? '24/7' : (station.availabilitySlots || []).map(s => `${s.start}-${s.end}`).join(', ')}</div>
                      <div className="text-xs text-gray-500">Accept Mode: {station.acceptMode === 'auto' ? 'Auto' : 'On Request'}</div>
                    </div>
                    <button className="btn-primary" onClick={() => startEdit(station)}>Edit</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 