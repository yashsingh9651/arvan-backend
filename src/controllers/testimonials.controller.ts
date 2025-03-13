import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prismaclient.js";
import HttpStatusCodes from "../common/httpstatuscode.js";

interface TestimonialInput {
    username: string;
    role: string;
    description: string;
    image: string;
    ratings: number;
  }

  const createTestimonial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, role, description, image, ratings }: TestimonialInput = req.body;
  
      // Validate required fields
      if (!username || !role || !description || !image || ratings === undefined) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Missing required fields" });
        return;
      }
  
      // Ensure rating is a valid number (1-5)
      if (typeof ratings !== "number" || ratings < 1 || ratings > 5) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Rating must be a number between 1 and 5" });
        return;
      }
  
      // Create testimonial
      const testimonial = await prisma.testimonial.create({
        data: {
          username,
          role,
          description,
          ratings,
          image,
        },
      });
  
      res.status(HttpStatusCodes.CREATED).json({
        message: "Testimonial created successfully",
        testimonial,
      });
    } catch (error) {
      console.error("Error creating testimonial:", error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const getTestimonials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const testimonials = await prisma.testimonial.findMany();
  
      res.status(HttpStatusCodes.OK).json({
        testimonials,
      });
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  
  export default {
    createTestimonial,
    getTestimonials
  };