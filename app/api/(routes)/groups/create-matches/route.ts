import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function POST(request: NextRequest) {
  try {
    const { groupId } = await request.json();

    if (!groupId) {
      return BackendApiService.errorResponse("Group ID is required", 400);
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    // Get group with populated players
    const group = await mongoService.getGroupById(groupId);
    if (!group) {
      return BackendApiService.errorResponse("Group not found", 404);
    }

    // Check if matches already exist
    if (group.matches && group.matches.length > 0) {
      return BackendApiService.errorResponse(
        "Matches already exist for this group",
        400
      );
    }

    const players = group.players;
    if (!players || players.length < 2) {
      return BackendApiService.errorResponse(
        "Group must have at least 2 players",
        400
      );
    }

    // Generate round-robin matches (each player plays every other player once)
    const matchIds: any[] = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const match = await mongoService.createMatch({
          tournament: group.tournament,
          player1: players[i].player._id,
          player2: players[j].player._id,
          player1Score: 0,
          player2Score: 0,
          winner: null,
          textNotes: "",
          image: "",
          status: "SCHEDULED",
          group: groupId,
          round: null,
          roundName: null,
          nextMatchId: null,
          bracketPosition: null,
          gambling: {
            votes: [],
            player1Votes: 0,
            player2Votes: 0,
          },
        });
        matchIds.push(match._id);
      }
    }

    // Update group with match references
    await mongoService.update(mongoService.Group, groupId, {
      matches: matchIds as any,
      status: "IN_PROGRESS",
    });

    // Fetch updated group with populated data
    const updatedGroup = await mongoService.getGroupById(groupId);

    return BackendApiService.successResponse(
      updatedGroup,
      `Successfully created ${matchIds.length} matches`
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
