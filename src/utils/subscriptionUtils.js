// ✅ utils/subscriptionUtils.ts

export const isFromPaymentFlow = (): boolean => {
    const recentPaymentSuccess = localStorage.getItem('recentPaymentSuccess');
    if (recentPaymentSuccess) {
      const paymentTimestamp = parseInt(recentPaymentSuccess);
      const isRecent = Date.now() - paymentTimestamp < 1000 * 60 * 30; // 30 mins
      if (isRecent) return true;
    }
  
    const validDetected = sessionStorage.getItem('validSubscriptionDetected') === 'true';
    const fromPayment = sessionStorage.getItem('fromPaymentSuccess') === 'true';
  
    return validDetected || fromPayment;
  };
  
  export const markPaymentSuccess = (paymentId: string, community: any) => {
    localStorage.setItem('recentPaymentSuccess', Date.now().toString());
    sessionStorage.setItem('validSubscriptionDetected', 'true');
    sessionStorage.setItem('fromPaymentSuccess', 'true');
  
    if (paymentId) localStorage.setItem('lastSuccessfulPayment', paymentId);
  
    if (community?.subscriptionStatus) {
      sessionStorage.setItem('subscriptionStatus', community.subscriptionStatus);
    }
  
    if (community?.subscriptionEndDate?.toDate) {
      sessionStorage.setItem('subscriptionEndDate', community.subscriptionEndDate.toDate().toISOString());
    }
  
    console.log('💰 Payment success recorded');
  };
  
  export const bypassSubscriptionCheck = () => {
    sessionStorage.setItem('bypassSubscriptionCheck', 'true');
    console.log('🔓 Subscription bypass set');
  };
  
  export const shouldBypassSubscriptionCheck = (): boolean => {
    const bypass = sessionStorage.getItem('bypassSubscriptionCheck') === 'true';
    const paymentFlow = isFromPaymentFlow();
    const status = sessionStorage.getItem('subscriptionStatus');
    const endDateRaw = sessionStorage.getItem('subscriptionEndDate');
  
    const endDateValid = endDateRaw && new Date(endDateRaw) > new Date();
    const statusValid = status === 'active';
  
    return (bypass || paymentFlow) && statusValid && endDateValid;
  };
  
  
  // ✅ components/SubscriptionCheck.tsx
  
  import React, { useEffect, useState, useCallback } from 'react';
  import { Navigate } from 'react-router-dom';
  import { useAuth } from '../contexts/AuthContext';
  import { communityService } from '../services/firebase';
  import { shouldBypassSubscriptionCheck } from '../utils/subscriptionUtils';
  
  export default function SubscriptionCheck({ children }: { children: React.ReactNode }) {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [hasValidSubscription, setHasValidSubscription] = useState(false);
  
    const checkSubscription = useCallback(async () => {
      if (!userProfile?.communityId) {
        console.warn('❌ No communityId');
        setHasValidSubscription(false);
        setLoading(false);
        return;
      }
  
      try {
        const community = await communityService.getCommunity(userProfile.communityId);
        if (!community) {
          console.warn('❌ Community not found');
          setHasValidSubscription(false);
          return;
        }
  
        const { subscriptionEndDate, subscriptionStatus } = community;
        const now = new Date();
        const endDate =
          typeof subscriptionEndDate?.toDate === 'function'
            ? subscriptionEndDate.toDate()
            : new Date(subscriptionEndDate);
  
        const isValid = subscriptionStatus === 'active' && endDate > now;
        setHasValidSubscription(isValid);
  
        if (isValid) {
          sessionStorage.setItem('subscriptionStatus', 'active');
          sessionStorage.setItem('subscriptionEndDate', endDate.toISOString());
        }
      } catch (err) {
        console.error('🔥 Subscription fetch error:', err);
        setHasValidSubscription(false);
      } finally {
        setLoading(false);
      }
    }, [userProfile]);
  
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
  
    if (!hasValidSubscription && !shouldBypassSubscriptionCheck()) {
      return <Navigate to="/subscription-expired" replace />;
    }
  
    return <>{children}</>;
  }
  