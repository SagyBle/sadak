import { Schema, Types } from "mongoose";
import type { MongoDocument } from "../../mongodbAbstract.backendService";

export interface GroupPlayer {
  player: Types.ObjectId;
  points: number;
  wins: number;
  losses: number;
  pointDifference: number;
  matchesPlayed: number;
}

export interface Group extends MongoDocument {
  tournament: Types.ObjectId;
  name: string;
  players: GroupPlayer[];
  matches: Types.ObjectId[];
  standings: GroupPlayer[];
  advancingPlayers: Types.ObjectId[];
  numberOfAdvancingPlayers: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  metadata: any;
}

const GroupPlayerSchema = new Schema<GroupPlayer>(
  {
    player: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    points: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    pointDifference: { type: Number, default: 0 },
    matchesPlayed: { type: Number, default: 0 },
  },
  { _id: false }
);

export const GroupSchema = new Schema<Group>(
  {
    tournament: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    name: { type: String, required: true },
    players: [GroupPlayerSchema],
    matches: [{ type: Schema.Types.ObjectId, ref: "Match", default: [] }],
    standings: [GroupPlayerSchema],
    advancingPlayers: [
      { type: Schema.Types.ObjectId, ref: "Player", default: [] },
    ],
    numberOfAdvancingPlayers: { type: Number, default: 2 },
    status: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
      default: "NOT_STARTED",
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Indexes for better query performance
GroupSchema.index({ tournament: 1 });
GroupSchema.index({ status: 1 });
