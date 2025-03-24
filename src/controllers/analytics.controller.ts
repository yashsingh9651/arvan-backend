import { Request, Response, NextFunction } from "express";
import HttpStatusCodes from "../common/httpstatuscode.js";
import { prisma } from "../utils/prismaclient.js";

const getTopProducts = async (req: Request, res: Response, next: NextFunction) => {
    const limit = parseInt(req.query.limit as string) || 5;

    const topProducts = await prisma.orderItem.groupBy({
      by: ["productVariantId"],
      _sum: {
        quantity: true,
        priceAtOrder: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: limit,
    });

    const products = await Promise.all(
      topProducts.map(async (item) => {
        const productVariant = await prisma.productVariant.findUnique({
          where: { id: item.productVariantId },
          include: {
            color: {
              include: {
                product: true,
              },
            },
          },
        });

        const products =  {
          name: productVariant?.color.product.name || "Unknown Product",
          sales: item._sum.quantity || 0,
          revenue: item._sum.priceAtOrder || 0,
        };
        return products;
      })
    );

    res.status(HttpStatusCodes.OK).json({ success: true, products });
};

export const AnalyticsController = {
  getTopProducts,
};
