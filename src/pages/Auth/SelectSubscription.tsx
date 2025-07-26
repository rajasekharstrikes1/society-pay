import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Crown, Star, Building2, Check } from "lucide-react";
import { subscriptionService, platformSettingsService } from "../../services/firebase";
import { getAuth } from "firebase/auth";
// Import subscription utilities
import { markPaymentSuccess } from "../../utils/subscriptionUtils";

// API base resolver
const getApiBase = () => {
  return import.meta.env.DEV
    ? "http://localhost:5001/tenant-f74c7/us-central1/api"
    : "/api";
};

interface Subscription {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  maxTenants: number;
  features: string[];
}

interface PlatformSettings {
  razorpayKeyId: string;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill: { email: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}

interface OrderData {
  id: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

export default function SelectSubscription() {
  const location = useLocation();
  const navigate = useNavigate();
  const { communityId = "", adminEmail = "" } = location.state || {};

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subs, settings] = await Promise.all([
        subscriptionService.getActiveSubscriptions(),
        platformSettingsService.getPlatformSettings()
      ]);
      setSubscriptions(subs as Subscription[]);
      setPlatformSettings(settings as PlatformSettings);
    } catch (error) {
      console.error("Error loading subscriptions or platform settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!communityId) {
      navigate("/signup");
      return;
    }

    fetchData();

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [communityId, navigate, fetchData]);

  const handlePayment = async () => {
    if (!selectedSubscription || !platformSettings) {
      alert("Please select a subscription plan");
      return;
    }

    const subscription = subscriptions.find((s) => s.id === selectedSubscription);
    if (!subscription) return;

    setProcessing(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const token = await user.getIdToken();
    const authToken = token; // ✅ FIX: store for use inside Razorpay handler

const orderResponse = await fetch(`${getApiBase()}/create-order`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}` // ✅ use consistent variable
  },
  body: JSON.stringify({
    amount: subscription.price * 100
  }),
});

      if (!orderResponse.ok) throw new Error("Failed to create Razorpay order");

      const orderData: { order: OrderData } = await orderResponse.json();

      const options: RazorpayOptions = {
        key: platformSettings.razorpayKeyId,
        amount: subscription.price * 100,
        currency: "INR",
        name: "SocietyPay",
        description: `${subscription.name} Subscription`,
        order_id: orderData.order.id,
        prefill: { email: adminEmail },
        theme: { color: "#309b47" },
        modal: { ondismiss: () => setProcessing(false) },

        handler: async function (response: RazorpaySuccessResponse) {
          console.log("🧾 Razorpay Response:", response);
          try {
            const verifyResponse = await fetch(`${getApiBase()}/verify-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`, // Use consistent variable
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                communityId,
                subscriptionId: selectedSubscription,
                duration: subscription.duration,
                updateSubscription: true // Explicitly request subscription update
              }),
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.message || "Payment verification failed");
            }

            // Get the verification response data
            const verificationData = await verifyResponse.json();
            console.log("✅ Payment verification successful:", verificationData);
            
            // Mark payment as successful using our utility function
            markPaymentSuccess(response.razorpay_payment_id);
            console.log("💰 Payment success recorded using utility function", {
              paymentId: response.razorpay_payment_id,
              subscriptionName: subscription.name
            });

            // Add a delay to ensure the database is updated
            setTimeout(() => {
              navigate("/payment-success", {
                state: {
                  paymentId: response.razorpay_payment_id,
                  subscriptionName: subscription.name,
                  fromPayment: true,
                  subscriptionData: verificationData.subscription || null
                },
                replace: true
              });
            }, 2000); // Increased delay to 2 seconds
          } catch (err: any) {
            console.error("Verification failed:", err);
            alert(`Payment verification failed: ${err.message}`);
            setProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Something went wrong during payment. Try again.");
      setProcessing(false);
    }
  };

  const getSubscriptionIcon = (name: string) => {
    if (name.toLowerCase().includes("premium")) return Star;
    if (name.toLowerCase().includes("enterprise")) return Crown;
    return Building2;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-4">
            Choose Your Subscription Plan
          </h1>
          <p className="text-gray-200">
            Select the perfect plan for your community management needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {subscriptions.map((subscription) => {
            const Icon = getSubscriptionIcon(subscription.name);
            const isSelected = selectedSubscription === subscription.id;

            return (
              <div
                key={subscription.id}
                className={`bg-white rounded-lg shadow-xl p-6 cursor-pointer transition-all transform hover:scale-105 ${
                  isSelected ? "ring-4 ring-secondary" : ""
                }`}
                onClick={() => setSelectedSubscription(subscription.id)}
              >
                <div className="text-center">
                  <Icon className="h-12 w-12 mx-auto mb-4 text-secondary" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {subscription.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{subscription.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      ₹{subscription.price.toLocaleString()}
                    </span>
                    <span className="text-gray-500 ml-1">
                      /{subscription.duration} months
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Up to{" "}
                    {subscription.maxTenants === 999999 ? "Unlimited" : subscription.maxTenants} tenants
                  </p>
                  <ul className="text-left space-y-2 mb-6">
                    {subscription.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <Check className="h-4 w-4 text-secondary mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {isSelected && (
                    <div className="bg-secondary/10 border border-secondary rounded-md p-3">
                      <p className="text-secondary font-medium text-sm">Selected Plan</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={handlePayment}
            disabled={!selectedSubscription || processing}
            className="bg-white text-primary px-8 py-3 rounded-md font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? "Processing..." : "Proceed to Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}