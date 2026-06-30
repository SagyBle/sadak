import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function POST(request: NextRequest) {
  console.log("sagy10");

  try {
    const { tournamentId, playersPerGroup } = await request.json();

    if (!tournamentId) {
      return BackendApiService.errorResponse("Tournament ID is required", 400);
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    // Get tournament with players
    const tournament = await mongoService.getTournamentById(tournamentId);
    if (!tournament) {
      return BackendApiService.errorResponse("Tournament not found", 404);
    }

    const players = tournament.players;
    if (!players || players.length === 0) {
      return BackendApiService.errorResponse(
        "Tournament has no registered players",
        400
      );
    }

    const playersPerGroupCount = playersPerGroup || 4;
    const totalPlayers = players.length;

    // Calculate number of groups and distribute evenly
    const numberOfGroups = Math.ceil(totalPlayers / playersPerGroupCount);
    const basePlayersPerGroup = Math.floor(totalPlayers / numberOfGroups);
    const groupsWithExtraPlayer = totalPlayers % numberOfGroups;

    // Shuffle players randomly
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

    // Create groups
    const createdGroups = [];
    let playerIndex = 0;

    for (let i = 0; i < numberOfGroups; i++) {
      const groupName = String.fromCharCode(65 + i); // A, B, C...
      const playersInThisGroup =
        i < groupsWithExtraPlayer
          ? basePlayersPerGroup + 1
          : basePlayersPerGroup;

      const groupPlayers = [];
      for (let j = 0; j < playersInThisGroup; j++) {
        if (playerIndex < totalPlayers) {
          groupPlayers.push({
            player: shuffledPlayers[playerIndex]._id,
            points: 0,
            wins: 0,
            losses: 0,
            pointDifference: 0,
            matchesPlayed: 0,
          });
          playerIndex++;
        }
      }

      const group = await mongoService.createGroup({
        tournament: tournamentId,
        name: `Group ${groupName}`,
        players: groupPlayers,
        matches: [],
        standings: groupPlayers,
        advancingPlayers: [],
        numberOfAdvancingPlayers: 1,
        status: "NOT_STARTED",
        metadata: {},
      });

      createdGroups.push(group);
    }

    // Update tournament with group references
    const groupIds = createdGroups.map((g: any) => g._id);
    await mongoService.update(mongoService.Tournament, tournamentId, {
      groups: groupIds,
    });

    // Fetch groups with populated player data
    const populatedGroups = await mongoService.getGroupsByTournament(
      tournamentId
    );

    return BackendApiService.successResponse(
      populatedGroups,
      `Successfully created ${numberOfGroups} groups`
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
