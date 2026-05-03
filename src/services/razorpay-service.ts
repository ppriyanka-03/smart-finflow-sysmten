// 🚀 RAZORPAY SERVICE - SECURE FRONTEND INTEGRATION
// This service handles all Razorpay operations securely

// 🔒 DEMO MODE FLAG - Set to true for demo/testing without real payment
const DEMO_MODE = true;

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  notes: any;
}

interface PaymentOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: any) => void;
  prefill?: {
    contact?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: string;
}

export class RazorpayService {
  private static instance: any = null;
  private static API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // 🚀 STEP 1: Create Payment Order
  static async createOrder(
    amount: number,
    description: string,
    userEmail?: string,
    notes?: any
  ): Promise<{ success: boolean; order?: PaymentOrder; error?: string }> {
    // 🔒 DEMO MODE: Bypass actual API call
    if (DEMO_MODE) {
      // Simulate delay for realistic feel
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return mock order for demo
      return {
        success: true,
        order: {
          id: `demo_order_${Date.now()}`,
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: { description, email: userEmail, ...notes },
        },
      };
    }

    // Live mode: Call actual backend API
    try {
      const response = await fetch(`${this.API_URL}/api/create-payment-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            description,
            email: userEmail,
            ...notes,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          order: data.order,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to create payment order',
        };
      }
    } catch (error) {
      console.error('Order creation error:', error);
      return {
        success: false,
        error: 'Network error while creating payment order',
      };
    }
  }

  // 🚀 STEP 2: Verify Payment Signature
  static async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<{ success: boolean; verified?: boolean; error?: string }> {
    // 🔒 DEMO MODE: Bypass actual API call
    if (DEMO_MODE) {
      // Simulate delay for realistic feel
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock verification for demo
      return {
        success: true,
        verified: true,
      };
    }

    // Live mode: Call actual backend API
    try {
      const response = await fetch(`${this.API_URL}/api/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          verified: data.verified,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Payment verification failed',
        };
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        error: 'Network error while verifying payment',
      };
    }
  }

  // 🚀 STEP 3: Open Razorpay Payment Modal
  static openPaymentModal(
    options: PaymentOptions,
    onSuccess: (result: PaymentResult) => void,
    onFailure: (result: PaymentResult) => void
  ): void {
    // Load Razorpay script if not already loaded
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/razorpay.js';
      script.async = true;
      script.onload = () => {
        this.initializeAndOpen(options, onSuccess, onFailure);
      };
      document.head.appendChild(script);
    } else {
      this.initializeAndOpen(options, onSuccess, onFailure);
    }
  }

  private static initializeAndOpen(
    options: PaymentOptions,
    onSuccess: (result: PaymentResult) => void,
    onFailure: (result: PaymentResult) => void
  ): void {
    try {
      const razorpay = new window.Razorpay({
        key: options.key,
        amount: options.amount,
        currency: options.currency,
        name: options.name,
        description: options.description,
        image: options.image,
        order_id: options.order_id,
        prefill: options.prefill,
        theme: options.theme,
        handler: (response: any) => {
          // Payment successful
          onSuccess({
            success: true,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => {
            // Payment cancelled
            onFailure({
              success: false,
              error: 'Payment cancelled by user',
            });
          },
          escape: options.modal?.escape ?? true,
          backdropclose: options.modal?.backdropclose ?? true,
        },
      });

      razorpay.open();
    } catch (error) {
      console.error('Razorpay modal error:', error);
      onFailure({
        success: false,
        error: 'Failed to open payment modal',
      });
    }
  }

  // 🚀 STEP 4: Complete Payment Flow (Order + Modal + Verification)
  static async completePayment(
    amount: number,
    description: string,
    userEmail?: string,
    notes?: any
  ): Promise<PaymentResult> {
    // 🔒 DEMO MODE: Bypass Razorpay modal, use simulated delay
    if (DEMO_MODE) {
      try {
        // Simulate payment processing delay (1-2 seconds)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Return success to allow makePayment() to handle transaction recording
        return {
          success: true,
          paymentId: `demo_payment_${Date.now()}`,
          orderId: `demo_order_${Date.now()}`,
          signature: `demo_signature_${Date.now()}`,
        };
      } catch (error) {
        console.error('Demo payment error:', error);
        return {
          success: false,
          error: 'Demo payment failed',
        };
      }
    }

    // Live mode: Use actual Razorpay flow
    return new Promise((resolve) => {
      // Step 1: Create order
      this.createOrder(amount, description, userEmail, notes).then((orderResult) => {
        if (!orderResult.success || !orderResult.order) {
          resolve({
            success: false,
            error: orderResult.error || 'Failed to create payment order',
          });
          return;
        }

        // Step 2: Open payment modal
        const options: PaymentOptions = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID!,
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          name: 'Smart Finance Hub',
          description: description,
          order_id: orderResult.order.id,
          prefill: {
            email: userEmail,
          },
          theme: {
            color: '#3385ff',
          },
        };

        this.openPaymentModal(
          options,
          // Success callback
          async (paymentResult) => {
            // Step 3: Verify payment signature
            const verificationResult = await this.verifyPayment(
              orderResult.order!.id,
              paymentResult.paymentId!,
              paymentResult.signature!
            );

            if (verificationResult.success && verificationResult.verified) {
              resolve({
                success: true,
                paymentId: paymentResult.paymentId,
                orderId: paymentResult.orderId,
                signature: paymentResult.signature,
              });
            } else {
              resolve({
                success: false,
                error: 'Payment verification failed',
              });
            }
          },
          // Failure callback
          (errorResult) => {
            resolve(errorResult);
          }
        );
      });
    });
  }

  // 🚀 STEP 5: Health Check
  static async healthCheck(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.API_URL}/api/health`);
      const data = await response.json();
      return {
        success: data.success,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Backend server not reachable',
      };
    }
  }
}
