import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CreditCard, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import OnWheelPaymentModal from './OnWheelPaymentModal';

const BookNowButton = ({ service, userLocation }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);

  const handleBookNow = async () => {
    setLoading(true);
    
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to book a service');
        navigate('/login');
        return;
      }

      // Navigate to request page with service data
      navigate('/request-onwheel-service', {
        state: {
          service: service,
          userLocation: userLocation || [12.372319, 76.585330] // Default to Mysore coordinates
        }
      });

    } catch (error) {
      console.error('Error in book now:', error);
      toast.error('Failed to proceed with booking');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickBook = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to book a service');
        navigate('/login');
        return;
      }

      // Calculate total amount (base price + travel fee)
      const basePrice = service.pricePerHour * 2; // 2 hours default
      const travelFee = service.travelFee;
      const totalAmount = Math.max(basePrice + travelFee, service.minimumCharge);

      // Show payment modal directly
      setShowPaymentModal(true);
      setCreatedRequest({
        _id: 'temp-' + Date.now(),
        service: service,
        pricing: {
          totalAmount: totalAmount,
          currency: 'USD'
        }
      });

    } catch (error) {
      console.error('Error in quick book:', error);
      toast.error('Failed to proceed with booking');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (request) => {
    setShowPaymentModal(false);
    toast.success('Payment successful! Your on-wheel service has been booked.');
    navigate('/dashboard');
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleBookNow}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
          Book Now
        </button>
        
        <button
          onClick={handleQuickBook}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          Quick Book
        </button>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && createdRequest && (
        <OnWheelPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          requestId={createdRequest._id}
          amount={createdRequest.pricing.totalAmount}
          currency={createdRequest.pricing.currency}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default BookNowButton;
