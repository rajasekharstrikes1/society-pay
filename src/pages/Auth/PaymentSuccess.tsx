import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, CreditCard } from 'lucide-react';
// Corrected import path - going up two levels from pages/Auth to src
import { useAuth } from '../../contexts/AuthContext';
// Import subscription utilities
import { markPaymentSuccess } from '../../utils/subscriptionUtils';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const userProfile = auth.userProfile;
  const refreshUserProfile = auth.refreshUserProfile || (() => Promise.resolve());
  
  const [countdown, setCountdown] = useState(5);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  
  const { paymentId = '', subscriptionName = '', subscriptionData = null } = location.state || {};

  useEffect(() => {
    // Mark payment as successful using our utility function
    markPaymentSuccess(paymentId || '');
    console.log('💰 Payment success recorded using utility function', { paymentId });
    
    // Refresh user profile to get updated subscription data
    const fetchData = async () => {
      try {
        // Try to refresh user profile if the function exists
        if (typeof refreshUserProfile === 'function') {
          console.log('🔄 Refreshing user profile after payment');
          await refreshUserProfile();
          console.log('✅ User profile refreshed successfully');
        }
        
        // Get subscription details from userProfile or from location state
        if (subscriptionData) {
          console.log('📋 Using subscription details from payment response:', subscriptionData);
          setSubscriptionDetails(subscriptionData);
        } else if (userProfile?.subscription) {
          console.log('📋 Using subscription details from user profile:', userProfile.subscription);
          setSubscriptionDetails(userProfile.subscription);
        } else {
          console.warn('⚠️ No subscription details found');
        }
      } catch (error) {
        console.error('🔥 Error refreshing profile:', error);
      }
    };
    
    fetchData();
    
    // Redirect to admin dashboard after 5 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Set the fromPaymentSuccess flag in sessionStorage
          sessionStorage.setItem('fromPaymentSuccess', 'true');
          
          // Use state to indicate this is coming from payment success
          navigate('/admin', { 
            replace: true,
            state: { 
              fromPayment: true,
              fromPaymentSuccess: true
            }
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, refreshUserProfile, userProfile, auth, subscriptionData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Payment Successful!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your subscription has been activated successfully.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-start">
              <CreditCard className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Payment Details</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Payment ID: <span className="font-medium">{paymentId}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Plan: <span className="font-medium">{subscriptionName}</span>
                </p>
              </div>
            </div>
          </div>

          {subscriptionDetails && (
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900">Subscription Details</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Status: <span className="font-medium capitalize">{subscriptionDetails.status || 'Active'}</span>
                  </p>
                  {subscriptionDetails.endDate && (
                    <p className="text-sm text-blue-700 mt-1">
                      Valid until: <span className="font-medium">
                        {new Date(subscriptionDetails.endDate).toLocaleDateString()}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-sm text-green-700">
              Your subscription is now active. You will be redirected to the admin dashboard in {countdown} seconds.
            </p>
          </div>

          <button
            onClick={() => {
              // Set the fromPaymentSuccess flag in sessionStorage
              sessionStorage.setItem('fromPaymentSuccess', 'true');
              
              navigate('/admin', { 
                replace: true,
                state: { 
                  fromPayment: true,
                  fromPaymentSuccess: true
                }
              });
            }}
            className="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 flex items-center justify-center font-medium"
          >
            Go to Dashboard Now
          </button>
        </div>
      </div>
    </div>
  );
}