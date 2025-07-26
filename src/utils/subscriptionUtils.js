// ✅ utils/subscriptionUtils.js

export const isFromPaymentFlow = () => {
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
  
  export const markPaymentSuccess = (paymentId, community) => {
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
  
  export const shouldBypassSubscriptionCheck = () => {
    const bypass = sessionStorage.getItem('bypassSubscriptionCheck') === 'true';
    const paymentFlow = isFromPaymentFlow();
    const status = sessionStorage.getItem('subscriptionStatus');
    const endDateRaw = sessionStorage.getItem('subscriptionEndDate');
  
    const endDateValid = endDateRaw && new Date(endDateRaw) > new Date();
    const statusValid = status === 'active';
  
    return (bypass || paymentFlow) && statusValid && endDateValid;
  };

  