import { Schema, Types } from "mongoose";
import type { MongoDocument } from "../../mongodbAbstract.backendService";

export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type LeaveRequestType = "LEAVE" | "STAY_BEHIND";

export interface LeaveRequest extends MongoDocument {
  user: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveRequestStatus;
  requestType: LeaveRequestType;
  notes: string;
}

export const LeaveRequestSchema = new Schema<LeaveRequest>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    requestType: {
      type: String,
      enum: ["LEAVE", "STAY_BEHIND"],
      default: "LEAVE",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);
