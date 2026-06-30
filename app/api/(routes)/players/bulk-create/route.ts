import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

interface PlayerInput {
  name: string;
  phoneNumber: string;
  email: string;
  status?: "ACTIVE" | "INACTIVE" | "BANNED";
}

export async function POST(request: NextRequest) {
  try {
    const { players } = await request.json();

    // Validate that players is an array
    if (!Array.isArray(players)) {
      return BackendApiService.errorResponse("Players must be an array", 400);
    }

    // Validate that array is not empty
    if (players.length === 0) {
      return BackendApiService.errorResponse(
        "Players array cannot be empty",
        400
      );
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    const results = {
      created: [] as any[],
      failed: [] as { player: PlayerInput; error: string }[],
    };

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Process each player
    for (const playerData of players) {
      try {
        // Validate required fields
        if (!playerData.name || !playerData.phoneNumber || !playerData.email) {
          results.failed.push({
            player: playerData,
            error: "Name, phone number, and email are required",
          });
          continue;
        }

        // Email validation
        if (!emailRegex.test(playerData.email)) {
          results.failed.push({
            player: playerData,
            error: "Invalid email format",
          });
          continue;
        }

        // Check if player already exists
        const existingPlayer = await mongoService.findPlayerByEmail(
          playerData.email
        );
        if (existingPlayer) {
          results.failed.push({
            player: playerData,
            error: "Player with this email already exists",
          });
          continue;
        }

        // Create player
        const player = await mongoService.createPlayer({
          name: playerData.name,
          phoneNumber: playerData.phoneNumber,
          email: playerData.email,
          tournaments: [],
          status: playerData.status || "INACTIVE",
        });

        results.created.push(player);
      } catch (error) {
        results.failed.push({
          player: playerData,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return BackendApiService.successResponse(
      {
        total: players.length,
        created: results.created.length,
        failed: results.failed.length,
        createdPlayers: results.created,
        failedPlayers: results.failed,
      },
      `Bulk creation completed: ${results.created.length} created, ${results.failed.length} failed`
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
