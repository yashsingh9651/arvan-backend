import { z } from "zod";

export const updatecustomerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mobile_no: z.string().min(1),
  image: z.string().min(1),
  password: z.string().min(1),
});

export const addAddressSchema = z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    zipCode: z.string().min(1),
});


const OtpTypeEnum = z.enum(["verify", "forgetpassword"]);

// Define the schema for the OTP object
export const getOtpSchema = z.object({
  mobileNumber: z.string().min(1), // Ensures 'mobileNumber' is a non-empty string
  otp: z.string().min(1), // Ensures 'otp' is a non-empty string
  type: OtpTypeEnum,      // Ensures 'type' is either 'verifyemail' or 'forgetpassword'
});


export const forgetpasswordSchema = z.object({
  password: z.string().min(1), 
   token : z.string().min(1),
});