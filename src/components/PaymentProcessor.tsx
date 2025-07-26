import React, { useState } from 'react';
import { paymentService } from '../services/paymentService';
import { CreditCard, Loader2 } from 'lucide-react';

interface PaymentProcessorProps {
  amount: number;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({ 
  amount, 
  onSuccess, 
  onError, 
  disabled = false 
}) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (disabled || loading) return;
    
    setLoading(true);
    
    try {
      // Create Razorpay order
      const orderResponse = await paymentService.createOrder({
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        notes: {
          description: 'Maintenance Payment'
        }
      });

      if (!orderResponse.success) {
        throw new Error('Failed to create order');
      }

      // Initialize Razorpay payment
      paymentService.initializeRazorpay(
        orderResponse.order,
        async (response: any) => {
          try {
            // Verify payment
            const verification = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderResponse.order.id
            });

            if (verification.success) {
              onSuccess?.(response);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            onError?.(error instanceof Error ? error.message : 'Payment verification failed');
          } finally {
            setLoading(false);
          }
        },
        (error: any) => {
          console.error('Payment error:', error);
          onError?.(error instanceof Error ? error.message : 'Payment failed');
          setLoading(false);
        }
      );

    } catch (error) {
      console.error('Payment initialization error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to initialize payment');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || loading}
      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" />
          Pay ₹{amount}
        </>
      )}
    </button>
  );
};

export default PaymentProcessor;