import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function POST(request: NextRequest) {
  try {
    const { playerId, tournamentId } = await request.json();

    // Validate required fields
    if (!playerId || !tournamentId) {
      return BackendApiService.errorResponse(
        "playerId and tournamentId are required",
        400
      );
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    // Check if player exists
    const player = await mongoService.getById(mongoService.Player, playerId);
    if (!player) {
      return BackendApiService.errorResponse("Player not found", 404);
    }

    // Check if tournament exists
    const tournament = await mongoService.getById(
      mongoService.Tournament,
      tournamentId
    );
    if (!tournament) {
      return BackendApiService.errorResponse("Tournament not found", 404);
    }

    // Check if player is already in the tournament
    const isPlayerInTournament = tournament.players.some(
      (id: any) => id.toString() === playerId
    );
    if (isPlayerInTournament) {
      return BackendApiService.errorResponse(
        "Player is already registered for this tournament",
        400
      );
    }

    // Check if tournament is at max capacity
    if (
      tournament.maxPlayers > 0 &&
      tournament.players.length >= tournament.maxPlayers
    ) {
      return BackendApiService.errorResponse(
        "Tournament has reached maximum capacity",
        400
      );
    }

    // Add player to tournament's players array
    await mongoService.Tournament.findByIdAndUpdate(tournamentId, {
      $push: { players: playerId },
    });

    // Add tournament to player's tournaments array
    await mongoService.Player.findByIdAndUpdate(playerId, {
      $push: { tournaments: tournamentId },
    });

    // Fetch updated tournament and player
    const updatedTournament = await mongoService.getTournamentById(
      tournamentId
    );
    const updatedPlayer = await mongoService.getById(
      mongoService.Player,
      playerId
    );

    return BackendApiService.successResponse(
      {
        tournament: updatedTournament,
        player: updatedPlayer,
      },
      "Player successfully added to tournament"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}

