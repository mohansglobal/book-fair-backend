import crypto from "node:crypto";
import {
  IS_EMAIL_OTP_ENABLED,
  IS_SMS_OTP_ENABLED,
  AUTH_OTP_MODE,
} from "../constants/auth.js";
import { sendOtpEmail } from "./email.service.js";
import { sendOtpSms } from "./sms.service.js";
import { logger } from "../utils/logger.js";

export interface DispatchOtpInput {
  name: string;
  number?: string;
  email?: string;
  otp: string;
}

export interface DispatchOtpResult {
  emailSent: boolean;
  smsSent: boolean;
  mode: string;
}

/**
 * Generates a secure 6-digit numeric OTP.
 */
export const generateOtp = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Dispatches the SAME OTP to configured channels based on AUTH_OTP_MODE.
 * Currently, AUTH_OTP_MODE is set to "EMAIL_ONLY", so OTP is sent only via Email.
 * Changing AUTH_OTP_MODE to "BOTH" will dispatch the same OTP to both Email and Mobile SMS simultaneously.
 */
export const dispatchVerificationOtp = async ({
  name,
  number,
  email,
  otp,
}: DispatchOtpInput): Promise<DispatchOtpResult> => {
  let emailSent = false;
  let smsSent = false;

  const dispatchTasks: Promise<void>[] = [];

  // 1. Email Channel Dispatch
  if (IS_EMAIL_OTP_ENABLED && email) {
    dispatchTasks.push(
      sendOtpEmail({ toEmail: email, name, otp })
        .then((result) => {
          emailSent = result;
        })
        .catch((error) => {
          logger.error({ err: error, email }, "Failed during email OTP dispatch");
        })
    );
  } else if (!email && IS_EMAIL_OTP_ENABLED) {
    logger.info("Email OTP enabled globally, but no email/gmail was provided for user");
  }

  // 2. Mobile SMS Channel Dispatch
  if (IS_SMS_OTP_ENABLED && number) {
    dispatchTasks.push(
      sendOtpSms(number, otp)
        .then((result) => {
          smsSent = result;
        })
        .catch((error) => {
          logger.error({ err: error, number }, "Failed during SMS OTP dispatch");
        })
    );
  } else if (!IS_SMS_OTP_ENABLED) {
    logger.info(
      { authOtpMode: AUTH_OTP_MODE },
      "Mobile SMS dispatch skipped because AUTH_OTP_MODE is configured for email-only"
    );
  }

  await Promise.all(dispatchTasks);

  return {
    emailSent,
    smsSent,
    mode: AUTH_OTP_MODE,
  };
};
