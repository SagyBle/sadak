import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function PUT(request: NextRequest) {
  try {
    const { matchId } = await request.json();

    if (!matchId) {
      return BackendApiService.errorResponse("Match ID is required", 400);
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    // Get the match
    const match = await mongoService.Match.findById(matchId).lean();

    if (!match) {
      return BackendApiService.errorResponse("Match not found", 404);
    }

    // Reset gambling data
    const updatedMatch = await mongoService.Match.findByIdAndUpdate(
      matchId,
      {
        $set: {
          gambling: {
            votes: [],
            player1Votes: 0,
            player2Votes: 0,
          },
        },
      },
      { new: true }
    )
      .populate("player1", "name phoneNumber")
      .populate("player2", "name phoneNumber")
      .populate("winner", "name")
      .lean();

    return BackendApiService.successResponse(
      updatedMatch,
      "Gambling data reset successfully"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
