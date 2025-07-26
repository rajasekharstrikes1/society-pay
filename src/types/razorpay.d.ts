// src/types/razorpay.d.ts (or wherever you place custom types)
// Type declarations for the Razorpay Node.js SDK (minimal version for orders and basic usage)

declare module 'razorpay' {
  interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  interface RazorpayOrderRequest {
    amount: number; // Amount in the smallest currency unit (e.g., paise for INR)
    currency: string; // e.g., 'INR'
    receipt?: string;
    payment_capture?: 0 | 1; // 1 to auto-capture, 0 for manual
    notes?: Record<string, string>; // Improved to string for common use cases
  }

  interface RazorpayOrder {
    id: string;
    entity: string; // 'order'
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: 'created' | 'attempted' | 'paid'; // Common statuses
    created_at: number; // Unix timestamp
    notes?: Record<string, string>;
  }

  // Basic error type (Razorpay SDK throws/rejects with these)
  interface RazorpayError extends Error {
    status: number;
    error: {
      code: string;
      description: string;
      source?: string;
      step?: string;
      reason?: string;
      metadata?: Record<string, any>;
    };
  }

  class Razorpay {
    constructor(options: RazorpayOptions);

    orders: {
      // Create a new order
      create(params: RazorpayOrderRequest): Promise<RazorpayOrder>;

      // Fetch an order by ID (example of expanding for more methods)
      fetch(orderId: string): Promise<RazorpayOrder>;

      // Add more methods as needed, e.g., all(): Promise<RazorpayOrder[]>;
    };

    // Add other namespaces if used, e.g., payments: { fetch(paymentId: string): Promise<any>; };
  }

  export = Razorpay;
}
