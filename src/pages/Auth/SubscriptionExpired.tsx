import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CreditCard, Calendar, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { communityService } from '../../services/firebase';
// Import the subscription utilities
import { bypassSubscriptionCheck } from '../../utils/subscriptionUtils';

// --- Community Type ---
interface Community {
  id: string;
  name: string;
  subscriptionEndDate?: { toDate: () => Date } | Date;
  subscriptionStatus?: string;
  adminEmail?: string;
  phone?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// --- Helper to Normalize Firestore/JS Date Format ---
function parseDate(input: any): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;
  if (typeof input.toDate === 'function') return input.toDate();
  return new Date(input);
}

export default function SubscriptionExpired() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Check for recent payment success in localStorage
    const recentPaymentSuccess = localStorage.getItem('recentPaymentSuccess');
    const paymentTimestamp = recentPaymentSuccess ? parseInt(recentPaymentSuccess) : 0;
    const isRecentPayment = Date.now() - paymentTimestamp < 1000 * 60 * 30; // 30 minutes
    
    // If there was a recent payment, redirect to admin dashboard
    if (isRecentPayment) {
      console.log('💰 Recent payment detected, redirecting to admin dashboard');
      navigate('/admin', { 
        replace: true,
        state: { fromPayment: true }
      });
      return;
    }
    
    if (!userProfile?.communityId) return;

    const fetchData = async () => {
      try {
        // Force fresh data from server
        const communityData = await communityService.getCommunity(userProfile.communityId, true);
        console.log('📋 Community data:', communityData);
        
        // Check if we have valid community data
        if (!communityData) {
          console.error('❌ No community data found');
          setIsExpired(true);
          setLoading(false);
          return;
        }
        
        // Log detailed subscription information
        console.log('🔍 Subscription details from community:', {
          subscriptionEndDate: communityData?.subscriptionEndDate,
          subscription: communityData?.subscription,
          hasSubscription: !!communityData?.subscription,
          status: communityData?.subscription?.status
        });
        
        // Check if we have a valid subscription in the community data
        if (communityData.subscription && communityData.subscription.status === 'active') {
          console.log('✅ Active subscription found in community data');
          
          // Set a flag in sessionStorage to prevent redirect loops
          sessionStorage.setItem('validSubscriptionDetected', 'true');
          
          // Redirect to admin dashboard
          console.log('✅ Subscription is active, redirecting to admin');
          navigate('/admin', { 
            replace: true,
            state: { fromSubscriptionCheck: true }
          });
          return;
        }
        
        // Try to parse the end date from the community data
        const parsedEndDate = parseDate(communityData?.subscriptionEndDate);
        const now = new Date();

        if (parsedEndDate && now <= parsedEndDate) {
          console.log('✅ Subscription is still valid based on end date, redirecting to admin');
          
          // Set a flag in sessionStorage to prevent redirect loops
          sessionStorage.setItem('validSubscriptionDetected', 'true');
          
          // Subscription is still valid, redirect
          navigate('/admin', { 
            replace: true,
            state: { fromSubscriptionCheck: true }
          });
        } else {
          console.log('❌ Subscription has expired or is missing');
          setIsExpired(true);
          setCommunity(communityData as Community);
        }
      } catch (error) {
        console.error('🔥 Error fetching community:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile?.communityId, navigate]);

  const handleRenewSubscription = () => {
    navigate('/select-subscription', {
      state: {
        communityId: userProfile?.communityId,
        adminEmail: userProfile?.email,
        isRenewal: true
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isExpired) return null;

  const formattedDate = parseDate(community?.subscriptionEndDate)?.toLocaleDateString() || 'an unknown date';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-yellow-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Subscription Expired
          </h2>
          <p className="mt-2 text-sm text-gray-200">
            Your subscription has expired. Please renew to continue using SocietyPay.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {community?.name || 'Your Community'}
            </h3>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <Calendar className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Subscription Status</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Your subscription expired on <strong>{formattedDate}</strong>.
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Renew now to regain access to all features.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Features you'll regain:</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              {[
                'Tenant management system',
                'Maintenance bill generation',
                'WhatsApp notifications',
                'Payment tracking & reports',
                'Complete analytics dashboard'
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center">
                  <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleRenewSubscription}
            className="w-full bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary/90 flex items-center justify-center font-medium"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Renew Subscription
          </button>
          
          {/* Temporary button to bypass subscription check for debugging */}
          <button
            onClick={() => {
              // Bypass subscription check and redirect to admin
              bypassSubscriptionCheck();
              navigate('/admin', { replace: true });
            }}
            className="w-full mt-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 flex items-center justify-center font-medium"
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Temporarily Access Dashboard
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@societypay.com" className="text-secondary hover:text-secondary/80">
                support@societypay.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}