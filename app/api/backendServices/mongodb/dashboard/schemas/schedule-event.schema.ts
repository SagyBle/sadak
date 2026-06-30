import { Schema, Types } from "mongoose";
import type { MongoDocument } from "../../mongodbAbstract.backendService";

export type ActivityType =
  | "TRAINING"
  | "COMMANDERS_TRAINING"
  | "OPERATIONAL_EMPLOYMENT"
  | "PROCESSING_DAY"
  | "HOME";

export interface ScheduleEvent extends MongoDocument {
  department: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  activityType: ActivityType;
  requiredPersonnelCount: number;
  scope: "ALL_DEPARTMENT" | "SPECIFIC_USERS";
  selectedUsers: Types.ObjectId[];
  notes: string;
}

export const ScheduleEventSchema = new Schema<ScheduleEvent>(
  {
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    activityType: {
      type: String,
      enum: [
        "TRAINING",
        "COMMANDERS_TRAINING",
        "OPERATIONAL_EMPLOYMENT",
        "PROCESSING_DAY",
        "HOME",
      ],
      required: true,
    },
    requiredPersonnelCount: { type: Number, required: true, min: 0 },
    scope: {
      type: String,
      enum: ["ALL_DEPARTMENT", "SPECIFIC_USERS"],
      default: "ALL_DEPARTMENT",
    },
    selectedUsers: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);
