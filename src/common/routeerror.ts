import HttpStatusCodes from "./httpstatuscode.js";


/******************************************************************************
                              Classes
******************************************************************************/

/**
 * Error with status code and message.
 */
export class RouteError extends Error {
  public status: HttpStatusCodes;

  public constructor(status: HttpStatusCodes, message: string) {
    super(message);
    this.status = status;
  }
}

export class RouteResponse extends Error {
  statusCode: number;
  data: any | null;
  success: boolean;
  errors: string[] | any[];
  stack: any;

  constructor(
      statusCode: number,
      message: string = "Something went wrong",
      errors: string[] | any[] = [],
      stack: string = ""
  ) {
      super(message);
      this.statusCode = statusCode;
      this.data = null;
      this.message = message;
      this.success = false;
      this.errors = errors;

      if (stack) {
          this.stack = stack;
      } else {
          Error.captureStackTrace(this, this.constructor);
      }
  }
}


/**
 * Validation in route layer errors.
 */
export class ValidationErr extends RouteError {
  public static MSG = 'One or more parameters were missing or invalid.';

  public constructor(errObj: unknown) {
    const msg = JSON.stringify({
      message: ValidationErr.MSG,
      parameters: errObj,
    });
    super(HttpStatusCodes.BAD_REQUEST, msg);
  }
}
