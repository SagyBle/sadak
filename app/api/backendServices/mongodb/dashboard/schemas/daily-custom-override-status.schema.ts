import { Schema, Types } from "mongoose";
import type { MongoDocument } from "../../mongodbAbstract.backendService";

export interface DailyCustomOverrideStatus extends MongoDocument {
  user: Types.ObjectId;
  date: Date;
  statusText: string;
}

export const DailyCustomOverrideStatusSchema =
  new Schema<DailyCustomOverrideStatus>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      date: { type: Date, required: true, index: true },
      statusText: { type: String, required: true },
    },
    { timestamps: true }
  );
