const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Station = require('../models/Station');
const User = require('../models/User');

// Add a review to a station
router.post('/:stationId', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { stationId } = req.params;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    if (comment.length > 500) {
      return res.status(400).json({ error: 'Comment must be less than 500 characters' });
    }

    // Find the station
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Check if user has already reviewed this station
    const existingReview = station.reviews.find(review => 
      review.user.toString() === req.user.id
    );

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this station' });
    }

    // Add the review
    station.reviews.push({
      user: req.user.id,
      rating,
      comment: comment.trim()
    });

    // Calculate new average rating
    await station.calculateAverageRating();

    // Populate user info for the new review
    await station.populate('reviews.user', 'name email');

    res.json({
      message: 'Review added successfully',
      station: {
        _id: station._id,
        name: station.name,
        averageRating: station.averageRating,
        totalReviews: station.totalReviews,
        reviews: station.reviews
      }
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get reviews for a station
router.get('/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;

    const station = await Station.findById(stationId)
      .populate('reviews.user', 'name email')
      .select('reviews averageRating totalReviews');

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    res.json({
      reviews: station.reviews,
      averageRating: station.averageRating,
      totalReviews: station.totalReviews
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a review
router.put('/:stationId/:reviewId', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { stationId, reviewId } = req.params;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    if (comment.length > 500) {
      return res.status(400).json({ error: 'Comment must be less than 500 characters' });
    }

    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Find the review
    const review = station.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    // Update the review
    review.rating = rating;
    review.comment = comment.trim();
    review.date = new Date();

    // Calculate new average rating
    await station.calculateAverageRating();

    // Populate user info
    await station.populate('reviews.user', 'name email');

    res.json({
      message: 'Review updated successfully',
      station: {
        _id: station._id,
        name: station.name,
        averageRating: station.averageRating,
        totalReviews: station.totalReviews,
        reviews: station.reviews
      }
    });

  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a review
router.delete('/:stationId/:reviewId', auth, async (req, res) => {
  try {
    const { stationId, reviewId } = req.params;

    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Find the review
    const review = station.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    // Remove the review
    review.remove();

    // Calculate new average rating
    await station.calculateAverageRating();

    res.json({
      message: 'Review deleted successfully',
      station: {
        _id: station._id,
        name: station.name,
        averageRating: station.averageRating,
        totalReviews: station.totalReviews
      }
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 