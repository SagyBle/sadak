import { Schema } from "mongoose";
import type { MongoDocument } from "../../mongodbAbstract.backendService";

export interface Department extends MongoDocument {
  name: string;
}

export const DepartmentSchema = new Schema<Department>(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);
