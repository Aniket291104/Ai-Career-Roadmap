import { Router } from 'express';
import { CodingAssessmentController } from '../controllers/coding-assessment.controller';
import { authenticateJWT, requirePremiumSubscription } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT as any);

router.post('/generate', requirePremiumSubscription, CodingAssessmentController.generate as any);
router.post('/run', CodingAssessmentController.run as any);
router.post('/submit', CodingAssessmentController.submit as any);
router.post('/hint', CodingAssessmentController.unlockHint as any);
router.post('/interviewer', CodingAssessmentController.interviewerChat as any);
router.get('/analytics', CodingAssessmentController.getAnalytics as any);

export default router;
