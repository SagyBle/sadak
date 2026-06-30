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

    // Get all groups for the tournament
    const groups = await mongoService.getGroupsByTournament(tournamentId);

    // Delete all groups
    for (const group of groups) {
      await mongoService.delete(mongoService.Group, group._id);
    }

    // Update tournament to remove group references
    await mongoService.update(mongoService.Tournament, tournamentId, {
      groups: [],
    });

    return BackendApiService.successResponse(
      { deleted: groups.length },
      `Successfully deleted ${groups.length} groups`
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
