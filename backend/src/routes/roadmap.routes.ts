import { Router } from 'express';
import { RoadmapController } from '../controllers/roadmap.controller';
import { authenticateJWT, requirePremiumSubscription } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT as any);

router.post('/generate', RoadmapController.generate as any);
router.get('/', RoadmapController.getUserRoadmaps as any);
router.get('/:id', RoadmapController.getRoadmapById as any);
router.put('/:id/task', RoadmapController.updateTaskStatus as any);
router.delete('/:id', RoadmapController.deleteRoadmap as any);
router.get('/:id/calendar', RoadmapController.exportCalendar as any);
router.post('/:id/adapt', requirePremiumSubscription, RoadmapController.adaptRoadmap as any);
router.post('/:id/project/submit', RoadmapController.submitProject as any);

export default router;
