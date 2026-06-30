import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const mongoService = await DashboardMongoDBService.getInstance();
    const tournament = await mongoService.getTournamentById(id);

    if (!tournament) {
      return BackendApiService.errorResponse("Tournament not found", 404);
    }

    return BackendApiService.successResponse(tournament, "Tournament retrieved successfully");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const mongoService = await DashboardMongoDBService.getInstance();
    const tournament = await mongoService.update(mongoService.Tournament, id, updates);

    if (!tournament) {
      return BackendApiService.errorResponse("Tournament not found", 404);
    }

    return BackendApiService.successResponse(tournament, "Tournament updated successfully");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const mongoService = await DashboardMongoDBService.getInstance();
    const deleted = await mongoService.delete(mongoService.Tournament, id);

    if (!deleted) {
      return BackendApiService.errorResponse("Tournament not found", 404);
    }

    return BackendApiService.successResponse({ id }, "Tournament deleted successfully");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}

