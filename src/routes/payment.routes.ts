import { Router } from 'express';
import { createOrder, verifyPayment, createPayment } from '../controllers/payment.controller.js';

const router = Router();

router.post('/order', createOrder);
router.post('/verify', verifyPayment);
router.post('/payment', createPayment);

export default router;
