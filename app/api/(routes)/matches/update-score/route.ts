import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function PUT(request: NextRequest) {
  try {
    const { matchId, player1Score, player2Score } = await request.json();

    if (!matchId) {
      return BackendApiService.errorResponse("Match ID is required", 400);
    }

    if (player1Score === undefined || player2Score === undefined) {
      return BackendApiService.errorResponse("Both scores are required", 400);
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    // Get the match
    const match = await mongoService.Match.findById(matchId)
      .populate("player1", "name")
      .populate("player2", "name")
      .lean();

    if (!match) {
      return BackendApiService.errorResponse("Match not found", 404);
    }

    // Determine winner based on scores
    let winner = null;
    let status = "COMPLETED";

    if (player1Score > player2Score) {
      winner = match.player1?._id || null;
    } else if (player2Score > player1Score) {
      winner = match.player2?._id || null;
    } else {
      // Tie - match not completed
      status = "IN_PROGRESS";
    }

    // Update match
    const updatedMatch = await mongoService.Match.findByIdAndUpdate(
      matchId,
      {
        player1Score,
        player2Score,
        winner,
        status,
      },
      { new: true }
    )
      .populate("player1", "name phoneNumber")
      .populate("player2", "name phoneNumber")
      .populate("winner", "name")
      .lean();

    if (!updatedMatch) {
      return BackendApiService.errorResponse(
        "Match not found after update",
        404
      );
    }

    // If this is a group match, recalculate group standings
    if (updatedMatch.group) {
      await recalculateGroupStandings(
        mongoService,
        updatedMatch.group.toString()
      );
    }

    return BackendApiService.successResponse(
      updatedMatch,
      "Match score updated successfully"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}

async function recalculateGroupStandings(mongoService: any, groupId: string) {
  // Get the group with all matches
  const group = await mongoService.Group.findById(groupId)
    .populate({
      path: "matches",
      populate: [
        { path: "player1", select: "name" },
        { path: "player2", select: "name" },
        { path: "winner", select: "name" },
      ],
    })
    .lean();

  if (!group) return;

  // Initialize standings for each player
  const standings: any = {};
  group.players.forEach((playerData: any) => {
    const playerId = playerData.player.toString();
    standings[playerId] = {
      player: playerData.player,
      points: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDifference: 0,
      matchesPlayed: 0,
    };
  });

  // Calculate stats from completed matches
  group.matches.forEach((match: any) => {
    if (match.status === "COMPLETED" && match.player1 && match.player2) {
      const player1Id = match.player1._id.toString();
      const player2Id = match.player2._id.toString();

      if (standings[player1Id] && standings[player2Id]) {
        // Update matches played
        standings[player1Id].matchesPlayed++;
        standings[player2Id].matchesPlayed++;

        // Update points scored/conceded
        standings[player1Id].pointsFor += match.player1Score || 0;
        standings[player1Id].pointsAgainst += match.player2Score || 0;
        standings[player2Id].pointsFor += match.player2Score || 0;
        standings[player2Id].pointsAgainst += match.player1Score || 0;

        // Determine winner and update wins/losses/points
        if (match.winner) {
          const winnerId = match.winner._id.toString();
          if (winnerId === player1Id) {
            standings[player1Id].wins++;
            standings[player1Id].points++;
            standings[player2Id].losses++;
          } else if (winnerId === player2Id) {
            standings[player2Id].wins++;
            standings[player2Id].points++;
            standings[player1Id].losses++;
          }
        }
      }
    }
  });

  // Calculate point differences and prepare standings array
  const standingsArray = Object.values(standings).map((playerStats: any) => {
    playerStats.pointDifference =
      playerStats.pointsFor - playerStats.pointsAgainst;
    return playerStats;
  });

  // Sort by points (descending), then by point difference (descending)
  standingsArray.sort((a: any, b: any) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return b.pointDifference - a.pointDifference;
  });

  // Update the group with new standings
  await mongoService.Group.findByIdAndUpdate(groupId, {
    standings: standingsArray,
  });
}
