import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

// Load Stripe (using the same key as station booking)
const stripePromise = loadStripe('pk_test_51QBqViHVrEESOxZHwP3ur6Ga3060peMawzOmlj7qrPi5IWPLdVRHtUjyudYiXT874RgzwpKtYu46QyRsJkHqaF8C00heb4jEYZ');

const PaymentForm = ({ requestId, amount, currency, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [requestDetails, setRequestDetails] = useState(null);

  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payment/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          amount: amount,
          currency: currency || 'inr'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setClientSecret(data.clientSecret);
        setRequestDetails({
          serviceName: 'On-Wheel Charging Service',
          companyName: 'Mobile Charging Provider',
          basePrice: amount - 6, // Assuming 6 is travel fee
          travelFee: 6,
          totalAmount: amount
        });
      } else {
        toast.error(data.message || 'Error creating payment intent');
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Error creating payment intent');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment with backend
        await confirmPayment(paymentIntent.id);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentIntentId) => {
    try {
      // For now, just show success message
      toast.success('Payment successful! Your on-wheel service request has been confirmed.');
      onSuccess({ id: requestId, status: 'confirmed' });
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Error confirming payment');
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Preparing payment...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {requestDetails && (
        <div className="p-6 border-b bg-gray-50">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium">{requestDetails.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Provider:</span>
              <span className="font-medium">{requestDetails.companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Base Price:</span>
              <span className="font-medium">${requestDetails.basePrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Travel Fee:</span>
              <span className="font-medium">${requestDetails.travelFee}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span className="text-blue-600">${requestDetails.totalAmount}</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="border border-gray-300 rounded-md p-3">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span>Your payment is secure and encrypted</span>
          </div>

          <button
            type="submit"
            disabled={!stripe || loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Pay ${amount}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const OnWheelPaymentModal = ({ isOpen, onClose, requestId, amount, currency, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Elements stripe={stripePromise}>
        <PaymentForm
          requestId={requestId}
          amount={amount}
          currency={currency}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      </Elements>
    </div>
  );
};

export default OnWheelPaymentModal;
