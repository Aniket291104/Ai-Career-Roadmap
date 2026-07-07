import { api } from './api';

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export interface RazorpayCheckoutOptions {
  tier: 'pro' | 'premium';
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure?: (error: any) => void;
}

export const triggerRazorpayCheckout = async (options: RazorpayCheckoutOptions): Promise<void> => {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
  }

  // 1. Create order
  const orderRes = await api.post('/payments/razorpay/create-order', { tier: options.tier });
  const orderData = orderRes.data;

  // 2. Open checkout modal
  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!razorpayKey) {
    throw new Error('Razorpay public key not configured.');
  }

  const paymentOptions = {
    key: razorpayKey,
    amount: orderData.amount,
    currency: orderData.currency,
    name: 'Roadmap AI',
    description: `Upgrade to ${options.tier === 'pro' ? 'Premium Pro' : 'Premium Elite'} Membership`,
    order_id: orderData.id,
    handler: async (response: any) => {
      // 3. Verify on backend
      try {
        const verifyRes = await api.post('/payments/razorpay/verify', {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          tier: options.tier,
        });
        if (verifyRes.data.success) {
          options.onSuccess(response);
        } else {
          if (options.onFailure) options.onFailure(new Error('Verification failed'));
        }
      } catch (err: any) {
        if (options.onFailure) options.onFailure(err);
      }
    },
    prefill: {
      name: '',
      email: '',
      contact: '',
    },
    theme: {
      color: '#a855f7', // Purple-500 matching the current styling
    },
  };

  const rzp = new (window as any).Razorpay(paymentOptions);
  rzp.on('payment.failed', function (response: any) {
    if (options.onFailure) options.onFailure(response.error);
  });
  rzp.open();
};
