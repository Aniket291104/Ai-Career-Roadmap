import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/resend-otp', AuthController.resendOtp);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/google', AuthController.googleLogin);
router.get('/google-client-id', AuthController.getGoogleClientId);

// Protected profile routes
router.get('/me', authenticateJWT as any, AuthController.getCurrentUser as any);
router.put('/profile', authenticateJWT as any, AuthController.updateProfile as any);

export default router;
