import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';

const router = Router();

router.get('/top-products', AnalyticsController.getTopProducts);

export default router;