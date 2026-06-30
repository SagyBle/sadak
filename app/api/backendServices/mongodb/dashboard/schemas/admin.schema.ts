import { Schema } from "mongoose";
import type { MongoDocument } from "../../mongodbAbstract.backendService";

export interface Admin extends MongoDocument {
  name: string;
  passwordHash: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
}

export const AdminSchema = new Schema<Admin>(
  {
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["ADMIN", "SUPER_ADMIN"],
      default: "ADMIN",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index is already created by unique: true on email field, so we remove the duplicate
