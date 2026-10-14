import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "../utils/app-error.js";
import { HTTP_STATUS } from "../constants/http-status.js";

interface RequestValidators {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validateRequest = (validators: RequestValidators) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (validators.body) {
        req.body = (await validators.body.parseAsync(req.body)) as unknown;
      }
      if (validators.query) {
        req.query = (await validators.query.parseAsync(req.query)) as Request["query"];
      }
      if (validators.params) {
        req.params = (await validators.params.parseAsync(req.params)) as Request["params"];
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues
          .map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`)
          .join(", ");
        next(new AppError(`Validation failed: ${errorMessage}`, HTTP_STATUS.BAD_REQUEST));
        return;
      }
      next(error);
    }
  };
};
