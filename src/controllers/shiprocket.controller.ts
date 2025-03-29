import { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prismaclient.js";
import { RouteError } from "../common/routeerror.js";
import HttpStatusCodes from "../common/httpstatuscode.js";
import { ShipRocketOrderSchema } from "../types/validations/shipRocket.js";

const getShiprocketToken = async () => {
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    try {
        const response = await fetch(
            "https://apiv2.shiprocket.in/v1/external/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            }
        );

        const data = await response.json();
        return data.token;
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

    const passedData = ShipRocketOrderSchema.safeParse(orderData);
    if (!passedData.success) {
        throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Invalid data");
    }

    const response = await fetch(
        "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
        {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${shipToken}`,
            },
            body: JSON.stringify(orderData),
        }
    );

    const data = await response.json();

    res.status(HttpStatusCodes.CREATED).json({ success: true, data });
};

export default {
    createShiprocketOrder,
};