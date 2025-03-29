import { Router } from "express";
import shipRocketController from "../controllers/shiprocket.controller.js";

const router = Router();

router.post("/", shipRocketController.createShiprocketOrder);

export default router;