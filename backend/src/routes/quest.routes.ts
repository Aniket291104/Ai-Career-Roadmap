import { Router } from 'express';
import { QuestController } from '../controllers/quest.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT as any);

router.get('/daily', QuestController.getDaily as any);
router.post('/claim', QuestController.claimQuestXP as any);

export default router;
