import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get("tournamentId");

    if (!tournamentId) {
      return BackendApiService.errorResponse("Tournament ID is required", 400);
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    // Get all knockout matches for the tournament
    const matches = await mongoService.Match.find({
      tournament: tournamentId,
      round: { $ne: null },
    })
      .populate("player1", "name phoneNumber")
      .populate("player2", "name phoneNumber")
      .populate("winner", "name")
      .sort({ round: 1, bracketPosition: 1 })
      .lean();

    // Group matches by round
    const matchesByRound: any = {};
    matches.forEach((match: any) => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = [];
      }
      matchesByRound[match.round].push(match);
    });

    return BackendApiService.successResponse(
      {
        matches,
        matchesByRound,
        totalMatches: matches.length,
        rounds: Object.keys(matchesByRound).length,
      },
      "Knockout matches retrieved successfully"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
