const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Station = require('../models/Station');
const Booking = require('../models/Booking');
const { auth, adminOnly } = require('../middleware/auth');

// Get admin dashboard stats
router.get('/dashboard', auth, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const totalStations = await Station.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: { $in: ['pending', 'ongoing'] } });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    
    // Calculate total earnings
    const earningsData = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalEarnings = earningsData.length > 0 ? earningsData[0].total : 0;
    
    // Get recent activity
    const recentBookings = await Booking.find()
      .populate('user station')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get reported issues
    const reportedIssues = await Booking.find({
      'reportedIssues.0': { $exists: true }
    }).populate('user station');
    
    res.json({
      stats: {
        totalUsers,
        totalOwners,
        totalStations,
        totalBookings,
        activeBookings,
        completedBookings,
        totalEarnings
      },
      recentBookings,
      reportedIssues
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all users with pagination
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;
    const search = req.query.search;
    
    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update user status (activate/deactivate)
router.put('/users/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all stations with pagination
router.get('/stations', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }
    
    const stations = await Station.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await Station.countDocuments(query);
    
    res.json({
      stations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Remove inactive station
router.delete('/stations/:id', auth, adminOnly, async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    
    // Check if station has any active bookings
    const activeBookings = await Booking.countDocuments({
      station: req.params.id,
      status: { $in: ['pending', 'ongoing'] }
    });
    
    if (activeBookings > 0) {
      return res.status(400).json({ 
        error: 'Cannot remove station with active bookings' 
      });
    }
    
    await Station.findByIdAndDelete(req.params.id);
    res.json({ message: 'Station removed successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all bookings with filters
router.get('/bookings', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const stationId = req.query.stationId;
    const userId = req.query.userId;
    
    let query = {};
    if (status) query.status = status;
    if (stationId) query.station = stationId;
    if (userId) query.user = userId;
    
    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('station', 'name address')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await Booking.countDocuments(query);
    
    res.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update reported issue status
router.put('/bookings/:id/issues/:issueId', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const issue = booking.reportedIssues.id(req.params.issueId);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    issue.status = status;
    await booking.save();
    
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get earnings report
router.get('/earnings', auth, adminOnly, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    let dateFilter = {};
    
    const now = new Date();
    if (period === 'week') {
      dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (period === 'month') {
      dateFilter = { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
    } else if (period === 'year') {
      dateFilter = { createdAt: { $gte: new Date(now.getFullYear(), 0, 1) } };
    }
    
    const earnings = await Booking.aggregate([
      { $match: { status: 'completed', ...dateFilter } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json(earnings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 