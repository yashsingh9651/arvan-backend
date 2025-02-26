import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import HttpStatusCodes from "../common/httpstatuscode.js";
import { RouteError, ValidationErr } from "../common/routeerror.js";
import {
  addProductSchema,
  updateStockSchema,
  addColorSchema,
  addSizesSchema,
} from "../types/validations/product.js";

const prisma = new PrismaClient();

/** ✅ Add a new product */
 const addProduct = async (req: Request, res: Response, next: NextFunction) => {
  const parsed = addProductSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }
  const { name, description, price, category_id, images } = parsed.data;

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price,
      category_id,
      images: { create: images?.map((img: string) => ({ imageUrl: img })) || [] },
    },
    include: { images: true },
  });

  res.status(HttpStatusCodes.CREATED).json({ success: true, product });
};

/** ✅ Add a color to an existing product */
 const addColor = async (req: Request, res: Response, next: NextFunction) => {
  const parsed = addColorSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }
  const { productId, color, images } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Product not found");
  }

  const productColor = await prisma.productColor.create({
    data: {
      color,
      productId,
      images: { create: images?.map((img: string) => ({ imageUrl: img })) || [] },
    },
    include: { images: true },
  });

  res.status(HttpStatusCodes.CREATED).json({ success: true, productColor });
};

/** ✅ Add sizes & stock to a color */
 const addSizes = async (req: Request, res: Response, next: NextFunction) => {
  const parsed = addSizesSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }
  const { colorId, sizes } = parsed.data;

  const color = await prisma.productColor.findUnique({ where: { id: colorId } });
  if (!color) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Color not found");
  }

  const variants = await prisma.productVariant.createMany({
    data: sizes.map((sizeObj) => ({
      size: sizeObj.size,
      stock: sizeObj.stock,
      colorId,
    })),
  });

  res.status(HttpStatusCodes.CREATED).json({ success: true, variants });
};

/** ✅ Update stock for a specific size */
 const updateStock = async (req: Request, res: Response, next: NextFunction) => {
  const parsed = updateStockSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }
  const { variantId, stock } = parsed.data;

  const updatedVariant = await prisma.productVariant.update({
    where: { id: variantId },
    data: { stock },
  });

  res.status(HttpStatusCodes.OK).json({ success: true, updatedVariant });
};

/** ✅ Delete a product */
 const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing product id");
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Product not found");
  }

  await prisma.product.delete({ where: { id } });
  res.status(HttpStatusCodes.OK).json({ success: true, message: "Product deleted" });
};

/** ✅ Delete a product color */
 const deleteColor = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing color id");
  }

  const color = await prisma.productColor.findUnique({ where: { id } });
  if (!color) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Color not found");
  }

  await prisma.productColor.delete({ where: { id } });
  res.status(HttpStatusCodes.OK).json({ success: true, message: "Product color deleted" });
};

/** ✅ Delete a product variant (size) */
 const deleteVariant = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing variant id");
  }

  const variant = await prisma.productVariant.findUnique({ where: { id } });
  if (!variant) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Variant not found");
  }

  await prisma.productVariant.delete({ where: { id } });
  res.status(HttpStatusCodes.OK).json({ success: true, message: "Product variant deleted" });
};

/** ✅ Delete an image */
 const deleteImage = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing image id");
  }

  const image = await prisma.productImage.findUnique({ where: { id } });
  if (!image) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Image not found");
  }

  await prisma.productImage.delete({ where: { id } });
  res.status(HttpStatusCodes.OK).json({ success: true, message: "Image deleted" });
};

/** ✅ Update product details */
 const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing product id");
  }

  const parsed = addProductSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Product not found");
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
    },
  });

  res.status(HttpStatusCodes.OK).json({ success: true, updatedProduct });
};

const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing product id");
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      colors: {
        include: {
          images: true,
          sizes: true, // includes product variants
        },
      },
    },
  });
  if (!product) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Product not found");
  }
  res.status(HttpStatusCodes.OK).json({ success: true, product });
  
};

const getAllProduct = async (req: Request, res: Response, next: NextFunction) => {
  const products = await prisma.product.findMany({
    include: {
      images: true,
    
      },
    })

    res.status(HttpStatusCodes.OK).json({ success: true, products });
  }

/**
 * Default  of all functions for cleaner imports
 */
 export default {
  addProduct,
  addColor,
  addSizes,
  updateStock,
  deleteProduct,
  deleteColor,
  deleteVariant,
  deleteImage,
  updateProduct,
  getProduct,
  getAllProduct
} as const;
