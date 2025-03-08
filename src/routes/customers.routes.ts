import { Router } from 'express';
import customersController from '../controllers/customers.controller.js';
const router = Router();

router.get("/allcustomers", customersController.allCustomers);

export default router;