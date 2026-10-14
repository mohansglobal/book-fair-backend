import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export interface SendSmsOptions {
  senderId?: string;
}

/**
 * Normalizes Indian mobile number to E.164 without plus sign (e.g., 91XXXXXXXXXX).
 * Strips non-digit characters. If 10 digits, prepends "91".
 */
export const formatMobileNumber = (mobileNumber: string): string => {
  const digitsOnly = mobileNumber.replace(/\D/g, "");
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return digitsOnly;
  }
  return digitsOnly;
};

/**
 * Sends OTP SMS using DLT-approved template through the SMS Gateway.
 *
 * DLT Registered Template:
 * "Dear User, Use OTP : {otp} to verify your mobile number for GEISIL. This code is valid for 2 minutes. Global Employability Information Services India Limited."
 */
export const sendOtpSms = async (
  mobileNumber: string,
  otp: string,
  options: SendSmsOptions = {}
): Promise<boolean> => {
  const baseUrl = env.SMS_LINK || "https://api.mylogin.co.in";
  const apiKey = env.SMS_KEY || "";
  const clientId = env.SMS_CLIENT_ID || "";
  const senderId = options.senderId || env.SMS_SENDER_ID || "-";

  if (!apiKey || !clientId) {
    logger.warn("SMS Gateway credentials (SMS_KEY / SMS_CLIENT_ID) not fully configured; skipping SMS dispatch");
    return false;
  }

  const formattedMobile = formatMobileNumber(mobileNumber);
  const messageText = `Dear User, Use OTP : ${otp} to verify your mobile number for GEISIL. This code is valid for 2 minutes. Global Employability Information Services India Limited.`;
  const encodedMessage = encodeURIComponent(messageText);
  const safeApiKey = apiKey.includes("%") ? apiKey : encodeURIComponent(apiKey);

  const endpointUrl = `${baseUrl}/api/v2/SendSMS?SenderId=${encodeURIComponent(
    senderId
  )}&Message=${encodedMessage}&MobileNumbers=${encodeURIComponent(
    formattedMobile
  )}&ApiKey=${safeApiKey}&ClientId=${encodeURIComponent(clientId)}`;

  try {
    const response = await fetch(endpointUrl, {
      method: "GET",
      headers: {
        Accept: "text/plain",
      },
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      logger.error(
        { status: response.status, responseText, recipientMobile: formattedMobile },
        "SMS Gateway returned non-success status"
      );
      return false;
    }

    logger.info({ recipientMobile: formattedMobile }, "SMS OTP dispatched successfully via Gateway");
    return true;
  } catch (error) {
    logger.error({ err: error, recipientMobile: formattedMobile }, "Failed to communicate with SMS Gateway");
    return false;
  }
};
