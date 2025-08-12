const express = require('express');
const router = express.Router();
const Station = require('../models/Station');
const { auth, ownerOnly } = require('../middleware/auth');

// Register a station (owner only)
router.post('/register', auth, ownerOnly, async (req, res) => {
  try {
    const { name, address, location, types, plugTypes, price, isAvailable24x7, availabilitySlots } = req.body;
    
    // Validate that either 24/7 is enabled or availability slots are provided
    if (!isAvailable24x7 && (!availabilitySlots || availabilitySlots.length === 0)) {
      return res.status(400).json({ error: 'Please provide availability slots or enable 24/7 availability' });
    }
    
    const station = await Station.create({
      owner: req.user.id,
      name,
      address,
      location,
      types,
      plugTypes,
      price,
      isAvailable24x7: isAvailable24x7 || false,
      availabilitySlots: isAvailable24x7 ? [] : availabilitySlots
    });
    res.json(station);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get owner's stations (owner only)
router.get('/my-stations', auth, ownerOnly, async (req, res) => {
  try {
    const stations = await Station.find({ owner: req.user.id });
    res.json(stations);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get nearby stations (by lat/lng) - MUST come before /:id route
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, maxDistance = 5000 } = req.query;
    
    console.log('Nearby stations request:', { lat, lng, maxDistance });
    
    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const stations = await Station.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).populate('reviews.user', 'name email');
    
    console.log(`Found ${stations.length} nearby stations`);
    res.json(stations);
  } catch (err) {
    console.error('Error in nearby stations:', err);
    res.status(400).json({ error: err.message });
  }
});

// Update a station (owner only)
router.patch('/:id', auth, ownerOnly, async (req, res) => {
  try {
    const station = await Station.findOne({ _id: req.params.id, owner: req.user.id });
    if (!station) return res.status(404).json({ error: 'Station not found' });

    // Only allow updating editable fields
    const fields = [
      'name', 'address', 'location', 'types', 'plugTypes', 'price', 'isAvailable24x7', 'availabilitySlots', 'acceptMode'
    ];
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        station[field] = req.body[field];
      }
    });
    // If 24x7 is enabled, clear slots
    if (station.isAvailable24x7) station.availabilitySlots = [];
    await station.save();
    res.json(station);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get a single station by ID - MUST come after specific routes
router.get('/:id', async (req, res) => {
  try {
    const station = await Station.findById(req.params.id)
      .populate('reviews.user', 'name email');
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    res.json(station);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 