import { AssetType, PrismaClient, VariantsValues } from "@prisma/client";
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
  const { name, description, price, category_id, assets, material } =
    parsed.data;

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price,
      category_id,
      material,
      assets: {
        create:
          assets?.map((asset: { url: string; type: AssetType }) => ({
            asset_url: asset.url,
            type: asset.type,
          })) || [],
      },
    
    },
    include: { assets: true },
  });

  res.status(HttpStatusCodes.CREATED).json({ success: true, product });
};

/** ✅ Add a color to an existing product */
const addColor = async (req: Request, res: Response, next: NextFunction) => {
  const parsed = addColorSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }
  const { productId, color, assets,sizes } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Product not found");
  }

  const productColor = await prisma.productColor.create({
    data: {
      color,
      productId,
      assets: {
        create:
          assets?.map((asset: { url: string; type: AssetType }) => ({
            asset_url: asset.url,
            type: asset.type,
          })) || [],
      },
      sizes:{
        create:
        sizes?.map((asset: { size: VariantsValues; stock: number }) => ({
          size: asset.size,
          stock: asset.stock,
        })) || [],
      }
    },
    include: { assets: true },
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

  const color = await prisma.productColor.findUnique({
    where: { id: colorId },
  });
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

/** ✅ Delete an asset */
const deleteAsset = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing asset id");
  }

  const asset = await prisma.productAsset.findUnique({ where: { id } });
  if (!asset) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Asset not found");
  }

  await prisma.productAsset.delete({ where: { id } });
  res
    .status(HttpStatusCodes.OK)
    .json({ success: true, message: "Asset deleted" });
};

/** ✅ Get a product with colors and variants */
const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing product id");
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      assets: true,
      colors: {
        include: {
          assets: true,
          sizes: true,
        },
      },
    },
  });

  if (!product) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Product not found");
  }
  res.status(HttpStatusCodes.OK).json({ success: true, product });
};

/** ✅ Get all products */
const getAllProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const products = await prisma.product.findMany({
    include: {
      assets: true,
    },
  });
  res.status(HttpStatusCodes.OK).json({ success: true, products });
};

const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
      material: parsed.data.material,
    },
  });

  res.status(HttpStatusCodes.OK).json({ success: true, updatedProduct });
};


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

export default {
  addProduct,
  addColor,
  addSizes,
  updateStock,
  deleteAsset,
  getProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  deleteColor,
  deleteVariant
};
