const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const { auth, userOnly, ownerOnly, adminOnly, adminOrOwner } = require('../middleware/auth');

// Helper function to check booking overlaps
const checkBookingOverlap = async (stationId, startTime, endTime, excludeBookingId = null) => {
  const query = {
    station: stationId,
    status: { $in: ['pending', 'confirmed', 'ongoing'] },
    $or: [
      // New booking starts during existing booking
      { 'slot.start': { $lt: endTime }, 'slot.end': { $gt: startTime } },
      // New booking ends during existing booking
      { 'slot.start': { $lt: endTime }, 'slot.end': { $gt: startTime } },
      // New booking completely contains existing booking
      { 'slot.start': { $gte: startTime }, 'slot.end': { $lte: endTime } }
    ]
  };
  
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  const overlappingBookings = await Booking.find(query);
  return overlappingBookings.length > 0;
};

// Helper function to get available time slots
const getAvailableTimeSlots = async (stationId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Get all bookings for this station on this date
  const existingBookings = await Booking.find({
    station: stationId,
    status: { $in: ['pending', 'confirmed', 'ongoing'] },
    'slot.start': { $gte: startOfDay, $lte: endOfDay }
  }).sort({ 'slot.start': 1 });
  
  // Get station availability
  const stationObj = await Station.findById(stationId);
  if (!stationObj) {
    return [];
  }
  
  const availableSlots = [];
  const now = new Date();
  
  // Handle 24/7 availability
  if (stationObj.isAvailable24x7) {
    // For 24/7 stations, the entire day is available
    let currentTime = new Date(startOfDay);
    
    // If this is today, don't allow bookings in the past
    if (date === now.toISOString().split('T')[0] && currentTime < now) {
      currentTime = new Date(now.getTime() + 30 * 60 * 1000); // Start from 30 minutes from now
    }
    
    // Find gaps in existing bookings for the entire day
    existingBookings.forEach(booking => {
      const bookingStart = new Date(booking.slot.start);
      const bookingEnd = new Date(booking.slot.end);
      
      // If there's a gap before this booking
      if (currentTime < bookingStart) {
        const gapDuration = (bookingStart.getTime() - currentTime.getTime()) / (1000 * 60); // minutes
        if (gapDuration >= 30) { // Minimum 30 minutes
          availableSlots.push({
            start: new Date(currentTime),
            end: new Date(bookingStart),
            duration: gapDuration
          });
        }
      }
      
      // Move current time to after this booking
      currentTime = new Date(Math.max(currentTime.getTime(), bookingEnd.getTime()));
    });
    
    // Check if there's time after the last booking until end of day
    if (currentTime < endOfDay) {
      const gapDuration = (endOfDay.getTime() - currentTime.getTime()) / (1000 * 60); // minutes
      if (gapDuration >= 30) { // Minimum 30 minutes
        availableSlots.push({
          start: new Date(currentTime),
          end: new Date(endOfDay),
          duration: gapDuration
        });
      }
    }
    
    return availableSlots;
  }
  
  // Handle regular availability slots
  if (!stationObj.availabilitySlots || stationObj.availabilitySlots.length === 0) {
    return [];
  }
  
  // For each availability slot, find available time windows
  stationObj.availabilitySlots.forEach(availabilitySlot => {
    const [startHour, startMinute] = availabilitySlot.start.split(':').map(Number);
    const [endHour, endMinute] = availabilitySlot.end.split(':').map(Number);
    
    const slotStart = new Date(date);
    slotStart.setHours(startHour, startMinute, 0, 0);
    
    const slotEnd = new Date(date);
    slotEnd.setHours(endHour, endMinute, 0, 0);
    
    // If this is today, don't allow bookings in the past
    if (date === now.toISOString().split('T')[0] && slotStart < now) {
      slotStart.setTime(now.getTime() + 30 * 60 * 1000); // Start from 30 minutes from now
    }
    
    if (slotStart >= slotEnd) return;
    
    // Find gaps in existing bookings
    let currentTime = new Date(slotStart);
    
    existingBookings.forEach(booking => {
      const bookingStart = new Date(booking.slot.start);
      const bookingEnd = new Date(booking.slot.end);
      
      // If there's a gap before this booking
      if (currentTime < bookingStart) {
        const gapDuration = (bookingStart.getTime() - currentTime.getTime()) / (1000 * 60); // minutes
        if (gapDuration >= 30) { // Minimum 30 minutes
          availableSlots.push({
            start: new Date(currentTime),
            end: new Date(bookingStart),
            duration: gapDuration
          });
        }
      }
      
      // Move current time to after this booking
      currentTime = new Date(Math.max(currentTime.getTime(), bookingEnd.getTime()));
    });
    
    // Check if there's time after the last booking
    if (currentTime < slotEnd) {
      const gapDuration = (slotEnd.getTime() - currentTime.getTime()) / (1000 * 60); // minutes
      if (gapDuration >= 30) { // Minimum 30 minutes
        availableSlots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd),
          duration: gapDuration
        });
      }
    }
  });
  
  return availableSlots;
};

// Create a booking (user or owner) with overlap validation
router.post('/', auth, async (req, res) => {
  try {
    const { station, slot, amount, paymentIntentId, isImmediate = false } = req.body;
    
    // Validate slot times
    const startTime = new Date(slot.start);
    const endTime = new Date(slot.end);
    
    if (startTime >= endTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    // Check for booking overlaps
    const hasOverlap = await checkBookingOverlap(station, startTime, endTime);
    if (hasOverlap) {
      return res.status(400).json({ error: 'This time slot conflicts with an existing booking' });
    }
    
    // Check if booking is in the past (allow immediate bookings to start soon)
    const now = new Date();
    const minStartTime = isImmediate ? new Date(now.getTime() - 10 * 60 * 1000) : now; // Allow immediate bookings to start within 10 minutes
    if (startTime < minStartTime) {
      return res.status(400).json({ error: 'Cannot book time slots in the past' });
    }
    
    const stationDoc = await Station.findById(station);
    let status = 'pending';
    if (stationDoc.acceptMode === 'auto') status = 'confirmed';
    
    const booking = await Booking.create({
      user: req.user.id,
      station,
      slot,
      amount,
      paymentIntentId,
      status: status
    });
    
    // If this is an immediate booking, automatically start the session
    if (isImmediate && status === 'confirmed') {
      // Start the session immediately
      booking.status = 'ongoing';
      booking.actualStart = new Date();
      await booking.save();
      
      console.log(`Immediate booking started for station ${station} by user ${req.user.id}`);
    }
    
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get bookings (user or owner)
router.get('/', auth, async (req, res) => {
  try {
    let bookings;
    if (req.user.role === 'user') {
      bookings = await Booking.find({ user: req.user.id }).populate('station');
    } else if (req.user.role === 'owner') {
      bookings = await Booking.find().populate({
        path: 'station',
        match: { owner: req.user.id }
      });
    } else if (req.user.role === 'admin') {
      bookings = await Booking.find().populate('station user');
    }
    res.json(bookings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get station availability and future bookings
router.get('/station/:stationId/availability', auth, async (req, res) => {
  try {
    const { stationId } = req.params;
    const { date } = req.query;
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get available time slots
    const availableSlots = await getAvailableTimeSlots(stationId, targetDate);
    
    // Get future bookings for this station
    const futureBookings = await Booking.find({
      station: stationId,
      status: { $in: ['pending', 'confirmed'] },
      'slot.start': { $gte: new Date() }
    }).populate('user').sort({ 'slot.start': 1 });
    
    res.json({
      availableSlots,
      futureBookings,
      date: targetDate
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get live status for a station (enhanced with future bookings)
router.get('/station/:stationId/status', auth, async (req, res) => {
  try {
    const { stationId } = req.params;
    const now = new Date();
    
    // Get current ongoing booking
    const ongoingBooking = await Booking.findOne({
      station: stationId,
      status: 'ongoing'
    }).populate('user');
    
    // Get immediate confirmed bookings that are about to start (within next 30 minutes)
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    const immediateConfirmedBookings = await Booking.find({
      station: stationId,
      status: 'confirmed',
      'slot.start': { $gte: now, $lte: thirtyMinutesFromNow }
    }).populate('user').sort({ 'slot.start': 1 });
    
    // Get immediate pending bookings (queue) - only for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const immediatePendingBookings = await Booking.find({
      station: stationId,
      status: 'pending',
      'slot.start': { $gte: today, $lt: tomorrow }
    }).populate('user').sort({ 'slot.start': 1 });
    
    // Get future bookings (beyond today)
    const futureBookings = await Booking.find({
      station: stationId,
      status: { $in: ['pending', 'confirmed'] },
      'slot.start': { $gte: tomorrow }
    }).populate('user').sort({ 'slot.start': 1 });
    
    // Calculate estimated wait time
    let estimatedWaitTime = 0;
    let showWaitTime = false;
    let nextAvailableTime = null;
    
    if (ongoingBooking) {
      // If there's an ongoing session, calculate wait time based on session end
      const endTime = new Date(ongoingBooking.slot.end);
      const remaining = endTime.getTime() - now.getTime();
      
      if (remaining > 0) {
        estimatedWaitTime = Math.floor(remaining / (1000 * 60)); // minutes
        showWaitTime = true;
        nextAvailableTime = endTime;
      }
    } else if (immediateConfirmedBookings.length > 0) {
      // If no ongoing session but there are confirmed bookings starting soon
      const nextBooking = immediateConfirmedBookings[0];
      const startTime = new Date(nextBooking.slot.start);
      const endTime = new Date(nextBooking.slot.end);
      
      if (startTime <= now) {
        // Booking should have started, mark as ongoing
        nextBooking.status = 'ongoing';
        nextBooking.actualStart = now;
        await nextBooking.save();
        
        estimatedWaitTime = Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60));
        showWaitTime = true;
        nextAvailableTime = endTime;
      } else {
        // Booking starts in the future - show wait time until it starts
        estimatedWaitTime = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));
        showWaitTime = true;
        nextAvailableTime = startTime;
      }
    } else if (immediatePendingBookings.length > 0) {
      // If there are pending bookings in queue, calculate wait time
      // Assume each booking takes 1 hour on average
      const averageBookingDuration = 60; // minutes
      estimatedWaitTime = immediatePendingBookings.length * averageBookingDuration;
      showWaitTime = true;
      nextAvailableTime = new Date(now.getTime() + estimatedWaitTime * 60 * 1000);
    }
    
    // Add queue position to immediate pending bookings
    immediatePendingBookings.forEach((booking, index) => {
      booking.queuePosition = index + 1;
      if (showWaitTime && nextAvailableTime) {
        // Calculate wait time based on next available time + queue position
        const baseWaitTime = Math.floor((nextAvailableTime.getTime() - now.getTime()) / (1000 * 60));
        booking.estimatedWaitTime = baseWaitTime + (index * 60); // Add 1 hour per person in queue
      }
    });
    
    res.json({
      ongoing: ongoingBooking,
      immediateQueue: immediatePendingBookings,
      immediateConfirmed: immediateConfirmedBookings,
      futureBookings,
      estimatedWaitTime: showWaitTime ? estimatedWaitTime : null,
      queueLength: immediatePendingBookings.length,
      showWaitTime,
      nextAvailableTime
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Start charging session
router.put('/:id/start', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('station');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check if user can start this session
    const canStart = req.user.role === 'admin' || 
                    booking.user.toString() === req.user.id ||
                    (booking.station && booking.station.owner.toString() === req.user.id);
    
    if (!canStart) {
      return res.status(403).json({ error: 'Not authorized to start this session' });
    }
    
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: 'Only confirmed bookings can be started' });
    }
    
    await booking.startSession();
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// End charging session
router.put('/:id/end', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('station');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check if user can end this session
    const canEnd = req.user.role === 'admin' || 
                   booking.user.toString() === req.user.id ||
                   (booking.station && booking.station.owner.toString() === req.user.id);
    
    if (!canEnd) {
      return res.status(403).json({ error: 'Not authorized to end this session' });
    }
    
    if (booking.status !== 'ongoing') {
      return res.status(400).json({ error: 'Only ongoing sessions can be ended' });
    }
    
    await booking.endSession();
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Report an issue with a booking
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { type, description } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    booking.reportedIssues.push({
      type,
      description,
      reportedBy: req.user.id
    });
    
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Cancel a booking (owner or user)
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('station');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    // Only owner of station or user who booked can cancel
    if (
      req.user.role === 'owner' && booking.station.owner.toString() !== req.user.id && req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking already cancelled' });
    }
    booking.status = 'cancelled';
    if (booking.paymentIntentId) {
      booking.refunded = true; // Hardcoded refund
    }
    await booking.save();
    res.json({ message: 'Booking cancelled', refunded: !!booking.refunded });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Approve a booking (owner)
router.patch('/:id/approve', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('station');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (req.user.role !== 'owner' || booking.station.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking is not pending' });
    }
    booking.status = 'confirmed';
    await booking.save();
    res.json({ message: 'Booking approved' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Reject a booking (owner)
router.patch('/:id/reject', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('station');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (req.user.role !== 'owner' || booking.station.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking is not pending' });
    }
    booking.status = 'rejected';
    if (booking.paymentIntentId) {
      booking.refunded = true; // Hardcoded refund
    }
    await booking.save();
    res.json({ message: 'Booking rejected', refunded: !!booking.refunded });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 