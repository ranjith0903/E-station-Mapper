import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    fetchStations();
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
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">My Stations</h1>
      {loading && <div className="mb-4">Loading...</div>}
      {stations.length === 0 && !loading && <div>No stations found.</div>}
      <div className="space-y-6">
        {stations.map(station => (
          <div key={station._id} className="card p-4">
            {editingId === station._id ? (
              <form onSubmit={e => { e.preventDefault(); saveEdit(station._id); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <input name="name" value={editData.name} onChange={handleEditChange} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Address</label>
                  <input name="address" value={editData.address} onChange={handleEditChange} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Price (₹/hr)</label>
                  <input name="price" type="number" value={editData.price} onChange={handleEditChange} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Charging Types</label>
                  <div className="flex flex-wrap gap-3">
                    {chargingTypes.map(type => (
                      <label key={type} className="flex items-center space-x-2">
                        <input type="checkbox" checked={editData.types.includes(type)} onChange={() => handleTypeChange(type)} />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium">Plug Types</label>
                  <div className="flex flex-wrap gap-3">
                    {plugTypes.map(plugType => (
                      <label key={plugType} className="flex items-center space-x-2">
                        <input type="checkbox" checked={editData.plugTypes.includes(plugType)} onChange={() => handlePlugTypeChange(plugType)} />
                        <span>{plugType}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" name="isAvailable24x7" checked={editData.isAvailable24x7} onChange={handleEditChange} />
                    <span>Available 24/7</span>
                  </label>
                </div>
                {!editData.isAvailable24x7 && (
                  <div>
                    <label className="block text-sm font-medium">Availability Slots</label>
                    <button type="button" onClick={addSlot} className="btn-secondary mb-2">Add Slot</button>
                    <div className="space-y-2">
                      {(editData.availabilitySlots || []).map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input type="time" value={slot.start} onChange={e => updateSlot(idx, 'start', e.target.value)} className="input-field" />
                          <span>to</span>
                          <input type="time" value={slot.end} onChange={e => updateSlot(idx, 'end', e.target.value)} className="input-field" />
                          <button type="button" onClick={() => removeSlot(idx)} className="text-red-600">Remove</button>
                        </div>
                      ))}
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
    </div>
  );
} 