import { Schema, Types } from "mongoose";
import type { MongoDocument } from "../../mongodbAbstract.backendService";

export interface Player extends MongoDocument {
  name: string;
  phoneNumber: string;
  email: string;
  tournaments: Types.ObjectId[];
  status: "ACTIVE" | "INACTIVE" | "BANNED";
}

export const PlayerSchema = new Schema<Player>(
  {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    tournaments: [
      { type: Schema.Types.ObjectId, ref: "Tournament", default: [] },
    ],
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "BANNED"],
      default: "INACTIVE",
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
PlayerSchema.index({ status: 1 });
