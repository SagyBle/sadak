import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function POST(request: NextRequest) {
  try {
    const { name, phoneNumber, email, status } = await request.json();

    // Validate required fields
    if (!name || !phoneNumber || !email) {
      return BackendApiService.errorResponse("Name, phone number, and email are required", 400);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return BackendApiService.errorResponse("Invalid email format", 400);
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    // Check if player already exists
    const existingPlayer = await mongoService.findPlayerByEmail(email);
    if (existingPlayer) {
      return BackendApiService.errorResponse("Player with this email already exists", 409);
    }

    // Create player
    const player = await mongoService.createPlayer({
      name,
      phoneNumber,
      email,
      tournaments: [],
      status: status || "INACTIVE",
    });

    return BackendApiService.successResponse(player, "Player created successfully");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}

