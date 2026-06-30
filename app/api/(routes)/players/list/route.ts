import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const mongoService = await DashboardMongoDBService.getInstance();

    let players;
    if (status && ["ACTIVE", "INACTIVE", "BANNED"].includes(status)) {
      players = await mongoService.getPlayersByStatus(status as any);
    } else {
      players = await mongoService.getAll(mongoService.Player, {}, { sort: { createdAt: -1 } });
    }

    return BackendApiService.successResponse(players, "Players retrieved successfully");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}

