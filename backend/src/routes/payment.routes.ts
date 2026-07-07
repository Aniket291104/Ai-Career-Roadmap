import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.post('/checkout', authenticateJWT as any, PaymentController.createCheckoutSession as any);
router.post('/webhook', PaymentController.handleWebhook as any);

router.post('/razorpay/create-order', authenticateJWT as any, PaymentController.createRazorpayOrder as any);
router.post('/razorpay/verify', authenticateJWT as any, PaymentController.verifyRazorpayPayment as any);

export default router;
