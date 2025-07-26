import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// Import the community service to directly check subscription
import { communityService } from '../services/firebase';
// Import subscription utilities
import { shouldBypassSubscriptionCheck } from '../utils/subscriptionUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'community_admin' | 'tenant';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const auth = useAuth();
  const user = auth.user;
  const userProfile = auth.userProfile;
  const loading = auth.loading;
  // Handle case where refreshUserProfile might not exist
  const refreshUserProfile = auth.refreshUserProfile || (() => {});
  const location = useLocation();
  
  // State to track direct community subscription check
  const [directCheckComplete, setDirectCheckComplete] = useState(false);
  const [hasValidSubscription, setHasValidSubscription] = useState(false);
  
  // Check for recent payment success in localStorage
  const recentPaymentSuccess = localStorage.getItem('recentPaymentSuccess');
  const paymentTimestamp = recentPaymentSuccess ? parseInt(recentPaymentSuccess) : 0;
  const isRecentPayment = Date.now() - paymentTimestamp < 1000 * 60 * 30; // 30 minutes
  
  // Check if a valid subscription was detected in SubscriptionExpired component
  const validSubscriptionDetected = sessionStorage.getItem('validSubscriptionDetected') === 'true';
  
  // Check if we should bypass subscription check using our utility function
  const bypassCheck = shouldBypassSubscriptionCheck();
  
  // Skip subscription check if:
  // 1. On payment-related pages
  // 2. After recent payment
  // 3. Coming from subscription check with valid subscription
  // 4. Coming from payment flow
  // 5. Bypass flag is set
  const isPaymentRelated = location.pathname === '/payment-success' || 
                           location.pathname === '/select-subscription' ||
                           location.state?.fromPayment === true ||
                           location.state?.fromSubscriptionCheck === true ||
                           isRecentPayment ||
                           validSubscriptionDetected ||
                           bypassCheck;
                           
  // Log detailed information for debugging
  useEffect(() => {
    if (userProfile?.role === 'community_admin') {
      console.log('🔍 ProtectedRoute Debug:', {
        path: location.pathname,
        isPaymentRelated,
        isRecentPayment,
        validSubscriptionDetected,
        bypassCheck,
        paymentTimestamp: paymentTimestamp ? new Date(paymentTimestamp).toISOString() : null,
        fromPaymentState: location.state?.fromPayment,
        fromSubscriptionCheck: location.state?.fromSubscriptionCheck,
        hasSubscription: !!userProfile?.subscription,
        subscriptionStatus: userProfile?.subscription?.status,
        subscriptionEndDate: userProfile?.subscription?.endDate,
        bypassingCheck: isPaymentRelated,
        sessionStorageBypass: sessionStorage.getItem('bypassSubscriptionCheck')
      });
    }
  }, [location, userProfile, isPaymentRelated, isRecentPayment, paymentTimestamp, validSubscriptionDetected, bypassCheck]);
  
  // Effect to directly check community subscription
  useEffect(() => {
    // Only run for community_admin role and if we have a communityId
    if (userProfile?.role === 'community_admin' && userProfile?.communityId && !isPaymentRelated) {
      const checkCommunitySubscription = async () => {
        try {
          // Force fresh data from server
          const communityData = await communityService.getCommunity(userProfile.communityId, true);
          
          console.log('🔍 Direct community subscription check:', {
            communityId: userProfile.communityId,
            hasSubscription: !!communityData?.subscription,
            status: communityData?.subscription?.status,
            endDate: communityData?.subscription?.endDate
          });
          
          // Check if we have a valid subscription
          if (communityData?.subscription?.status === 'active') {
            console.log('✅ Valid subscription found in direct community check');
            setHasValidSubscription(true);
            // Set flag to prevent redirect loops
            sessionStorage.setItem('validSubscriptionDetected', 'true');
          } else {
            console.log('❌ No valid subscription found in direct community check');
            setHasValidSubscription(false);
          }
        } catch (error) {
          console.error('🔥 Error in direct community subscription check:', error);
        } finally {
          setDirectCheckComplete(true);
        }
      };
      
      checkCommunitySubscription();
    }
  }, [userProfile?.communityId, userProfile?.role, isPaymentRelated]);

  if (loading) {
    console.log('🔄 Auth is loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    console.warn('🛑 No Firebase user found. Redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  if (!userProfile) {
    console.warn('⚠️ No userProfile found. Redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userProfile.role !== requiredRole) {
    console.warn(`⛔ Access denied. Required: ${requiredRole}, Found: ${userProfile.role}`);
    return <Navigate to="/unauthorized" replace />;
  }

  // Only check subscription for community_admin role and skip for payment-related pages
  if (userProfile.role === 'community_admin' && !isPaymentRelated) {
    // IMPORTANT: Skip subscription check if we're in a redirect loop
    // This prevents the user from getting stuck in a redirect loop
    const lastRedirectTime = sessionStorage.getItem('lastSubscriptionRedirect');
    const currentTime = Date.now();
    if (lastRedirectTime && (currentTime - parseInt(lastRedirectTime)) < 5000) {
      console.warn('⚠️ Detected potential redirect loop, bypassing subscription check');
      return <>{children}</>;
    }
    
    // If we've completed the direct check and found a valid subscription, allow access
    if (directCheckComplete && hasValidSubscription) {
      console.log('✅ Valid subscription confirmed by direct check');
      return <>{children}</>;
    }
    
    // Refresh user profile to get the latest subscription data if the function exists
    if (typeof refreshUserProfile === 'function') {
      refreshUserProfile();
    }
    
    // Get subscription from userProfile
    const subscription = userProfile.subscription as {
      status: string;
      endDate: string | Date;
    };
    
    // Log detailed subscription information for debugging
    console.log('🔍 Subscription check details:', {
      hasSubscription: !!subscription,
      status: subscription?.status,
      endDate: subscription?.endDate,
      userProfileId: userProfile.id,
      communityId: userProfile.communityId,
      directCheckComplete,
      hasValidSubscription
    });

    // If direct check is complete but no valid subscription was found,
    // and userProfile also shows no valid subscription, redirect
    if (directCheckComplete && !hasValidSubscription && (!subscription || subscription.status !== 'active')) {
      console.warn('🔒 Subscription inactive or missing (confirmed by direct check). Redirecting to /subscription-expired');
      // Record the redirect time to detect loops
      sessionStorage.setItem('lastSubscriptionRedirect', currentTime.toString());
      return <Navigate to="/subscription-expired" replace />;
    }
    
    // If direct check is not complete yet, use the userProfile data
    if (!directCheckComplete) {
      // Check if subscription exists and is active
      if (!subscription || subscription.status !== 'active') {
        console.warn('🔒 Subscription inactive or missing. Redirecting to /subscription-expired');
        // Record the redirect time to detect loops
        sessionStorage.setItem('lastSubscriptionRedirect', currentTime.toString());
        return <Navigate to="/subscription-expired" replace />;
      }

      // Parse the end date
      let endDate;
      try {
        endDate = new Date(
          typeof subscription.endDate === 'string'
            ? subscription.endDate
            : subscription.endDate?.toString()
        );
        
        // Check if the date is valid
        if (isNaN(endDate.getTime())) {
          console.warn('⚠️ Invalid subscription end date');
          return <>{children}</>; // Allow access if date is invalid
        }
      } catch (error) {
        console.error('🔥 Error parsing subscription end date:', error);
        return <>{children}</>; // Allow access if there's an error
      }
      
      const today = new Date();

      // Check if subscription has expired
      if (endDate < today) {
        console.warn(`📅 Subscription expired on ${endDate.toDateString()}`);
        // Record the redirect time to detect loops
        sessionStorage.setItem('lastSubscriptionRedirect', currentTime.toString());
        return <Navigate to="/subscription-expired" replace />;
      }

      console.log(`✅ Subscription valid until ${endDate.toDateString()}`);
    }
  }

  return <>{children}</>;
}