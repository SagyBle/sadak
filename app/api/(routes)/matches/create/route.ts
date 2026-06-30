import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function POST(request: NextRequest) {
  try {
    const {
      tournament,
      player1,
      player2,
      player1Score,
      player2Score,
      winner,
      textNotes,
      image,
      status,
    } = await request.json();

    // Validate required fields
    if (!tournament || !player1 || !player2) {
      return BackendApiService.errorResponse(
        "Tournament, player1, and player2 are required",
        400
      );
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    // Create match
    const match = await mongoService.createMatch({
      tournament,
      player1,
      player2,
      player1Score: player1Score || 0,
      player2Score: player2Score || 0,
      winner: winner || null,
      textNotes: textNotes || "",
      image: image || "",
      status: status || "SCHEDULED",
      group: null,
      round: null,
      roundName: null,
      nextMatchId: null,
      bracketPosition: null,
      gambling: {
        votes: [],
        player1Votes: 0,
        player2Votes: 0,
      },
    });

    // Add match to tournament's matches array
    await mongoService.Tournament.findByIdAndUpdate(tournament, {
      $push: { matches: match._id },
    });

    return BackendApiService.successResponse(
      match,
      "Match created successfully"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
