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
    const match = await mongoService.Match.findById(id)
      .populate("player1", "name email")
      .populate("player2", "name email")
      .populate("winner", "name email")
      .populate("tournament", "name")
      .lean();

    if (!match) {
      return BackendApiService.errorResponse("Match not found", 404);
    }

    return BackendApiService.successResponse(match, "Match retrieved successfully");
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
    const match = await mongoService.update(mongoService.Match, id, updates);

    if (!match) {
      return BackendApiService.errorResponse("Match not found", 404);
    }

    return BackendApiService.successResponse(match, "Match updated successfully");
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
    const match = await mongoService.Match.findById(id);

    if (!match) {
      return BackendApiService.errorResponse("Match not found", 404);
    }

    // Remove match from tournament's matches array
    await mongoService.Tournament.findByIdAndUpdate(match.tournament, {
      $pull: { matches: id },
    });

    const deleted = await mongoService.delete(mongoService.Match, id);

    return BackendApiService.successResponse({ id }, "Match deleted successfully");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}

