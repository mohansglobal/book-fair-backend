import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { User, IUser } from "../models/user.model.js";
import {
  RegisterUserInput,
  SendOtpInput,
  VerifyOtpInput,
  LoginUserInput,
} from "../validation/auth.validation.js";
import { AppError } from "../utils/app-error.js";
import { HTTP_STATUS } from "../constants/http-status.js";
import {
  OTP_EXPIRY_MS,
  OTP_RESEND_COOLDOWN_MS,
} from "../constants/auth.js";
import {
  generateOtp,
  dispatchVerificationOtp,
  DispatchOtpResult,
} from "./otp.service.js";
import { generateTokens, verifyRefreshToken, AuthTokens, TokenPayload } from "../utils/token.js";

const MAX_OTP_ATTEMPTS = 5;

export interface RegisterResult {
  user: IUser;
  dispatchResult: DispatchOtpResult;
}

export interface VerifyOtpResult {
  user: IUser;
  tokens: AuthTokens;
}

export interface LoginResult {
  user: IUser;
  tokens: AuthTokens;
}

/**
 * Builds an explicit, non-overlapping user query filter.
 * If both number and email are passed, requires BOTH to match the same user account (preventing cross-account injection).
 */
const buildUserQuery = (number?: string, gmail?: string) => {
  if (number && gmail) {
    return { number, gmail };
  }
  if (number) {
    return { number };
  }
  if (gmail) {
    return { gmail };
  }
  return null;
};

// Registers a new user and triggers verification OTP.
export const registerUserService = async (
  input: RegisterUserInput
): Promise<RegisterResult> => {
  const existingUserByNumber = await User.findOne({ number: input.number });
  if (existingUserByNumber) {
    throw new AppError("A user with this number already exists", HTTP_STATUS.CONFLICT);
  }

  if (input.gmail) {
    const existingUserByGmail = await User.findOne({ gmail: input.gmail });
    if (existingUserByGmail) {
      throw new AppError("A user with this gmail already exists", HTTP_STATUS.CONFLICT);
    }
  }

  let hashedPassword: string | undefined;
  if (input.password) {
    hashedPassword = await bcrypt.hash(input.password, 10);
  }

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  const otpLastSentAt = new Date();

  const createdUser = await User.create({
    name: input.name,
    number: input.number,
    gmail: input.gmail,
    password: hashedPassword,
    isVerified: false,
    isEmailVerified: false,
    isMobileVerified: false,
    otp,
    otpExpiresAt,
    otpLastSentAt,
    otpAttempts: 0,
  });

  const dispatchResult = await dispatchVerificationOtp({
    name: createdUser.name,
    number: createdUser.number,
    email: createdUser.gmail,
    otp,
  });

  return {
    user: createdUser,
    dispatchResult,
  };
};

// Sends or resends verification OTP to an existing user.
// Enforces a 60-second cooldown window to prevent abuse.
export const sendOtpService = async (
  input: SendOtpInput
): Promise<DispatchOtpResult> => {
  const query = buildUserQuery(input.number, input.gmail);
  if (!query) {
    throw new AppError("Either mobile number or email must be provided", HTTP_STATUS.BAD_REQUEST);
  }

  const user = await User.findOne(query).select("+otp +otpExpiresAt +otpLastSentAt +otpAttempts");

  if (!user) {
    throw new AppError("User not found with provided details", HTTP_STATUS.NOT_FOUND);
  }

  // Cooldown verification (60 seconds)
  if (user.otpLastSentAt) {
    const elapsedMs = Date.now() - user.otpLastSentAt.getTime();
    if (elapsedMs < OTP_RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsedMs) / 1000);
      throw new AppError(
        `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
        HTTP_STATUS.TOO_MANY_REQUESTS
      );
    }
  }

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  user.otpLastSentAt = new Date();
  user.otpAttempts = 0;
  await user.save();

  const dispatchResult = await dispatchVerificationOtp({
    name: user.name,
    number: user.number,
    email: user.gmail,
    otp,
  });

  return dispatchResult;
};


//Verifies the OTP provided by the user.
 //Implements constant-time comparison and brute-force attempt limits (max 5 attempts).

export const verifyOtpService = async (
  input: VerifyOtpInput
): Promise<VerifyOtpResult> => {
  const query = buildUserQuery(input.number, input.gmail);
  if (!query) {
    throw new AppError("Either mobile number or email must be provided", HTTP_STATUS.BAD_REQUEST);
  }

  const user = await User.findOne(query).select("+otp +otpExpiresAt +otpAttempts");

  if (!user) {
    throw new AppError("User not found with provided details", HTTP_STATUS.NOT_FOUND);
  }

  if (!user.otp || !user.otpExpiresAt) {
    throw new AppError(
      "No pending verification OTP found. Please request a new OTP",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (user.otpExpiresAt.getTime() < Date.now()) {
    throw new AppError(
      "OTP has expired. Please request a new verification code",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Timing-safe constant-time comparison
  const isLengthMatch = user.otp.length === input.otp.length;
  const isOtpMatch =
    isLengthMatch &&
    crypto.timingSafeEqual(Buffer.from(user.otp), Buffer.from(input.otp));

  if (!isOtpMatch) {
    user.otpAttempts = (user.otpAttempts ?? 0) + 1;

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      // Invalidate OTP due to brute force attempts
      user.otp = undefined;
      user.otpExpiresAt = undefined;
      user.otpAttempts = 0;
      await user.save();
      throw new AppError(
        "Maximum OTP verification attempts exceeded. This OTP has been invalidated. Please request a new code.",
        HTTP_STATUS.TOO_MANY_REQUESTS
      );
    }

    await user.save();
    const remaining = MAX_OTP_ATTEMPTS - user.otpAttempts;
    throw new AppError(
      `Invalid OTP. You have ${remaining} attempt(s) remaining.`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Mark user as verified and clear OTP state
  user.isVerified = true;
  if (user.gmail) {
    user.isEmailVerified = true;
  }
  user.isMobileVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  user.otpAttempts = 0;
  await user.save();

  const tokens = generateTokens(user._id.toString());

  return {
    user,
    tokens,
  };
};

// Logs in a user using mobile number or email + password.
// Checks credential validity, account verification status, and returns session tokens.
export const loginUserService = async (
  input: LoginUserInput
): Promise<LoginResult> => {
  const query = buildUserQuery(input.number, input.gmail);
  if (!query) {
    throw new AppError("Either mobile number or email must be provided", HTTP_STATUS.BAD_REQUEST);
  }

  const user = await User.findOne(query).select("+password");

  if (!user) {
    throw new AppError("Invalid credentials", HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.password) {
    throw new AppError(
      "No password set for this account. Please verify with OTP or set a password.",
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.isVerified) {
    throw new AppError(
      "Account is not verified. Please verify your OTP to continue.",
      HTTP_STATUS.FORBIDDEN
    );
  }

  const tokens = generateTokens(user._id.toString());

  return {
    user,
    tokens,
  };
};


//Validates a refresh token and generates fresh access & refresh tokens.

export const refreshTokenService = async (
  token: string
): Promise<{ user: IUser; tokens: AuthTokens }> => {
  let payload: TokenPayload;
  try {
    payload = verifyRefreshToken(token);
  } catch (_err) {
    throw new AppError(
      "Invalid or expired refresh token. Please login again.",
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    throw new AppError("User account no longer exists", HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.isVerified) {
    throw new AppError(
      "Account is not verified. Please verify your OTP to continue.",
      HTTP_STATUS.FORBIDDEN
    );
  }

  const tokens = generateTokens(user._id.toString());

  return {
    user,
    tokens,
  };
};


//Fetches the authenticated user profile by their ID.
export const getCurrentUserService = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User account not found", HTTP_STATUS.NOT_FOUND);
  }

  return user;
  
};
