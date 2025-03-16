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
