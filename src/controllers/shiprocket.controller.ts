import { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prismaclient.js";
import { RouteError } from "../common/routeerror.js";
import HttpStatusCodes from "../common/httpstatuscode.js";
import { ShipRocketOrderSchema } from "../types/validations/shipRocket.js";
import axios from "axios";

const getShiprocketToken = async () => {
    const token = await prisma.shiprocketToken.findFirst();

    if (token && token.createdAt.getTime() > Date.now() - 9 * 24 * 60 * 60 * 1000) {
        return token.token;
    }

    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    try {
        const response = await axios.post(
            "https://apiv2.shiprocket.in/v1/external/auth/login",
            { email, password },
            {
                headers: { "Content-Type": "application/json" },
            }
        );

        const token = response.data.token;
        if (token) {
            await prisma.$transaction([
                prisma.shiprocketToken.deleteMany(),
                prisma.shiprocketToken.create({ data: { token } }),
            ]);
        }
        return token;
    } catch (error) {
        console.error("Shiprocket Auth Error:", error);
        return null;
    }
};

const createShiprocketOrder = async (req: Request, res: Response, next: NextFunction) => {
    const shipToken = await getShiprocketToken();
    if (!shipToken) {
        throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Unauthorized");
    }

    const orderData = req.body;

    console.log(orderData);

    const passedData = ShipRocketOrderSchema.safeParse(orderData);
    if (!passedData.success) {
        throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Invalid data");
    }



    const response = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
        orderData,
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${shipToken}`,
            }
        }
    );

    res.status(HttpStatusCodes.CREATED).json({ success: true, data: response.data });
};

export default {
    createShiprocketOrder,
};