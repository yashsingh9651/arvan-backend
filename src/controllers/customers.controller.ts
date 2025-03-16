
import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prismaclient.js";
import { RouteError, ValidationErr } from "../common/routeerror.js";
import HttpStatusCodes from "../common/httpstatuscode.js";
import { addAddressSchema, updatecustomerSchema } from "../types/validations/customer.js";
import bcryptjs from "bcryptjs";
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
          mobile_no:true,
         
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
  
  if(customer.data.password){
    const salt = await bcryptjs.genSalt(10);
    customer.data.password = await bcryptjs.hash(customer.data.password, salt);
  }

  const updatedCustomer = await prisma.user.update({
    where: { id },
    data: customer.data,
  });

  res.status(HttpStatusCodes.OK).json({ success: true, updatedCustomer });
  }

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
      ...parsedData.data
    }
  })
  
    res.status(HttpStatusCodes.OK).json({ success: true, addressCreate });

  };

  const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
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
        userId: id
      }
    });
  
    res.status(HttpStatusCodes.OK).json({ success: true, message: "Address deleted" });
  }

  const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
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
        ...parsedData.data
      }
    });
  
    res.status(HttpStatusCodes.OK).json({ success: true, addressUpdate });
  }

  const getAddress = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user;
  
    if (!id) {
      throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Missing customer id");
    }
  
    const address = await prisma.address.findMany({
      where: {
        userId: id
      }
    });
  
    res.status(HttpStatusCodes.OK).json({ success: true, address });
  }
  
  export default {
    allCustomers,
    updatecustomer,
    addAddress,
    deleteAddress,
    updateAddress,
    getAddress
  }