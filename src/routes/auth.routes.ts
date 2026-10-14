import { Router } from "express";
import {
  registerUserController,
  sendOtpController,
  verifyOtpController,
  loginUserController,
  refreshTokenController,
  logoutUserController,
} from "../controllers/auth.controller.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  registerUserSchema,
  sendOtpSchema,
  verifyOtpSchema,
  loginUserSchema,
} from "../validation/auth.validation.js";

const router = Router();

// Registration
router.post(
  "/register",
  validateRequest({ body: registerUserSchema }),
  registerUserController
);

// Send / Resend OTP
router.post(
  "/send-otp",
  validateRequest({ body: sendOtpSchema }),
  sendOtpController
);

router.post(
  "/resend-otp",
  validateRequest({ body: sendOtpSchema }),
  sendOtpController
);

// Verify OTP
router.post(
  "/verify-otp",
  validateRequest({ body: verifyOtpSchema }),
  verifyOtpController
);

router.post(
  "/verify-email",
  validateRequest({ body: verifyOtpSchema }),
  verifyOtpController
);

// Login (Number or Email + Password)
router.post(
  "/login",
  validateRequest({ body: loginUserSchema }),
  loginUserController
);

// Refresh Token`
router.post("/refresh", refreshTokenController);

// Logout
router.post("/logout", logoutUserController);

export default router;
