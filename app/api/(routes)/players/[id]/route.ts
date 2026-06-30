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
    const player = await mongoService.getById(mongoService.Player, id);

    if (!player) {
      return BackendApiService.errorResponse("Player not found", 404);
    }

    return BackendApiService.successResponse(player, "Player retrieved successfully");
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
    const player = await mongoService.update(mongoService.Player, id, updates);

    if (!player) {
      return BackendApiService.errorResponse("Player not found", 404);
    }

    return BackendApiService.successResponse(player, "Player updated successfully");
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
    const deleted = await mongoService.delete(mongoService.Player, id);

    if (!deleted) {
      return BackendApiService.errorResponse("Player not found", 404);
    }

    return BackendApiService.successResponse({ id }, "Player deleted successfully");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}

