import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  number: string;
  gmail?: string;
  isVerified: boolean;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  password?: string;
  otp?: string;
  otpExpiresAt?: Date;
  otpLastSentAt?: Date;
  otpAttempts?: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    gmail: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      select: false,
    },
    otpLastSentAt: {
      type: Date,
      select: false,
    },
    password: {
      type: String,
      select: false,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        delete ret.password;
        delete ret.otp;
        delete ret.otpExpiresAt;
        delete ret.otpLastSentAt;
        delete ret.otpAttempts;
        return ret;
      },
    },
  }
);

export const User = model<IUser>("User", userSchema);
