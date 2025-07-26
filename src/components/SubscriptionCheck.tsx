import React, { useEffect, useState, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { communityService } from '../services/firebase';

export default function SubscriptionCheck({ children }: { children: React.ReactNode }) {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasValidSubscription, setHasValidSubscription] = useState(false);
  const location = useLocation();
  
  // Check for recent payment success in localStorage
  const recentPaymentSuccess = localStorage.getItem('recentPaymentSuccess');
  const paymentTimestamp = recentPaymentSuccess ? parseInt(recentPaymentSuccess) : 0;
  const isRecentPayment = Date.now() - paymentTimestamp < 1000 * 60 * 30; // 30 minutes
  
  // Skip subscription check if coming from payment-success page, has fromPayment state, or recent payment
  const isFromPaymentSuccess = location.pathname === '/payment-success' || 
                              location.state?.fromPayment === true || 
                              isRecentPayment;

  // Log detailed information for debugging
  useEffect(() => {
    if (userProfile?.communityId) {
      console.log('🔍 SubscriptionCheck Debug:', {
        path: location.pathname,
        isFromPaymentSuccess,
        isRecentPayment,
        paymentTimestamp: new Date(paymentTimestamp).toISOString(),
        fromPaymentState: location.state?.fromPayment,
        communityId: userProfile.communityId,
        hasSubscription: !!userProfile?.subscription,
        subscriptionStatus: userProfile?.subscription?.status,
        subscriptionEndDate: userProfile?.subscription?.endDate
      });
    }
  }, [location, userProfile, isFromPaymentSuccess, isRecentPayment, paymentTimestamp]);

  const checkSubscription = useCallback(async () => {
    // If coming from payment success, assume subscription is valid
    if (isFromPaymentSuccess) {
      console.log('✅ Bypassing subscription check due to recent payment');
      setHasValidSubscription(true);
      setLoading(false);
      return;
    }
    
    if (!userProfile?.communityId) {
      console.warn('❌ No communityId found in userProfile');
      setHasValidSubscription(false);
      setLoading(false);
      return;
    }

    try {
      // Force fresh data from server
      const community = await communityService.getCommunity(userProfile.communityId, true);
      if (!community || !community.subscription) {
        console.warn('❌ Community or subscription not found');
        setHasValidSubscription(false);
        return;
      }

      const { subscription } = community;
      const { status, endsAt } = subscription;

      if (status !== 'active' || !endsAt) {
        console.log('🔒 Subscription inactive or missing end date');
        setHasValidSubscription(false);
      } else {
        const now = new Date();
        const endDate = typeof endsAt.toDate === 'function' ? endsAt.toDate() : new Date(endsAt);
        console.log('📅 Subscription end date:', endDate);

        if (endDate >= now) {
          setHasValidSubscription(true);
        } else {
          console.warn('📅 Subscription has expired:', endDate);
          setHasValidSubscription(false);
        }
      }
    } catch (error) {
      console.error('🔥 Error checking subscription:', error);
      setHasValidSubscription(false);
    } finally {
      setLoading(false);
    }
  }, [userProfile, isFromPaymentSuccess, isRecentPayment]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasValidSubscription && !isFromPaymentSuccess) {
    // IMPORTANT: Skip redirect if we're in a redirect loop
    // This prevents the user from getting stuck in a redirect loop
    const lastRedirectTime = sessionStorage.getItem('lastSubscriptionRedirect');
    const currentTime = Date.now();
    if (lastRedirectTime && (currentTime - parseInt(lastRedirectTime)) < 5000) {
      console.warn('⚠️ Detected potential redirect loop in SubscriptionCheck, bypassing redirect');
      return <>{children}</>;
    }
    
    console.log('🔄 Redirecting to subscription expired page');
    // Record the redirect time to detect loops
    sessionStorage.setItem('lastSubscriptionRedirect', currentTime.toString());
    return <Navigate to="/subscription-expired" replace />;
  }

  return <>{children}</>;
}