import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js';

const router = Router();

router.post('/signin', AuthController.signin);
router.post('/signup', AuthController.signup);
router.post('/verify-otp', AuthController.verifyOTP);
// router.post('/reset-password', AuthController.resetPassword);
router.post('/send-otp', AuthController.sendOTP);

export default router;