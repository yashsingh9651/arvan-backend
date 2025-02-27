
import { Prisma } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import HttpStatusCodes from '../common/httpstatuscode.js';
import { RouteError } from '../common/routeerror.js';
import ENV from '../common/env.js';
import { NodeEnvs } from '../common/constants.js';
import { exceptionCodes } from '../common/prismafilter.js';


const cleanMessage = (message: string) => message.replace(/(\r\n|\r|\n)/g, ' ');
export const globalErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction):any => {
    // Log the error unless in test environment
    if (ENV.NODE_ENV !== NodeEnvs.Test.valueOf()) {
      console.error(err);
    }
    
    // Handle Prisma Known Request Error
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      const statusCode = exceptionCodes[err.code] || HttpStatusCodes.BAD_REQUEST;
      const message =
        ENV.NODE_ENV === 'production'
          ? err.meta
          : cleanMessage(err.message);
      return res.status(statusCode).json({
        success: false,
        statusCode,
        path: req.url,
        message,
      });
    }
    
    // Handle Prisma Unknown Request Error
    if (err instanceof Prisma.PrismaClientUnknownRequestError) {
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
        path: req.url,
        message: 'Something went wrong',
      });
    }
    
    // Handle Prisma Validation Error
    if (err instanceof Prisma.PrismaClientValidationError) {
      const indexOfArgument = err.message.indexOf('Argument');
      const message = cleanMessage(err.message.substring(indexOfArgument));
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        path: req.url,
        message,
      });
    }
    
    // Handle custom RouteError
    if (err instanceof RouteError) {
      return res.status(err.status).json({ success: false, error: err.message });
    }
    
    // Fallback for all other errors
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      path: req.url,
      message: err.message || "Internal Server Error",
    });
  };