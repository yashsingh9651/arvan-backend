import { Router } from 'express';
import customersController from '../controllers/customers.controller.js';
import { authenticateJWT } from '../middleware/globalerrorhandler.js';
const router = Router();


//fix routes
router.get("/allcustomers", customersController.allCustomers);

router.put("/customer/:id", authenticateJWT,customersController.updatecustomer);

router.delete("/customer/address/:id",authenticateJWT, customersController.deleteAddress);

router.put("/customer/address/:id", authenticateJWT,customersController.updateAddress);

router.post("/customer/address", authenticateJWT,customersController.addAddress);

router.get("/customer", authenticateJWT,customersController.getAddress);

router.post("/otp" ,customersController.getOtpByNumber);

router.post(`/resend-otp` ,customersController.getOtpByJwt);
router.post("/verify-otp",customersController.verfy_otp);

router.post("/verify-otp",customersController.verfy_otp);

router.post("/makeAdmin", customersController.makeAdmin);
router.post("/reset-password",customersController.forgotPassword);

export default router;