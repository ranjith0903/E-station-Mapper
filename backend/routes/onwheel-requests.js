const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const OnWheelRequest = require('../models/OnWheelRequest');
const OnWheelService = require('../models/OnWheelService');

// Create a new on-wheel service request
router.post('/', auth, async (req, res) => {
  try {
    const {
      serviceId,
      requestLocation,
      vehicleInfo,
      chargingRequirements,
      urgency,
      contactInfo,
      schedule
    } = req.body;

    // Validate required fields
    if (!serviceId || !requestLocation || !vehicleInfo || !chargingRequirements || !contactInfo) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Check if service exists and is available
    const service = await OnWheelService.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.status !== 'active' || !service.availability.isCurrentlyAvailable) {
      return res.status(400).json({ message: 'Service is currently unavailable' });
    }

    // Check if location is within service area
    const distance = service.calculateDistance(
      service.serviceArea.coordinates[1], // lat
      service.serviceArea.coordinates[0], // lng
      requestLocation.lat,
      requestLocation.lng
    );

    if (distance > service.maxDistance) {
      return res.status(400).json({ 
        message: `Location is too far. Maximum distance is ${service.maxDistance}km, but your location is ${Math.round(distance)}km away.` 
      });
    }

    // Calculate pricing
    const basePrice = service.pricePerHour * (chargingRequirements.estimatedDuration || 1);
    const travelFee = service.travelFee;
    const totalAmount = Math.max(basePrice + travelFee, service.minimumCharge);

    const request = new OnWheelRequest({
      user: req.user._id,
      service: serviceId,
      requestLocation: {
        type: 'Point',
        coordinates: [requestLocation.lng, requestLocation.lat],
        address: requestLocation.address
      },
      vehicleInfo,
      chargingRequirements,
      urgency,
      pricing: {
        basePrice,
        travelFee,
        totalAmount,
        currency: 'USD'
      },
      schedule: {
        requestedTime: schedule?.requestedTime || new Date()
      },
      contactInfo: {
        userPhone: contactInfo.phone,
        userEmail: contactInfo.email,
        additionalNotes: contactInfo.additionalNotes
      }
    });

    await request.save();

    // Populate service details for response
    await request.populate('service', 'companyName serviceName contactInfo');

    res.status(201).json({ 
      message: 'Service request created successfully', 
      request 
    });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's service requests
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requests = await OnWheelRequest.find({ user: req.user._id })
      .populate('service', 'companyName serviceName contactInfo')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get provider's incoming requests
router.get('/provider/incoming', auth, async (req, res) => {
  try {
    if (req.user.role !== 'onwheel-provider') {
      return res.status(403).json({ message: 'Only on-wheel service providers can access this endpoint' });
    }

    // Get all services owned by the provider
    const services = await OnWheelService.find({ provider: req.user._id });
    const serviceIds = services.map(service => service._id);

    const requests = await OnWheelRequest.find({ 
      service: { $in: serviceIds },
      status: { $in: ['pending', 'accepted', 'in-progress'] }
    })
      .populate('service', 'companyName serviceName')
      .populate('user', 'name phone email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching provider requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get request by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await OnWheelRequest.findById(req.params.id)
      .populate('service', 'companyName serviceName contactInfo vehicleInfo')
      .populate('user', 'name phone email');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is authorized to view this request
    const isUser = request.user._id.toString() === req.user._id.toString();
    const isProvider = req.user.role === 'onwheel-provider' && 
                      request.service.provider.toString() === req.user._id.toString();

    if (!isUser && !isProvider) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update request status (provider only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, estimatedArrival, reason } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const request = await OnWheelRequest.findById(req.params.id)
      .populate('service');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is the service provider
    if (request.service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    const additionalData = {};
    if (status === 'accepted' && estimatedArrival) {
      additionalData.estimatedArrival = new Date(estimatedArrival);
    }
    if (status === 'cancelled' && reason) {
      additionalData.cancelledBy = 'provider';
      additionalData.reason = reason;
    }

    await request.updateStatus(status, additionalData);

    // Update service statistics
    if (status === 'completed') {
      const service = await OnWheelService.findById(request.service._id);
      service.totalServices += 1;
      service.totalEarnings += request.pricing.totalAmount;
      await service.save();
    }

    res.json({ message: 'Request status updated successfully', request });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel request (user only)
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;

    const request = await OnWheelRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is the request owner
    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }

    // Only allow cancellation if request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel request that is not pending' });
    }

    await request.updateStatus('cancelled', {
      cancelledBy: 'user',
      reason: reason || 'Cancelled by user'
    });

    res.json({ message: 'Request cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add feedback to completed request
router.post('/:id/feedback', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const request = await OnWheelRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is the request owner
    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add feedback to this request' });
    }

    // Only allow feedback for completed requests
    if (request.status !== 'completed') {
      return res.status(400).json({ message: 'Can only add feedback to completed requests' });
    }

    // Check if feedback already exists
    if (request.feedback.rating) {
      return res.status(400).json({ message: 'Feedback already exists for this request' });
    }

    await request.addFeedback(rating, comment);

    // Update service rating
    const service = await OnWheelService.findById(request.service);
    if (service) {
      service.ratings.reviews.push({
        user: req.user._id,
        rating,
        comment
      });
      await service.calculateAverageRating();
    }

    res.json({ message: 'Feedback added successfully' });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update provider location (for real-time tracking)
router.patch('/:id/provider-location', auth, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const request = await OnWheelRequest.findById(req.params.id)
      .populate('service');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is the service provider
    if (request.service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update location for this request' });
    }

    request.tracking.providerLocation = {
      type: 'Point',
      coordinates: [lng, lat]
    };
    request.tracking.lastUpdated = new Date();

    await request.save();

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error updating provider location:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
