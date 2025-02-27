import { z } from "zod";
import { AssetType, VariantsValues } from "@prisma/client";

export const addProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be a positive number"),
  category_id: z.string().uuid("Invalid category ID"),
  material: z.string().min(1, "Material is required"),
  assets: z
    .array(
      z.object({
        url: z.string().url("Invalid asset URL"),
        type: z.nativeEnum(AssetType, { errorMap: () => ({ message: "Invalid asset type" }) }),
      })
    )
    .optional(),
});

export const addColorSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  color: z.string().min(1, "Color is required"),
  assets: z
    .array(
      z.object({
        url: z.string().url("Invalid asset URL"),
        type: z.nativeEnum(AssetType, { errorMap: () => ({ message: "Invalid asset type" }) }),
      })
    )
    .optional(),
});

export const addSizesSchema = z.object({
  colorId: z.string().uuid("Invalid color ID"),
  sizes: z.array(
    z.object({
      size: z.nativeEnum(VariantsValues, { errorMap: () => ({ message: "Invalid size value" }) }),
      stock: z.number().int().min(0, "Stock must be a non-negative integer"),
    })
  ),
});

export const updateStockSchema = z.object({
  variantId: z.string().uuid("Invalid variant ID"),
  stock: z.number().int().min(0, "Stock must be a non-negative integer"),
});
