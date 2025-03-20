import { Router } from 'express';
import customersController from '../controllers/customers.controller.js';
const router = Router();

router.get("/allcustomers", customersController.allCustomers);

router.put("/customer/:id", customersController.updatecustomer);

router.delete("/customer/address/:id", customersController.deleteAddress);

router.put("/customer/address/:id", customersController.updateAddress);

router.post("/customer/address", customersController.addAddress);

router.get("/customer", customersController.getAddress);

export default router;