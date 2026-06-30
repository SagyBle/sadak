import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { status, limit, skip, sortBy } = body;

    const mongoService = await DashboardMongoDBService.getInstance();

    // Build query
    let query: any = {};
    if (status && ["ACTIVE", "INACTIVE", "BANNED"].includes(status)) {
      query.status = status;
    }

    // Build options
    const options: any = {};

    if (limit) {
      options.limit = parseInt(limit);
    }

    if (skip) {
      options.skip = parseInt(skip);
    }

    // Default sort by createdAt descending
    options.sort = sortBy || { createdAt: -1 };

    // Fetch players
    const players = await mongoService.getAll(
      mongoService.Player,
      query,
      options
    );

    // Get total count
    const total = await mongoService.count(mongoService.Player, query);

    return BackendApiService.successResponse(
      {
        players,
        total,
        count: players.length,
      },
      "Players retrieved successfully"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
