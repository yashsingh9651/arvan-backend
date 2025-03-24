import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prismaclient.js";
import { RouteError, ValidationErr } from "../common/routeerror.js";
import HttpStatusCodes from "../common/httpstatuscode.js";
import {
  addAddressSchema,
  getOtpSchema,
  updatecustomerSchema,
} from "../types/validations/customer.js";

import {
  orderOutforDelivery,
  orderProcessed,
  orderShipped,
  sendOtp,
} from "../utils/whatsappclient.js";
import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import ENV from "./../common/env.js";
import { forgetpasswordSchema } from "../types/validations/customer.js";
import bcryptjs from "bcryptjs";

const allCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Authorization check (commented out)
    // if (!req.user || req.user.role !== "ADMIN") {
    //   return res.status(403).json({ success: false, message: "Forbidden" });
    // }

    const customers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        mobile_no: true,

        Order: {
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        }

      }})
  
      const formattedCustomers = customers.map((customer: { Order: any[]; id: any; name: any; mobile_no: any; }) => {
        const totalOrders = customer.Order.length;
        const totalSpent = customer.Order.reduce((sum, order) => sum + order.total, 0);
        const lastOrder = customer.Order[0]?.createdAt || null;
  
        return {
          id: customer.id,
          name: customer.name || "N/A",
         mobile_no: customer.mobile_no,
          totalOrders,
          totalSpent,
          lastOrder,
        };
      });
  
      res.json({ success: true, data: formattedCustomers });
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch customers");
    }
  };
 const updatecustomer = async(req:Request, res:Response, next:NextFunction) => {
  const { id } = req.user;

  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing customer id");
  }

  const partialCustomer = updatecustomerSchema.partial();
  const customer = partialCustomer.safeParse(req.body);

  if (!customer.success) {
    throw new ValidationErr(customer.error.errors);
  }

  if (customer.data.password) {
    const salt = await bcryptjs.genSalt(10);
    customer.data.password = await bcryptjs.hash(customer.data.password, salt);
  }

  const updatedCustomer = await prisma.user.update({
    where: { id },
    data: customer.data,
  });

  res.status(HttpStatusCodes.OK).json({ success: true, updatedCustomer });
};

const addAddress = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.user;

  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing customer id");
  }

  // const { address } = req.body;
  const parsedData = addAddressSchema.safeParse(req.body);

  if (!parsedData.success) {
    throw new ValidationErr(parsedData.error.errors);
  }

  const addressCreate = await prisma.address.create({
    data: {
      userId: id,
      ...parsedData.data,
    },
  });

  res.status(HttpStatusCodes.OK).json({ success: true, addressCreate });
};

const deleteAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.user;

  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing customer id");
  }

  const { addressId } = req.params;

  if (!addressId) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing address id");
  }

  await prisma.address.delete({
    where: {
      id: addressId,
      userId: id,
    },
  });

  res
    .status(HttpStatusCodes.OK)
    .json({ success: true, message: "Address deleted" });
};

const updateAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.user;

  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing customer id");
  }

  const { addressId } = req.params;

  if (!addressId) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing address id");
  }
  // const { address } = req.body;
  const parsedData = addAddressSchema.safeParse(req.body);

  if (!parsedData.success) {
    throw new ValidationErr(parsedData.error.errors);
  }

  const addressUpdate = await prisma.address.update({
    where: {
      id: addressId,
      userId: id,
    },
    data: {
      ...parsedData.data,
    },
  });

  res.status(HttpStatusCodes.OK).json({ success: true, addressUpdate });
};

const getAddress = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.user;

  if (!id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing customer id");
  }

  const address = await prisma.address.findMany({
    where: {
      userId: id,
    },
  });

  res.status(HttpStatusCodes.OK).json({ success: true, address });
};
const generateSecureOTP = (): string => {
  return crypto.randomInt(1000000, 9999999).toString(); // Always 7 characters
};
  const getOtpByNumber = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { mobile_no } = req.query;

    if (!mobile_no || typeof mobile_no !== 'string') {
      throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing mobile number");
    }

    const findOtp = await prisma.otp.findUnique({
      where: {
        userphone: mobile_no,
      },
    });

    if (findOtp) {
      const timeDiff = new Date().getTime() - new Date(findOtp.createdAt).getTime();
      const minutesPassed = Math.floor(timeDiff / (1000 * 60));
    
      if (minutesPassed < 15) {
        // throw new RouteError(HttpStatusCodes.BAD_REQUEST, `Please wait ${15 - minutesPassed} minutes before requesting a new OTP`);
        res.status(HttpStatusCodes.ACCEPTED).json({
          success: false,
          message: `Please wait ${15 - minutesPassed} minutes before requesting a new OTP`,
        });
        return;
      }

      await prisma.otp.delete({
        where: {
          userphone: mobile_no,
        },
      });
    }
    console.log("getOtp");
    const getOtp = generateSecureOTP();

    await sendOtp(getOtp, mobile_no);
    await prisma.otp.create({
      data: {
        userphone: mobile_no,
        otp: getOtp,
        createdAt: new Date(),
      },
    });

    res
      .status(HttpStatusCodes.OK)
      .json({ success: true, message: "OTP sent successfully" });
  }
function generateToken(payload: object): string {
  const options: SignOptions = {
    expiresIn: "1h", // Ensure this aligns with the expected type
    // other options
  };

  return jwt.sign(payload, ENV.AUTH_SECRET, options);
}
function verifyToken(token: string) {
  try {
    // Verify the token using the secret key
    return jwt.verify(token, ENV.AUTH_SECRET);
  } catch (err: any) {
    console.error("Token verification failed:", err.message);
    return null;
  }
}

const verify_otp = async (req: Request, res: Response, next: NextFunction) => {
  const parseddata = getOtpSchema.safeParse(req.body);

  if (!parseddata.success) {
    throw new ValidationErr(parseddata.error.errors);
  }

  const { mobileNumber, otp, type } = parseddata.data;
  const findOtp = await prisma.otp.findUnique({
    where: {
      userphone: mobileNumber,
    },
  });
  if (!findOtp || findOtp.otp !== otp) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Invalid OTP");
  }

  if (type === "verify") {
    await prisma.user.update({
      where: {
        mobile_no: mobileNumber,
      },
      data: {
        isPhoneNoVerified: true,
      },
    });

    await prisma.otp.delete({
      where: {
        userphone: mobileNumber,
      },
    });
    res
      .status(HttpStatusCodes.OK)
      .json({ success: true, message: "mobile verified successfully" });
  } else {
    const token = generateToken({ mobileNumber });
    await prisma.otp.update({
      where: {
        userphone: mobileNumber,
      },
      data: {
        jwt: token,
      },
    });
    res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "OTP verified successfully",
      token: token,
    });
  }
};

const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { mobile_no, id } = req.user;
  const { password, token } = req.body;
  const parsedData = forgetpasswordSchema.safeParse(req.body);

  if (!parsedData.success) {
    throw new ValidationErr(parsedData.error.errors);
  }
  const tokendata: any = verifyToken(token);

  if (!tokendata) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Invalid token");
  }
  if (tokendata.mobile_no !== mobile_no || tokendata.id !== id) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Invalid token");
  }

  const otp = await prisma.otp.findUnique({
    where: {
      userphone: tokendata.mobile_no,
    },
  });

  if (!otp) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Invalid token");
  }
  if (otp.jwt !== token) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Invalid token");
  }
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password, salt);

  await prisma.user.update({
    where: {
      mobile_no: tokendata.mobile_no,
    },
    data: {
      password: hashedPassword,
    },
  })
  await prisma.otp.delete({
    where: {
      userphone: tokendata.mobile_no,
    },
  });
  res.status(HttpStatusCodes.OK).json({ success: true, message: "Password updated successfully" });
};

const makeAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const { mobile_no } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      mobile_no: mobile_no,
    },
  });

  if (!user) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "User not found");
  }

  if ( user.role === "ADMIN") {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "User is already an admin");
  }

  await prisma.user.update({
    where: {
      mobile_no: mobile_no,
    },
    data: {
      role: "ADMIN",
    },
  });
  res.status(HttpStatusCodes.OK).json({ success: true, message: "User is now an admin" });
};

export default {
  allCustomers,
  updatecustomer,
  addAddress,
  deleteAddress,
  updateAddress,
  getAddress,
  getOtpByNumber,
  verify_otp,
  makeAdmin
};
