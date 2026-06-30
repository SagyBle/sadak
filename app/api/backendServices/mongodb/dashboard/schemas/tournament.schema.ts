import { Schema, Types } from "mongoose";
import type { MongoDocument } from "../../mongodbAbstract.backendService";

export interface Tournament extends MongoDocument {
  name: string;
  description: string;
  startDate: Date;
  endOfRegistration: Date;
  players: Types.ObjectId[];
  groups: Types.ObjectId[];
  matches: Types.ObjectId[];
  format: "league" | "knockout" | "mixed" | "groups";
  winner: Types.ObjectId | null;
  mainImage: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
  maxPlayers: number;
  location: string;
  prizePool: string;
  isPublished: boolean;
}

export const TournamentSchema = new Schema<Tournament>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endOfRegistration: { type: Date, required: true },
    players: [{ type: Schema.Types.ObjectId, ref: "Player", default: [] }],
    groups: [{ type: Schema.Types.ObjectId, ref: "Group", default: [] }],
    matches: [{ type: Schema.Types.ObjectId, ref: "Match", default: [] }],
    format: {
      type: String,
      enum: ["league", "knockout", "mixed", "groups"],
      required: true,
    },
    winner: { type: Schema.Types.ObjectId, ref: "Player", default: null },
    mainImage: { type: String, default: "" },
    status: {
      type: String,
      enum: ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"],
      default: "UPCOMING",
    },
    maxPlayers: { type: Number, default: 0 },
    location: { type: String, default: "" },
    prizePool: { type: String, default: "" },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
TournamentSchema.index({ status: 1, isPublished: 1 });
TournamentSchema.index({ startDate: 1 });
