import React from 'react';
import { Star } from 'lucide-react';

const StationRating = ({ rating, totalReviews, size = 'sm', showCount = true }) => {
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${
          size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
        } ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (rating === 0) {
    return (
      <div className="flex items-center space-x-1">
        <span className="text-gray-400 text-xs">No reviews</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center space-x-0.5">
        {renderStars(rating)}
      </div>
      <span className={`text-gray-600 ${
        size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
      }`}>
        {rating.toFixed(1)}
      </span>
      {showCount && totalReviews > 0 && (
        <span className={`text-gray-500 ${
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
        }`}>
          ({totalReviews})
        </span>
      )}
    </div>
  );
};

export default StationRating; 