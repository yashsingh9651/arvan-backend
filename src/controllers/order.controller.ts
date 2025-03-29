import { PrismaClient, OrderStatus, OrderFulfillment } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import HttpStatusCodes from "../common/httpstatuscode.js";
import { RouteError, ValidationErr } from "../common/routeerror.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  updateFulfillmentSchema,
} from "../types/validations/order.js";

import { prisma } from "../utils/prismaclient.js";

/** ✅ Create a new order */
const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }
    const { userId, items, total, addressId ,paid} = parsed.data;

    const order = await prisma.order.create({
      data: {
        userId,
        total,
        addressId,
        status: OrderStatus.PENDING,
        paid: paid,
        fulfillment: OrderFulfillment.PENDING,
        items: {
          create: items.map((item) => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            priceAtOrder: item.priceAtOrder,
          })),
        },
      },
      include: { items: true },
    });
  res.status(HttpStatusCodes.CREATED).json({ success: true, order });
};

/** ✅ Get all orders (Admin) */
const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  const limit = parseInt(req.query.limit as string) || 10;
  const page = parseInt(req.query.page as string) || 1;
  const skip = (page - 1) * limit;
  const search = req.query.search as string || "";

  // Build the where clause
  const whereClause: any = req.user.role === "ADMIN" ? {} : { userId: req.user.id };
  
  // Add search functionality if search term is provided
  if (search) {
    whereClause.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { userId: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Get orders with pagination
  const orders = await prisma.order.findMany({
    where: whereClause,
    include: { items: true },
    take: limit,
    skip: skip,
    orderBy: { createdAt: 'desc' } // Most recent orders first
  });

  // Get total count for pagination
  const totalItems = await prisma.order.count({
    where: whereClause
  });

  const totalPages = Math.ceil(totalItems / limit);

  res.status(HttpStatusCodes.OK).json({
    success: true,
    orders,
    pagination: {
      totalPages,
      currentPage: page,
      totalItems,
      itemsPerPage: limit
    }
  });
};




/** ✅ Get a single order by ID */
const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
    }
  
    const { id } = req.params;
    if (!id) {
      throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing order ID");
    }
  
    const order = await prisma.order.findUnique({
      where: req.user.role === "ADMIN" ? { id } : { id, userId: req.user.id }, // Admin can fetch any order, user can only fetch their own
      include: { items: true },
    });
  
    if (!order) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "Order not found");
    }
  
    res.status(HttpStatusCodes.OK).json({ success: true, order });
  };

/** ✅ Update order status */
const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "ADMIN") {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing order id");
  }

  const parsed = updateOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  res.status(HttpStatusCodes.OK).json({ success: true, updatedOrder });
};

/** ✅ Update fulfillment status */
const updateFulfillment = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "ADMIN") {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing order id");
  }

  const parsed = updateFulfillmentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationErr(parsed.error.errors);
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { fulfillment: parsed.data.fulfillment },
  });

  res.status(HttpStatusCodes.OK).json({ success: true, updatedOrder });
};

/** ✅ Delete an order */
const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "ADMIN") {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  const { id } = req.params;
  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing order id");
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Order not found");
  }

  await prisma.order.delete({ where: { id } });
  res.status(HttpStatusCodes.OK).json({ success: true, message: "Order deleted" });
};

export default {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateFulfillment,
  deleteOrder,
};
