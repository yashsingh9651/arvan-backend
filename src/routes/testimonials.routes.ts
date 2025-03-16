import { Router } from "express";

import testimonialsController from "../controllers/testimonials.controller.js";

const router = Router();

router.post("/", testimonialsController.createTestimonial);
router.get("/", testimonialsController.getTestimonials);

export default router;