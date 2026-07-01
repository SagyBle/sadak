import { Schema, Types } from "mongoose";
import type { MongoDocument } from "../../mongodbAbstract.backendService";

export interface DepartmentOrder {
  _id: Types.ObjectId;
  label: string;
  startDate: Date;
  endDate: Date;
}

export interface Department extends MongoDocument {
  name: string;
  employmentStartDate?: Date;
  orders?: DepartmentOrder[];
  activeOrderId?: Types.ObjectId;
}

export const DepartmentSchema = new Schema<Department>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    employmentStartDate: { type: Date },
    orders: [
      new Schema<DepartmentOrder>(
        {
          label: { type: String, required: true, trim: true },
          startDate: { type: Date, required: true },
          endDate: { type: Date, required: true },
        },
        { _id: true }
      ),
    ],
    activeOrderId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);
