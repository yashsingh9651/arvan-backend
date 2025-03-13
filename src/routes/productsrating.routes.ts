import { Router } from "express";
import testimonialsController from "../controllers/productrating.controller.js";

const router = Router();


// 📦 Create testimonial

router.post("/", testimonialsController.createTestimonial);

// 📦 Get all testimonial by product id
router.get("/:productId", testimonialsController.getTestimonialsByProductId);


export default router;

