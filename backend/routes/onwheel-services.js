const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const OnWheelService = require('../models/OnWheelService');
const OnWheelRequest = require('../models/OnWheelRequest');

// Register a new on-wheel service (providers only)
router.post('/register', auth, async (req, res) => {
  try {
    if (req.user.role !== 'onwheel-provider') {
      return res.status(403).json({ message: 'Only on-wheel service providers can register services' });
    }

    const {
      companyName,
      serviceName,
      description,
      serviceArea,
      chargingTypes,
      plugTypes,
      pricePerHour,
      pricePerUnit,
      minimumCharge,
      travelFee,
      maxDistance,
      responseTime,
      availability,
      contactInfo,
      vehicleInfo
    } = req.body;

    // Validate required fields
    if (!companyName || !serviceName || !description || !serviceArea || !chargingTypes || !plugTypes || !pricePerHour || !maxDistance || !responseTime || !contactInfo || !vehicleInfo) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const service = new OnWheelService({
      provider: req.user._id,
      companyName,
      serviceName,
      description,
      serviceArea: {
        type: 'Point',
        coordinates: [serviceArea.lng, serviceArea.lat],
        radius: serviceArea.radius
      },
      chargingTypes,
      plugTypes,
      pricePerHour,
      pricePerUnit,
      minimumCharge,
      travelFee,
      maxDistance,
      responseTime,
      availability,
      contactInfo,
      vehicleInfo
    });

    await service.save();
    res.status(201).json({ message: 'Service registered successfully', service });
  } catch (error) {
    console.error('Error registering on-wheel service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get nearby on-wheel services
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 50, chargingType, plugType, maxPrice } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    let query = {
      'serviceArea': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
        }
      },
      status: 'active',
      'availability.isCurrentlyAvailable': true
    };

    // Add filters
    if (chargingType) {
      query.chargingTypes = chargingType;
    }
    if (plugType) {
      query.plugTypes = plugType;
    }
    if (maxPrice) {
      query.pricePerHour = { $lte: parseFloat(maxPrice) };
    }

    const services = await OnWheelService.find(query)
      .populate('provider', 'name email phone')
      .sort({ isPremium: -1, 'ratings.averageRating': -1 })
      .limit(20);

    res.json(services);
  } catch (error) {
    console.error('Error fetching nearby services:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await OnWheelService.findById(req.params.id)
      .populate('provider', 'name email phone')
      .populate('ratings.reviews.user', 'name');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update service (provider only)
router.put('/:id', auth, async (req, res) => {
  try {
    const service = await OnWheelService.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }

    const updatedService = await OnWheelService.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete service (provider only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const service = await OnWheelService.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this service' });
    }

    await OnWheelService.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get provider's services
router.get('/provider/my-services', auth, async (req, res) => {
  try {
    if (req.user.role !== 'onwheel-provider') {
      return res.status(403).json({ message: 'Only on-wheel service providers can access this endpoint' });
    }

    const services = await OnWheelService.find({ provider: req.user._id })
      .sort({ createdAt: -1 });

    res.json(services);
  } catch (error) {
    console.error('Error fetching provider services:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add review to service
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const service = await OnWheelService.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if user already reviewed this service
    const existingReview = service.ratings.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this service' });
    }

    service.ratings.reviews.push({
      user: req.user._id,
      rating,
      comment
    });

    await service.calculateAverageRating();
    res.json(service);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle service availability
router.patch('/:id/toggle-availability', auth, async (req, res) => {
  try {
    const service = await OnWheelService.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }

    service.availability.isCurrentlyAvailable = !service.availability.isCurrentlyAvailable;
    await service.save();

    res.json({ 
      message: `Service ${service.availability.isCurrentlyAvailable ? 'activated' : 'deactivated'} successfully`,
      isAvailable: service.availability.isCurrentlyAvailable 
    });
  } catch (error) {
    console.error('Error toggling availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get service statistics (provider only)
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const service = await OnWheelService.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these statistics' });
    }

    // Get request statistics
    const totalRequests = await OnWheelRequest.countDocuments({ service: req.params.id });
    const completedRequests = await OnWheelRequest.countDocuments({ 
      service: req.params.id, 
      status: 'completed' 
    });
    const pendingRequests = await OnWheelRequest.countDocuments({ 
      service: req.params.id, 
      status: 'pending' 
    });

    // Calculate total earnings
    const completedRequestsData = await OnWheelRequest.find({ 
      service: req.params.id, 
      status: 'completed' 
    });
    
    const totalEarnings = completedRequestsData.reduce((sum, request) => {
      return sum + (request.pricing.totalAmount || 0);
    }, 0);

    const stats = {
      totalRequests,
      completedRequests,
      pendingRequests,
      totalEarnings,
      averageRating: service.ratings.averageRating,
      totalReviews: service.ratings.totalReviews
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching service statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
