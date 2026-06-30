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

    const groups = await mongoService.getGroupsByTournament(tournamentId);

    return BackendApiService.successResponse(
      groups,
      "Groups retrieved successfully"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
