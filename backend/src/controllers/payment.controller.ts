import { Response } from 'express';
import { User } from '../models/User';
import { stripe } from '../config/stripe';
import { IAuthRequest } from '../middlewares/auth.middleware';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'mock_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret',
});

export class PaymentController {
  
  static async createCheckoutSession(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { tier } = req.body; // 'pro' | 'premium'
      if (!['pro', 'premium'].includes(tier)) {
        res.status(400).json({ message: 'Invalid subscription tier selected' });
        return;
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');

      // If Stripe keys are mock, return a simulation link
      if (process.env.STRIPE_SECRET_KEY === undefined || process.env.STRIPE_SECRET_KEY === 'mock_stripe_key') {
        // Mock simulation success callback directly
        user.subscriptionTier = tier;
        await user.save();
        res.status(200).json({ 
          url: `${clientUrl}/dashboard?payment=simulated&tier=${tier}`,
          message: 'Stripe Mock Billing Activated (Simulation Sandbox mode)' 
        });
        return;
      }

      // Real Stripe Checkout Session
      const priceId = tier === 'pro' 
        ? process.env.STRIPE_PRO_PRICE_ID || 'price_mock_pro' 
        : process.env.STRIPE_PREMIUM_PRICE_ID || 'price_mock_premium';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${clientUrl}/dashboard?success=true`,
        cancel_url: `${clientUrl}/pricing?canceled=true`,
        metadata: {
          userId: user._id.toString(),
          tier,
        },
      });

      res.status(200).json({ url: session.url });
    } catch (error) {
      console.error('Stripe Checkout Error:', error);
      res.status(500).json({ message: 'Failed to initialize payment gateway' });
    }
  }

  static async handleWebhook(req: any, res: Response): Promise<void> {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'mock_stripe_key' && sig) {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET || ''
        );
      } else {
        // Direct simulation parser
        event = req.body;
      }

      if (!event) {
        res.status(400).send('Webhook Error: empty event');
        return;
      }

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const userId = session.metadata?.userId;
          const tier = session.metadata?.tier;

          if (userId && tier) {
            await User.findByIdAndUpdate(userId, {
              subscriptionTier: tier,
              stripeCustomerId: session.customer?.toString(),
              stripeSubscriptionId: session.subscription?.toString(),
            });
            console.log(`User subscription updated. User: ${userId}, Tier: ${tier}`);
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const user = await User.findOne({ stripeSubscriptionId: subscription.id });
          if (user) {
            user.subscriptionTier = 'free';
            user.stripeSubscriptionId = undefined;
            await user.save();
            console.log(`User subscription canceled: ${user._id}`);
          }
          break;
        }
        default:
          console.log(`Unhandled stripe webhook event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error('Webhook signature validation failed:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  static async createRazorpayOrder(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { tier } = req.body;
      if (!['pro', 'premium'].includes(tier)) {
        res.status(400).json({ message: 'Invalid subscription tier selected' });
        return;
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const amount = tier === 'pro' ? 9000 : 400000; // in paise (90 INR / 4000 INR)
      
      const options = {
        amount,
        currency: 'INR',
        receipt: `rcpt_${user._id.toString().slice(-8)}_${Date.now()}`,
        notes: {
          userId: user._id.toString(),
          tier,
        }
      };

      const order = await razorpay.orders.create(options);
      
      res.status(200).json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        tier
      });
    } catch (error) {
      console.error('Razorpay Order Creation Error:', error);
      res.status(500).json({ message: 'Failed to create Razorpay order' });
    }
  }

  static async verifyRazorpayPayment(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tier } = req.body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !tier) {
        res.status(400).json({ message: 'Missing required validation fields' });
        return;
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
      
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        res.status(400).json({ message: 'Payment signature mismatch. Transaction not authentic.' });
        return;
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      user.subscriptionTier = tier;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Payment verified and subscription activated!',
        user
      });
    } catch (error) {
      console.error('Razorpay Verification Error:', error);
      res.status(500).json({ message: 'Failed to verify signature' });
    }
  }
}
