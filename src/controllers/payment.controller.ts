import { Request, Response, NextFunction } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import razorpay from '../lib/razorpay.js';
import HttpStatusCodes from '../common/httpstatuscode.js';
import { RouteError } from '../common/routeerror.js';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, currency, receipt } = req.body;

    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);
    
    res.status(HttpStatusCodes.CREATED).json({ success: true, order });
  } catch (error) {
    next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, (error as Error).message));
  }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature === razorpay_signature) {
      res.status(HttpStatusCodes.OK).json({ success: true, message: 'Payment verified successfully' });
    } else {
      throw new RouteError(HttpStatusCodes.BAD_REQUEST, 'Invalid payment signature');
    }
  } catch (error) {
    next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, (error as Error).message));
  }
};

export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { order_id, amount, currency } = req.body;

    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency,
      receipt: order_id,
    };

    const payment = await razorpay.orders.create(options);
    
    res.status(HttpStatusCodes.CREATED).json({ success: true, payment });
  } catch (error) {
    next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, (error as Error).message));
  }
};
