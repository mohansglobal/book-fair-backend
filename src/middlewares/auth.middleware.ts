import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token.js";
import { AppError } from "../utils/app-error.js";
import { HTTP_STATUS } from "../constants/http-status.js";

/**
 * Middleware to enforce authentication on protected routes.
 * Strictly cookie-based: extracts and verifies JWT from the accessToken HTTP-only cookie.
 **/
export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.accessToken as string | undefined;
  // console.log(token);
  if (!token) {
    throw new AppError("Authentication required. Please log in.", HTTP_STATUS.UNAUTHORIZED);
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (_error) {
    throw new AppError("Invalid or expired session. Please log in again.", HTTP_STATUS.UNAUTHORIZED);
  }
};

/**
 * Optional authentication middleware:
 * Attaches req.user if a valid token is present, but does not reject unauthenticated requests.
 */
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const cookieToken = req.cookies?.accessToken as string | undefined;
  const headerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : undefined;
  const token = cookieToken || headerToken;

  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
  } catch {
    // If optional token is invalid, continue without attaching user
  }
  next();
};

