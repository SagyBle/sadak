import { Model } from "mongoose";
import MongoDBAbstractService from "../mongodbAbstract.backendService";
import { dashboardModelMap } from "./dashboardModelMap";
import type { Player } from "./schemas/player.schema";
import type { Tournament } from "./schemas/tournament.schema";
import type { Match } from "./schemas/match.schema";
import type { Admin } from "./schemas/admin.schema";
import type { Group } from "./schemas/group.schema";

class DashboardMongoDBService extends MongoDBAbstractService {
  private static instance: DashboardMongoDBService;

  private constructor() {
    super();
  }

  public static async getInstance(): Promise<DashboardMongoDBService> {
    if (!DashboardMongoDBService.instance) {
      const instance = new DashboardMongoDBService();
      await instance.init();
      DashboardMongoDBService.instance = instance;
    }
    return DashboardMongoDBService.instance;
  }

  protected getUri(): string {
    return process.env.MONGODB_DASHBOARD_URI || "";
  }

  private async init() {
    await this.connect();

    // Register all models from the model map
    for (const [modelName, schema] of Object.entries(dashboardModelMap)) {
      this.models[modelName] = this.getOrCreateModel(modelName, schema as any);
    }
  }

  // Direct model accessors with proper typing
  get Player(): Model<Player> {
    return this.getModel<Player>("Player");
  }

  get Tournament(): Model<Tournament> {
    return this.getModel<Tournament>("Tournament");
  }

  get Match(): Model<Match> {
    return this.getModel<Match>("Match");
  }

  get Admin(): Model<Admin> {
    return this.getModel<Admin>("Admin");
  }

  get Group(): Model<Group> {
    return this.getModel<Group>("Group");
  }

  // Convenience methods for Players
  public async createPlayer(
    data: Omit<Player, "_id" | "createdAt" | "updatedAt">
  ) {
    return this.create<Player>(this.Player, data);
  }

  public async findPlayerByEmail(email: string) {
    return this.Player.findOne({ email }).lean();
  }

  public async getPlayersByStatus(status: "ACTIVE" | "INACTIVE" | "BANNED") {
    return this.getAll<Player>(this.Player, { status });
  }

  // Convenience methods for Tournaments
  public async createTournament(
    data: Omit<Tournament, "_id" | "createdAt" | "updatedAt">
  ) {
    return this.create<Tournament>(this.Tournament, data);
  }

  public async getPublishedTournaments() {
    return this.getAll<Tournament>(
      this.Tournament,
      { isPublished: true },
      { sort: { startDate: -1 } }
    );
  }

  public async getTournamentById(id: string) {
    return this.Tournament.findById(id)
      .populate("players", "name email phoneNumber status")
      .populate("matches")
      .populate("winner", "name email")
      .lean();
  }

  // Convenience methods for Matches
  public async createMatch(
    data: Omit<Match, "_id" | "createdAt" | "updatedAt">
  ) {
    return this.create<Match>(this.Match, data);
  }

  public async getMatchesByTournament(tournamentId: string) {
    return this.getAll<Match>(this.Match, { tournament: tournamentId });
  }

  // Convenience methods for Admin
  public async createAdmin(
    data: Omit<Admin, "_id" | "createdAt" | "updatedAt">
  ) {
    return this.create<Admin>(this.Admin, data);
  }

  public async findAdminByEmail(email: string) {
    return this.Admin.findOne({ email }).lean();
  }

  // Convenience methods for Groups
  public async createGroup(
    data: Omit<Group, "_id" | "createdAt" | "updatedAt">
  ) {
    return this.create<Group>(this.Group, data);
  }

  public async getGroupsByTournament(tournamentId: string) {
    return this.Group.find({ tournament: tournamentId })
      .populate("tournament", "name status")
      .populate({
        path: "players.player",
        select: "name phoneNumber status",
      })
      .populate({
        path: "standings.player",
        select: "name phoneNumber status",
      })
      .populate({
        path: "matches",
        populate: [
          { path: "player1", select: "name phoneNumber" },
          { path: "player2", select: "name phoneNumber" },
          { path: "winner", select: "name" },
        ],
      })
      .populate("advancingPlayers", "name phoneNumber")
      .lean();
  }

  public async getGroupById(id: string) {
    return this.Group.findById(id)
      .populate("tournament", "name status")
      .populate({
        path: "players.player",
        select: "name phoneNumber status",
      })
      .populate({
        path: "standings.player",
        select: "name phoneNumber status",
      })
      .populate({
        path: "matches",
        populate: [
          { path: "player1", select: "name phoneNumber" },
          { path: "player2", select: "name phoneNumber" },
          { path: "winner", select: "name" },
        ],
      })
      .populate("advancingPlayers", "name phoneNumber")
      .lean();
  }
}

export default DashboardMongoDBService;
