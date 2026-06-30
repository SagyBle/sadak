import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      description,
      startDate,
      endOfRegistration,
      format,
      maxPlayers,
      location,
      prizePool,
      isPublished,
      mainImage,
    } = await request.json();

    // Validate required fields
    if (!name || !description || !startDate || !endOfRegistration || !format) {
      return BackendApiService.errorResponse(
        "Name, description, startDate, endOfRegistration, and format are required",
        400
      );
    }

    // Validate format
    if (!["league", "knockout", "mixed", "groups"].includes(format)) {
      return BackendApiService.errorResponse("Invalid format", 400);
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    // Create tournament
    const tournament = await mongoService.createTournament({
      name,
      description,
      startDate: new Date(startDate),
      endOfRegistration: new Date(endOfRegistration),
      players: [],
      groups: [],
      matches: [],
      format,
      winner: null,
      mainImage: mainImage || "",
      status: "UPCOMING",
      maxPlayers: maxPlayers || 0,
      location: location || "",
      prizePool: prizePool || "",
      isPublished: isPublished || false,
    });

    return BackendApiService.successResponse(
      tournament,
      "Tournament created successfully"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
