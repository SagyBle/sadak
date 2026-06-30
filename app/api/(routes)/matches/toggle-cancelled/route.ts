import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function PUT(request: NextRequest) {
  try {
    const { matchId, cancelled } = await request.json();

    if (!matchId || typeof cancelled !== "boolean") {
      return BackendApiService.errorResponse(
        "Match ID and cancelled status are required",
        400
      );
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    // Get the match
    const match = await mongoService.Match.findById(matchId).lean();

    if (!match) {
      return BackendApiService.errorResponse("Match not found", 404);
    }

    // Update match status
    const newStatus = cancelled ? "CANCELLED" : "SCHEDULED";
    const updateData: any = {
      status: newStatus,
    };

    // If cancelling, clear scores and winner
    if (cancelled) {
      updateData.player1Score = 0;
      updateData.player2Score = 0;
      updateData.winner = null;
    }

    const updatedMatch = await mongoService.Match.findByIdAndUpdate(
      matchId,
      updateData,
      { new: true }
    )
      .populate("player1", "name phoneNumber")
      .populate("player2", "name phoneNumber")
      .populate("winner", "name")
      .lean();

    // Check if either player is in next round matches
    let nextRoundWarning = null;
    if (cancelled && match.round) {
      const nextRoundMatches = await mongoService.Match.find({
        tournament: match.tournament,
        round: match.round + 1,
        $or: [
          { player1: match.player1 },
          { player2: match.player1 },
          { player1: match.player2 },
          { player2: match.player2 },
        ],
      }).lean();

      if (nextRoundMatches.length > 0) {
        nextRoundWarning = `אזהרה: אחד מהשחקנים נמצא במשחק בסיבוב הבא`;
      }
    }

    return BackendApiService.successResponse(
      {
        match: updatedMatch,
        warning: nextRoundWarning,
      },
      cancelled ? "Match cancelled successfully" : "Match restored successfully"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
