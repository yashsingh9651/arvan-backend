import { z } from "zod";
import { VariantsValues } from "@prisma/client";

export const addProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  price: z.number(),
  category_id: z.string(),
  images: z.array(z.string().min(1, "Images is required"))
});

export const addColorSchema = z.object({
  productId: z.string(),
  color: z.string().min(1, "Color is required"),
  images: z.array(z.string().min(1, "Images is required")),
});

export const addSizesSchema = z.object({
  colorId: z.string(),
  sizes: z.array(
    z.object({
      size: z.nativeEnum(VariantsValues, { errorMap: () => ({ message: "Invalid size value" }) }),
      stock: z.number().int().nonnegative({ message: "Stock must be a non-negative integer" }),
    })
  ),
});

export const updateStockSchema = z.object({
  variantId: z.string(),
  stock: z.number().int().nonnegative({ message: "Stock must be a non-negative integer" }),
});
