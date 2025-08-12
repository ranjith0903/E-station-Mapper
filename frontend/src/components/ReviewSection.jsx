import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Edit, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';

const ReviewSection = ({ stationId, station, onReviewUpdate }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ rating: 5, comment: '' });

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (station) {
      setReviews(station.reviews || []);
      setAverageRating(station.averageRating || 0);
      setTotalReviews(station.totalReviews || 0);
      
      // Check if current user has already reviewed
      if (currentUser) {
        const existingReview = station.reviews?.find(review => 
          review.user._id === currentUser._id || review.user === currentUser._id
        );
        if (existingReview) {
          setUserReview(existingReview);
        }
      }
    }
  }, [station, currentUser]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please login to leave a review');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const url = userReview 
        ? `/api/reviews/${stationId}/${userReview._id}`
        : `/api/reviews/${stationId}`;
      
      const method = userReview ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(userReview ? 'Review updated successfully!' : 'Review added successfully!');
        setShowReviewForm(false);
        setFormData({ rating: 5, comment: '' });
        
        // Update the station data
        if (onReviewUpdate) {
          onReviewUpdate(data.station);
        }
      } else {
        toast.error(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    if (!confirm('Are you sure you want to delete your review?')) return;

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/reviews/${stationId}/${userReview._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Review deleted successfully!');
        setUserReview(null);
        
        // Update the station data
        if (onReviewUpdate) {
          onReviewUpdate(data.station);
        }
      } else {
        toast.error(data.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Review deletion error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Star className="w-6 h-6 text-yellow-400 fill-current" />
            <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
          </div>
          <div>
            <div className="text-sm text-gray-600">
              {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </div>
            <div className="flex items-center space-x-1">
              {renderStars(averageRating)}
            </div>
          </div>
        </div>
        
        {currentUser && !userReview && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Write a Review</span>
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {userReview ? 'Edit Your Review' : 'Write a Review'}
          </h3>
          <form onSubmit={handleSubmitReview}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex items-center space-x-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: i + 1 })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        i < formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="Share your experience with this charging station..."
                maxLength="500"
                required
              />
              <div className="text-sm text-gray-500 mt-1">
                {formData.comment.length}/500 characters
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Submitting...' : (userReview ? 'Update Review' : 'Submit Review')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReviewForm(false);
                  setFormData({ rating: 5, comment: '' });
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User's Review */}
      {userReview && !showReviewForm && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-blue-800">Your Review</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setFormData({ rating: userReview.rating, comment: userReview.comment });
                  setShowReviewForm(true);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteReview}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            {renderStars(userReview.rating)}
            <span className="text-sm text-gray-600">
              {formatDate(userReview.date)}
            </span>
          </div>
          <p className="text-gray-700">{userReview.comment}</p>
        </div>
      )}

      {/* All Reviews */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">All Reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review this station!</p>
        ) : (
          reviews
            .filter(review => !userReview || review._id !== userReview._id)
            .map((review) => (
              <div key={review._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">
                      {review.user?.name || 'Anonymous User'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(review.date)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  {renderStars(review.rating)}
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection; 