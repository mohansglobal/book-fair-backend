
export type AuthOtpChannelMode = "EMAIL_ONLY" | "SMS_ONLY" | "BOTH";


export const AUTH_OTP_MODE: AuthOtpChannelMode = "EMAIL_ONLY";

export const isEmailOtpEnabled = (mode: AuthOtpChannelMode = AUTH_OTP_MODE): boolean => {
  return mode === "EMAIL_ONLY" || mode === "BOTH";
};

export const isSmsOtpEnabled = (mode: AuthOtpChannelMode = AUTH_OTP_MODE): boolean => {
  return mode === "SMS_ONLY" || mode === "BOTH";
};

export const IS_EMAIL_OTP_ENABLED: boolean = isEmailOtpEnabled();
export const IS_SMS_OTP_ENABLED: boolean = isSmsOtpEnabled();

export const OTP_VALIDITY_MINUTES = 5;
export const OTP_EXPIRY_MS = OTP_VALIDITY_MINUTES * 60 * 1000;

export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_RESEND_COOLDOWN_MS = OTP_RESEND_COOLDOWN_SECONDS * 1000;
