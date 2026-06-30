import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function POST(request: NextRequest) {
  try {
    const { tournamentId, player1Id, player2Id, round, roundName } =
      await request.json();

    if (!tournamentId || !player1Id || !player2Id || !round || !roundName) {
      return BackendApiService.errorResponse(
        "Tournament ID, both players, round, and round name are required",
        400
      );
    }

    if (player1Id === player2Id) {
      return BackendApiService.errorResponse(
        "Cannot create a match with the same player",
        400
      );
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    // Verify tournament exists
    const tournament = await mongoService.getTournamentById(tournamentId);
    if (!tournament) {
      return BackendApiService.errorResponse("Tournament not found", 404);
    }

    // Verify both players exist in the tournament
    const player1Exists = tournament.players.some(
      (p: any) => p._id.toString() === player1Id
    );
    const player2Exists = tournament.players.some(
      (p: any) => p._id.toString() === player2Id
    );

    if (!player1Exists || !player2Exists) {
      return BackendApiService.errorResponse(
        "One or both players not found in tournament",
        400
      );
    }

    // Check if either player is already in a non-cancelled match in this round
    const existingMatches = await mongoService.Match.find({
      tournament: tournamentId,
      round: round,
      status: { $ne: "CANCELLED" }, // Exclude cancelled matches
      $or: [
        { player1: player1Id },
        { player2: player1Id },
        { player1: player2Id },
        { player2: player2Id },
      ],
    });

    if (existingMatches.length > 0) {
      return BackendApiService.errorResponse(
        "One or both players are already in a match in this round",
        400
      );
    }

    // Get the highest bracket position in this round to place the new match at the end
    const roundMatches = await mongoService.Match.find({
      tournament: tournamentId,
      round: round,
    }).sort({ bracketPosition: -1 });

    const nextBracketPosition =
      roundMatches.length > 0 ? roundMatches[0]?.bracketPosition ?? 0 + 1 : 0;

    // Create the match
    const match = await mongoService.createMatch({
      tournament: tournamentId,
      player1: player1Id,
      player2: player2Id,
      player1Score: 0,
      player2Score: 0,
      winner: null,
      status: "SCHEDULED",
      group: null,
      textNotes: "",
      image: "",
      round,
      roundName,
      nextMatchId: null,
      bracketPosition: nextBracketPosition,
      gambling: {
        votes: [],
        player1Votes: 0,
        player2Votes: 0,
      },
    } as any);

    const populatedMatch = await mongoService.Match.findById(match._id)
      .populate("player1", "name phoneNumber")
      .populate("player2", "name phoneNumber")
      .lean();

    return BackendApiService.successResponse(
      populatedMatch,
      "Match created successfully"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
