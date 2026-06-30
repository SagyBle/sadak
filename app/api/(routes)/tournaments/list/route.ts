import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublishedParam = searchParams.get("isPublished");
    const status = searchParams.get("status");

    const mongoService = await DashboardMongoDBService.getInstance();

    let query: any = {};

    if (isPublishedParam !== null) {
      query.isPublished = isPublishedParam === "true";
    }

    if (status && ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"].includes(status)) {
      query.status = status;
    }

    const tournaments = await mongoService.getAll(
      mongoService.Tournament,
      query,
      { sort: { startDate: -1 } }
    );

    return BackendApiService.successResponse(tournaments, "Tournaments retrieved successfully");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}

