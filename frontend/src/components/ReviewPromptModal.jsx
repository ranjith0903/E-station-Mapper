import React, { useState } from 'react';
import { Star, X, MessageSquare, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const ReviewPromptModal = ({ isOpen, onClose, booking, onSubmitReview }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please add a comment to your review');
      return;
    }

    setLoading(true);
    try {
      await onSubmitReview(booking.station._id, { rating, comment });
      onClose();
      toast.success('Thank you for your review!');
    } catch (error) {
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
    toast.success('Review skipped. You can review this station later.');
  };

  const handleRemindLater = () => {
    // Reset the session flag so it can show again later
    sessionStorage.removeItem('hasShownReviewThisSession');
    onClose();
    toast.success('We\'ll remind you later to review this station.');
  };

  const handleDontAskAgain = () => {
    // Store preference to not show review prompts
    localStorage.setItem('dontShowReviewPrompts', 'true');
    onClose();
    toast.success('Review prompts disabled. You can enable them in settings.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            How was your charging experience?
          </h2>
          <p className="text-gray-600 text-sm">
            Help other EV drivers by sharing your experience at{' '}
            <span className="font-medium">{booking.station?.name}</span>
          </p>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rate your experience
            </label>
            <div className="flex items-center justify-center space-x-1">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  className="focus:outline-none transition-colors"
                >
                  <Star
                    className={`w-8 h-8 ${
                      i < rating 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-center text-sm text-gray-500 mt-1">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share your experience
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="4"
              placeholder="Tell us about your charging experience, station condition, ease of use, etc..."
              maxLength="500"
              required
            />
            <div className="text-sm text-gray-500 mt-1 text-right">
              {comment.length}/500 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 pt-4">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleRemindLater}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Remind me later
              </button>
              <button
                type="submit"
                disabled={loading || !comment.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Submit Review</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={handleDontAskAgain}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Don't ask again
              </button>
            </div>
          </div>
        </form>

        {/* Session Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Session Duration:</span>
              <span className="font-medium">
                {booking.sessionDuration ? `${Math.floor(booking.sessionDuration / 60)}h ${booking.sessionDuration % 60}m` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span className="font-medium">₹{booking.amount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPromptModal; 