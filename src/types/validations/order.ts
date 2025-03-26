import { z } from "zod";
import { OrderFulfillment, OrderStatus } from "@prisma/client";


export const OrderItemSchema = z.object({
  productVariantId: z.string().cuid(), // Only the productVariantId is required in input
  quantity: z.number().int().min(1), // Quantity must be at least 1
  priceAtOrder: z.number().min(0), // Store price at the time of order
});

export const createOrderSchema = z.object({
  addressId:z.string(), //
  paid : z.boolean().optional(),
  userId: z.string().cuid(), // Required user ID
  items: z.array(OrderItemSchema).min(1), // At least one item is required
  total: z.number().min(0), // Total price must be positive
});

export const updateOrderStatusSchema = z.object({
    status: z.nativeEnum(OrderStatus),
  });
  
  /** ✅ Schema for updating fulfillment status */
  export const updateFulfillmentSchema = z.object({
    fulfillment: z.nativeEnum(OrderFulfillment),
  });