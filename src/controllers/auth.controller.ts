import { Request, Response } from "express";
import {
  registerUserService,
  sendOtpService,
  verifyOtpService,
  loginUserService,
  refreshTokenService,
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

/**
 * Controller to verify OTP and return authenticated session tokens.
 */
export const verifyOtpController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input: VerifyOtpInput = req.body;
  const { user, tokens } = await verifyOtpService(input);

  // Set secure HTTP-only refresh token cookie
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

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
  
  // Set secure HTTP-only refresh token cookie
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

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
  const token =
    (req.cookies?.refreshToken as string | undefined) ||
    (req.body?.refreshToken as string | undefined) ||
    (req.headers["x-refresh-token"] as string | undefined);

  if (!token) {
    throw new AppError("Refresh token is required", HTTP_STATUS.UNAUTHORIZED);
  }

  const { user, tokens } = await refreshTokenService(token);

  // Rotate HTTP-only refresh token cookie
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

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
 * Controller to log out user and clear the refresh token cookie.
 */
export const logoutUserController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
  });
  
  apiResponse(res, HTTP_STATUS.OK, "Logged out successfully", null);
};
