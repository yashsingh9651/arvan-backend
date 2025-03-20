import { AssetType, VariantsValues } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import HttpStatusCodes from "../common/httpstatuscode.js";
import { RouteError, ValidationErr } from "../common/routeerror.js";
import {
  addProductSchema,
  updateStockSchema,
  addColorSchema,
  addSizesSchema,
} from "../types/validations/product.js";

import { prisma } from "../utils/prismaclient.js";


/** ✅ Add a new product */


const addProduct = async (req: Request, res: Response, next: NextFunction) => {
  // if(!req.user && req?.user?.role !== "ADMIN"){
  //   throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  // }
  const parsed = addProductSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }
  const { name, description, price,discountPrice, category_id, assets, material, status } =
    parsed.data;

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price,
      discountPrice: discountPrice || null,
      category_id,
      material,
      status,
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
  // if(!req.user && req?.user?.role !== "ADMIN"){
  //   throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  // }
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
  if(!req.user && req?.user?.role !== "ADMIN"){
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  }
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

/** ✅ Update a color */
const updateColor = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const parsed = addColorSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }
  const { color, assets, sizes } = parsed.data;

  // First, delete all existing assets and sizes for this color
  await prisma.$transaction([
    prisma.productAsset.deleteMany({
      where: { colorId: id }
    }),
    prisma.productVariant.deleteMany({
      where: { colorId: id }
    })
  ]);

  // Then update the color with new assets and sizes
  const productColor = await prisma.productColor.update({
    where: { id },
    data: {
      color,
      assets: {
        create:
          assets?.map((asset: { url: string; type: AssetType }) => ({
            asset_url: asset.url,
            type: asset.type,
          })) || [],
      },
      sizes: {
        create:
          sizes?.map((asset: { size: VariantsValues; stock: number }) => ({
            size: asset.size,
            stock: asset.stock,
          })) || [],
      }
    },
    include: { assets: true, sizes: true },
  });

  res.status(HttpStatusCodes.OK).json({ success: true, productColor });
};

/** ✅ Update stock for a specific size */
const updateStock = async (req: Request, res: Response, next: NextFunction) => {
  if(!req.user && req?.user?.role !== "ADMIN"){
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  }
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
  if(!req.user && req?.user?.role !== "ADMIN"){
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  }
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
  // if(!req.user && req?.user?.role !== "ADMIN"){
  //   throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  // }
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
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || '';
  
  const skip = (page - 1) * limit;
  
  // Get total count for pagination
  const totalCount = await prisma.product.count({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
  });
  
  const totalPages = Math.ceil(totalCount / limit);
  
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    },
    include: {
      assets: true,
    },
    skip,
    take: limit,
  });
  
  res.status(HttpStatusCodes.OK).json({ 
    success: true, 
    products,
    pagination: {
      totalPages,
      currentPage: page,
      totalItems: totalCount,
      itemsPerPage: limit
    }
  });
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

  const { name, description, price, discountPrice, category_id, material, assets, status } = parsed.data;

  // First, delete existing assets if new ones are provided
  if (assets && assets.length > 0) {
    await prisma.productAsset.deleteMany({
      where: { 
        productId: id,
        colorId: null 
      }
    });
  }

  // Update the product with all fields
  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      name,
      description,
      price,
      discountPrice,
      category_id,
      material,
      status,
      assets: assets ? {
        create: assets.map((asset: { url: string; type: AssetType }) => ({
          asset_url: asset.url,
          type: asset.type,
        }))
      } : undefined
    },
    include: {
      assets: true
    }
  });

  res.status(HttpStatusCodes.OK).json({ success: true, updatedProduct });
};

const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  // if(!req.user && req?.user?.role !== "ADMIN"){
  //   throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  // }
  const { id } = req.params; 
  const { status } = req.body;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing product id");
  }
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Product not found");
  }
  await prisma.product.update({
    where: { id },
    data: { status },
  });
  res.status(HttpStatusCodes.OK).json({ success: true, message: "Product status updated" });
};


const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  // if(!req.user && req?.user?.role !== "ADMIN"){
  //   throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  // }
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
  if(!req.user && req?.user?.role !== "ADMIN"){
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  }
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
  if(!req.user && req?.user?.role !== "ADMIN"){
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  }
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
  updateColor,
  deleteAsset,
  getProduct,
  getAllProduct,
  updateProduct,
  updateStatus,
  deleteProduct,
  deleteColor,
  deleteVariant
};
