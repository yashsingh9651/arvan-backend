import { Router } from 'express';
import categoryController from "../controllers/category.controller.js";
import { authenticateJWT,isAdmin } from '../middleware/globalerrorhandler.js';

const router = Router();

router.get("/",authenticateJWT,isAdmin,categoryController.getAllCategories);

router.post("/", authenticateJWT,categoryController.addCategory);

router.get("/:id", categoryController.getCategory);

router.put("/:id", categoryController.updateCategory);

router.delete("/:id", categoryController.deleteCategory);

export default router;