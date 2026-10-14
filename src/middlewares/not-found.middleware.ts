import { Request, Response } from "express";
import { AppError } from "../utils/app-error.js";

export const notFoundHandler = (req: Request, _res: Response) => {
  throw new AppError(`Route ${req.originalUrl} not found`, 404);
};
