const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const OnWheelRequest = require('../models/OnWheelRequest');
const OnWheelService = require('../models/OnWheelService');

// Create payment intent for on-wheel service request
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ message: 'Request ID is required' });
    }

    // Find the request
    const request = await OnWheelRequest.findById(requestId)
      .populate('service', 'companyName serviceName');

    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check if user owns this request
    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to pay for this request' });
    }

    // Check if request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not in pending status' });
    }

    // Calculate amount in cents (Stripe requires amounts in cents)
    const amountInCents = Math.round(request.pricing.totalAmount * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: request.pricing.currency.toLowerCase(),
      metadata: {
        requestId: request._id.toString(),
        serviceId: request.service._id.toString(),
        serviceName: request.service.serviceName,
        companyName: request.service.companyName,
        userId: req.user._id.toString(),
        userName: req.user.name
      },
      description: `On-wheel charging service: ${request.service.serviceName} by ${request.service.companyName}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: request.pricing.totalAmount,
      currency: request.pricing.currency,
      requestDetails: {
        id: request._id,
        serviceName: request.service.serviceName,
        companyName: request.service.companyName,
        totalAmount: request.pricing.totalAmount,
        basePrice: request.pricing.basePrice,
        travelFee: request.pricing.travelFee
      }
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: 'Error creating payment intent' });
  }
});

// Confirm payment and update request status
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { requestId, paymentIntentId } = req.body;

    if (!requestId || !paymentIntentId) {
      return res.status(400).json({ message: 'Request ID and Payment Intent ID are required' });
    }

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Find and update the request
    const request = await OnWheelRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check if user owns this request
    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to confirm payment for this request' });
    }

    // Update payment status
    request.payment.status = 'paid';
    request.payment.transactionId = paymentIntentId;
    request.payment.paidAt = new Date();
    request.status = 'accepted'; // Move to accepted status after payment

    await request.save();

    // Update service statistics
    const service = await OnWheelService.findById(request.service);
    if (service) {
      service.totalServices += 1;
      service.totalEarnings += request.pricing.totalAmount;
      await service.save();
    }

    res.json({
      message: 'Payment confirmed successfully',
      request: {
        id: request._id,
        status: request.status,
        paymentStatus: request.payment.status,
        totalAmount: request.pricing.totalAmount
      }
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Error confirming payment' });
  }
});

// Get payment status
router.get('/payment-status/:requestId', auth, async (req, res) => {
  try {
    const request = await OnWheelRequest.findById(req.params.requestId)
      .populate('service', 'companyName serviceName');

    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check if user owns this request
    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }

    res.json({
      requestId: request._id,
      paymentStatus: request.payment.status,
      totalAmount: request.pricing.totalAmount,
      currency: request.pricing.currency,
      paidAt: request.payment.paidAt,
      transactionId: request.payment.transactionId,
      serviceName: request.service.serviceName,
      companyName: request.service.companyName
    });

  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ message: 'Error fetching payment status' });
  }
});

// Refund payment (provider only)
router.post('/refund', auth, async (req, res) => {
  try {
    const { requestId, reason } = req.body;

    if (!requestId) {
      return res.status(400).json({ message: 'Request ID is required' });
    }

    const request = await OnWheelRequest.findById(requestId)
      .populate('service');

    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check if user is the service provider
    if (request.service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only service providers can issue refunds' });
    }

    // Check if payment was made
    if (request.payment.status !== 'paid' || !request.payment.transactionId) {
      return res.status(400).json({ message: 'No payment found to refund' });
    }

    // Create refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: request.payment.transactionId,
      reason: 'requested_by_customer',
      metadata: {
        requestId: request._id.toString(),
        reason: reason || 'Refunded by provider',
        refundedBy: req.user._id.toString()
      }
    });

    // Update request status
    request.payment.status = 'refunded';
    request.status = 'cancelled';
    request.cancellation = {
      cancelledBy: 'provider',
      reason: reason || 'Refunded by provider',
      cancelledAt: new Date()
    };

    await request.save();

    res.json({
      message: 'Refund processed successfully',
      refundId: refund.id,
      amount: refund.amount / 100, // Convert from cents
      status: refund.status
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ message: 'Error processing refund' });
  }
});

// Get payment history for user
router.get('/payment-history', auth, async (req, res) => {
  try {
    const requests = await OnWheelRequest.find({ 
      user: req.user._id,
      'payment.status': { $in: ['paid', 'refunded'] }
    })
      .populate('service', 'companyName serviceName')
      .sort({ 'payment.paidAt': -1 })
      .limit(20);

    const paymentHistory = requests.map(request => ({
      requestId: request._id,
      serviceName: request.service.serviceName,
      companyName: request.service.companyName,
      amount: request.pricing.totalAmount,
      currency: request.pricing.currency,
      paymentStatus: request.payment.status,
      paidAt: request.payment.paidAt,
      transactionId: request.payment.transactionId,
      requestStatus: request.status
    }));

    res.json(paymentHistory);

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Error fetching payment history' });
  }
});

// Get payment analytics for provider
router.get('/provider/analytics', auth, async (req, res) => {
  try {
    if (req.user.role !== 'onwheel-provider') {
      return res.status(403).json({ message: 'Only providers can access payment analytics' });
    }

    // Get all services owned by the provider
    const services = await OnWheelService.find({ provider: req.user._id });
    const serviceIds = services.map(service => service._id);

    // Get all paid requests for these services
    const paidRequests = await OnWheelRequest.find({
      service: { $in: serviceIds },
      'payment.status': 'paid'
    });

    // Calculate analytics
    const totalEarnings = paidRequests.reduce((sum, request) => sum + request.pricing.totalAmount, 0);
    const totalRequests = paidRequests.length;
    const averageAmount = totalRequests > 0 ? totalEarnings / totalRequests : 0;

    // Monthly breakdown
    const monthlyData = {};
    paidRequests.forEach(request => {
      const month = request.payment.paidAt.toISOString().substring(0, 7); // YYYY-MM format
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, amount: 0 };
      }
      monthlyData[month].count += 1;
      monthlyData[month].amount += request.pricing.totalAmount;
    });

    res.json({
      totalEarnings,
      totalRequests,
      averageAmount,
      monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        count: data.count,
        amount: data.amount
      }))
    });

  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({ message: 'Error fetching payment analytics' });
  }
});

module.exports = router;
