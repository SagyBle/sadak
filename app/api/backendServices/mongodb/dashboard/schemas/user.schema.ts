import { Schema, Types } from "mongoose";
import type { MongoDocument } from "../../mongodbAbstract.backendService";

export type AppUserRole = "SOLDIER" | "COMMANDER";

export interface AppUser extends MongoDocument {
  name: string;
  role: AppUserRole;
  department: Types.ObjectId;
  password: string;
  isActive: boolean;
}

export const UserSchema = new Schema<AppUser>(
  {
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["SOLDIER", "COMMANDER"],
      required: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
