import { Schema, Types } from "mongoose";
import type { MongoDocument } from "../../mongodbAbstract.backendService";

export type DutyType = "KITCHEN" | "MAINTENANCE_RASAP" | "OTHER";

export interface DutyLog extends MongoDocument {
  user: Types.ObjectId;
  date: Date;
  dutyType: DutyType;
  notes: string;
}

export const DutyLogSchema = new Schema<DutyLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    dutyType: {
      type: String,
      enum: ["KITCHEN", "MAINTENANCE_RASAP", "OTHER"],
      required: true,
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);
