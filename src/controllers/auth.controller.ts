import { Request, Response } from "express";
import {
  registerUserService,
  sendOtpService,
  verifyOtpService,
  loginUserService,
  refreshTokenService,
  getCurrentUserService,
} from "../services/auth.service.js";
import {
  RegisterUserInput,
  SendOtpInput,
  VerifyOtpInput,
  LoginUserInput,
} from "../validation/auth.validation.js";
import { AppError } from "../utils/app-error.js";
import { apiResponse } from "../utils/api-response.js";
import { HTTP_STATUS } from "../constants/http-status.js";
import { env } from "../config/env.js";

/**
 * Controller to handle new user registration and initial OTP dispatch.
 */

export const registerUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input: RegisterUserInput = req.body;
  const { user, dispatchResult } = await registerUserService(input);

  apiResponse(res, HTTP_STATUS.CREATED, "User registered successfully. Verification OTP has been sent.", {
    id: user._id,
    name: user.name,
    number: user.number,
    gmail: user.gmail ?? null,
    isVerified: user.isVerified,
    isEmailVerified: user.isEmailVerified,
    isMobileVerified: user.isMobileVerified,
    createdAt: user.createdAt,
    otpDispatched: {
      emailSent: dispatchResult.emailSent,
      smsSent: dispatchResult.smsSent,
      mode: dispatchResult.mode,
    },
  });
};

/**
 * Controller to send or resend verification OTP.
 */
export const sendOtpController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input: SendOtpInput = req.body;
  const dispatchResult = await sendOtpService(input);

  apiResponse(res, HTTP_STATUS.OK, "Verification OTP sent successfully", {
    emailSent: dispatchResult.emailSent,
    smsSent: dispatchResult.smsSent,
    mode: dispatchResult.mode,
  });
};

const ACCESS_TOKEN_COOKIE_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days



/**
 * Attaches both access token and refresh token as secure HTTP-only cookies.
 */
const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
): void => {
  res.cookie("accessToken", tokens.accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
  });

  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
  });
};

/**
 * Clears both access token and refresh token cookies upon logout.
 */
const clearAuthCookies = (res: Response): void => {
  const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};

/**
 * Controller to verify OTP and return authenticated session tokens.
 */
export const verifyOtpController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input: VerifyOtpInput = req.body;
  const { user, tokens } = await verifyOtpService(input);

  // Set secure HTTP-only cookies for both tokens
  setAuthCookies(res, tokens);

  apiResponse(res, HTTP_STATUS.OK, "OTP verified successfully", {
    user: {
      id: user._id,
      name: user.name,
      number: user.number,
      gmail: user.gmail ?? null,
      isVerified: user.isVerified,
      isEmailVerified: user.isEmailVerified,
      isMobileVerified: user.isMobileVerified,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
};

/**
 * Controller to handle user login with mobile number or email + password.
 */
export const loginUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input: LoginUserInput = req.body; 
  const { user, tokens } = await loginUserService(input);
  
  // Set secure HTTP-only cookies for both tokens
  setAuthCookies(res, tokens);

  apiResponse(res, HTTP_STATUS.OK, "Login successful", {
    user: {
      id: user._id,
      name: user.name,
      number: user.number,
      gmail: user.gmail ?? null,
      isVerified: user.isVerified,
      isEmailVerified: user.isEmailVerified,
      isMobileVerified: user.isMobileVerified,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
};

/**
 * Controller to refresh expired access tokens using the refresh token (from cookie, body, or header).
 */
export const refreshTokenController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const token = req.cookies?.refreshToken as string | undefined;

  if (!token) {
    throw new AppError("Refresh token is required", HTTP_STATUS.UNAUTHORIZED);
  }

  const { user, tokens } = await refreshTokenService(token);

  // Rotate secure HTTP-only cookies for both tokens
  setAuthCookies(res, tokens);

  apiResponse(res, HTTP_STATUS.OK, "Token refreshed successfully", {
    user: {
      id: user._id,
      name: user.name,
      number: user.number,
      gmail: user.gmail ?? null,
      isVerified: user.isVerified,
      isEmailVerified: user.isEmailVerified,
      isMobileVerified: user.isMobileVerified,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
};

/**
 * Controller to log out user and clear both auth token cookies.
 */
export const logoutUserController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  clearAuthCookies(res);
  
  apiResponse(res, HTTP_STATUS.OK, "Logged out successfully", null);
};

/**
 * Controller to fetch the currently authenticated user's profile.
 */
export const getCurrentUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
  }

  const user = await getCurrentUserService(userId);

  apiResponse(res, HTTP_STATUS.OK, "User profile retrieved successfully", {
    user: {
      id: user._id,
      name: user.name,
      number: user.number,
      gmail: user.gmail ?? null,
      isVerified: user.isVerified,
      isEmailVerified: user.isEmailVerified,
      isMobileVerified: user.isMobileVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
};
