declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
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
    backdropclose?: boolean;
    escape?: boolean;
    animation?: string;
  };
}

export class RazorpayPaymentService {
  private static instance: any = null;

  static initialize(keyId: string) {
    if (typeof window !== 'undefined' && (window as Window).Razorpay) {
      this.instance = new (window as Window).Razorpay({
        key_id: keyId,
        currency: 'INR',
      });
    }
  }

  static async createOrder(amount: number, description: string, userEmail?: string): Promise<{ orderId: string; error?: string }> {
    try {
      const response = await fetch('/api/create-payment-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_RAZORPAY_KEY_SECRET}`,
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            description,
            email: userEmail,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const data = await response.json();
      return {
        orderId: data.id,
      };
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      return {
        orderId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async openPaymentModal(options: RazorpayOptions): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    return new Promise((resolve) => {
      if (!this.instance) {
        resolve({
          success: false,
          error: 'Razorpay not initialized',
        });
        return;
      }

      const razorpayOptions = {
        ...options,
        handler: (response: any) => {
          // Payment successful
          resolve({
            success: true,
            paymentId: response.razorpay_payment_id,
          });
        },
        modal: {
          ondismiss: () => {
            // Payment modal closed without completion
            resolve({
              success: false,
              error: 'Payment cancelled by user',
            });
          },
        },
      };

      this.instance.open(razorpayOptions);
    });
  }

  static cleanup() {
    if (this.instance) {
      this.instance.clear();
    }
  }
}
