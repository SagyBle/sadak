import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function DELETE(request: NextRequest) {
  try {
    const { tournamentId } = await request.json();

    if (!tournamentId) {
      return BackendApiService.errorResponse("Tournament ID is required", 400);
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    // Delete all knockout matches
    const result = await mongoService.Match.deleteMany({
      tournament: tournamentId,
      round: { $ne: null },
    });

    return BackendApiService.successResponse(
      { deleted: result.deletedCount },
      `Successfully deleted ${result.deletedCount} knockout matches`
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
