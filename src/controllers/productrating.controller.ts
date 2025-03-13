import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prismaclient.js";
import HttpStatusCodes from "../common/httpstatuscode.js";

const createTestimonial = async (req: Request, res: Response, next: NextFunction): Promise<void>  => {
    try {
        // Validate user object
        // if (!req.user) {
        //     res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: "Unauthorized user" });
        //     return;
        // }

        const { title, description, rating, productId } = req.body;

        // Validate required fields
        if (!title || !description || !rating || !productId) {
            res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Missing required fields" });
            return 
        }

        // Ensure rating is a valid number (1-5)
        if (typeof rating !== "number" || rating < 1 || rating > 5) {
             res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Rating must be a number between 1 and 5" });
             return;
        }

        // Ensure product exists before creating the testimonial
        const productExists = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!productExists) {
             res.status(HttpStatusCodes.NOT_FOUND).json({ message: "Product not found" });
             return
        }

        // Create testimonial
        const productrating = await prisma.productRating.create({
            data: {
                title,
                description,
                rating,
                productId,
                userId: req.user.id  // Associate testimonial with the user
            }
        });

         res.status(HttpStatusCodes.CREATED).json({
            message: "Testimonial created successfully",
            productrating
        });



    } catch (error) {
        console.error("Error creating testimonial:", error);
         res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error"
        });

    }
};


const getTestimonialsByProductId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { productId } = req.query; // URL se productId le rahe hain

        const testimonials = await prisma.productRating.findMany({
            where: productId ? { productId: String(productId) } : undefined, // Filter lagaya
            orderBy: {
                createdAt: "desc"
            }
        });

         res.status(HttpStatusCodes.OK).json({
            testimonials
        });


    } catch (error) {
        console.error("Error getting testimonials:", error);
         res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export default {
    createTestimonial,
    getTestimonialsByProductId
};
