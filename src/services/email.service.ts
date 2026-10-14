import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { OTP_VALIDITY_MINUTES } from "../constants/auth.js";

const smtpHost = env.EMAIL_HOST || "smtp.hostinger.com";
const smtpPort = env.EMAIL_PORT || 465;
const smtpUser = env.EMAIL_USER || env.SMTP_KYC_USER || "";
const smtpPass = env.EMAIL_PASS || env.SMTP_KYC_PASS || "";
const isSecure = smtpPort === 465;

export const emailTransporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: isSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export interface SendOtpEmailOptions {
  toEmail: string;
  name?: string;
  otp: string;
  validityMinutes?: number;
}

export const sendOtpEmail = async ({
  toEmail,
  name,
  otp,
  validityMinutes = OTP_VALIDITY_MINUTES,
}: SendOtpEmailOptions): Promise<boolean> => {
  if (!smtpUser || !smtpPass) {
    logger.warn("SMTP credentials not fully configured; skipping email dispatch");
    return false;
  }
  const senderFrom = env.EMAIL_USER;
  console.log('please check this ===>' , senderFrom)
  const recipientName = name ? name.trim() : "-";

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Book Fair Verification Code</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f6f8;
            margin: 0;
            padding: 24px;
            color: #333333;
          }
          .container {
            max-width: 540px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            padding: 36px 32px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
            border: 1px solid #eaeaea;
          }
          .header {
            text-align: center;
            padding-bottom: 24px;
            border-bottom: 1px solid #f0f0f0;
          }
          .header h1 {
            margin: 0;
            color: #1a1a1a;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .content {
            padding: 24px 0;
          }
          .greeting {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #222222;
          }
          .text {
            font-size: 15px;
            line-height: 1.6;
            color: #555555;
            margin-bottom: 24px;
          }
          .otp-card {
            background-color: #f7f9fc;
            border: 2px dashed #3b82f6;
            border-radius: 8px;
            text-align: center;
            padding: 20px;
            margin: 20px 0;
          }
          .otp-code {
            font-family: 'Courier New', Courier, monospace;
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #1d4ed8;
            margin: 0;
          }
          .validity {
            font-size: 13px;
            color: #888888;
            margin-top: 8px;
          }
          .footer {
            padding-top: 24px;
            border-top: 1px solid #f0f0f0;
            font-size: 12px;
            color: #999999;
            text-align: center;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Online Book Fair</h1>
          </div>
          <div class="content">
            <p class="greeting">Hello, ${recipientName}!</p>
            <p class="text">
              Thank you for registering with Online Book Fair. Use the 6-digit verification code below to verify your account:
            </p>
            <div class="otp-card">
              <div class="otp-code">${otp}</div>
              <div class="validity">Valid for ${validityMinutes} minutes</div>
            </div>
            <p class="text" style="font-size: 13px; color: #777777;">
              If you did not request this verification code, please ignore this email or contact support. Do not share this code with anyone.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Online Book Fair. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const info = await emailTransporter.sendMail({
      from: senderFrom,
      to: toEmail,
      subject: `Your Book Fair Verification Code: ${otp}`,
      text: `Hello ${recipientName},\n\nYour verification code is: ${otp}\n\nThis code is valid for ${validityMinutes} minutes.\n\nOnline Book Fair Team`,
      html: emailHtml,
    });

    logger.info({ messageId: info.messageId, toEmail }, "OTP email sent successfully");
    return true;
  } catch (error) {
    logger.error({ err: error, toEmail }, "Failed to send OTP email");
    return false;
  }
};
