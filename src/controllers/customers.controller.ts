
import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prismaclient.js";

/** ✅ Get all customers */

const allCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Authorization check (commented out)
      // if (!req.user || req.user.role !== "ADMIN") {
      //   return res.status(403).json({ success: false, message: "Forbidden" });
      // }
  
      const customers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          Order: {
            select: {
              id: true,
              total: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });
  
      const formattedCustomers = customers.map((customer) => {
        const totalOrders = customer.Order.length;
        const totalSpent = customer.Order.reduce((sum, order) => sum + order.total, 0);
        const lastOrder = customer.Order[0]?.createdAt || null;
  
        return {
          id: customer.id,
          name: customer.name || "N/A",
          email: customer.email,
          totalOrders,
          totalSpent,
          lastOrder,
        };
      });
  
      res.json({ success: true, data: formattedCustomers });
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };

  export default {
    allCustomers,
  }