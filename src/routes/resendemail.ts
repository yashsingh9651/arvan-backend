import { Router } from 'express';
import sendEmailController from '../controllers/resendEmail.controller.js';

const router = Router();
router.post('/contactform', sendEmailController.sendEmail);

export default router;
