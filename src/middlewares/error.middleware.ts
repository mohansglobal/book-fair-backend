import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error.js";
import { logger } from "../utils/logger.js";


interface MongoDuplicateKeyError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

export const errorHandler = (
  err: Error | MongoDuplicateKeyError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if ("code" in err && err.code === 11000) {
    const duplicateKey = (err as MongoDuplicateKeyError).keyValue;
    const duplicateField = duplicateKey ? Object.keys(duplicateKey).join(", ") : "field";
    return res.status(409).json({
      success: false,
      message: `A record with this ${duplicateField} already exists`,
    });
  }

  logger.error(err, "Unhandled error occurred");
  return res.status(500).json({
    success: false,
    message: err.message
  });
};



