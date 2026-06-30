import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

// Helper function to get round name
function getRoundName(totalRounds: number, currentRound: number): string {
  const roundsFromEnd = totalRounds - currentRound;

  switch (roundsFromEnd) {
    case 0:
      return "Final";
    case 1:
      return "Semi-finals";
    case 2:
      return "Quarter-finals";
    case 3:
      return "Round of 16";
    default:
      return `Round ${currentRound}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tournamentId } = await request.json();

    if (!tournamentId) {
      return BackendApiService.errorResponse("Tournament ID is required", 400);
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    // Get tournament
    const tournament = await mongoService.getTournamentById(tournamentId);
    if (!tournament) {
      return BackendApiService.errorResponse("Tournament not found", 404);
    }

    // Get all matches for this tournament, sorted by round
    const allMatches = await mongoService.Match.find({
      tournament: tournamentId,
      round: { $ne: null },
    })
      .populate("player1", "name phoneNumber")
      .populate("player2", "name phoneNumber")
      .populate("winner", "name phoneNumber")
      .sort({ round: -1 })
      .lean();

    if (allMatches.length === 0) {
      return BackendApiService.errorResponse(
        "No knockout matches found. Please create the bracket first.",
        400
      );
    }

    // Find the highest round number
    const currentRound = allMatches[0]?.round;

    if (!currentRound) {
      return BackendApiService.errorResponse("Invalid match data found.", 400);
    }

    const currentRoundMatches = allMatches.filter(
      (m: any) => m.round === currentRound
    );

    // Check if all matches in current round are completed OR cancelled
    const allCompletedOrCancelled = currentRoundMatches.every(
      (m: any) => m.status === "COMPLETED" || m.status === "CANCELLED"
    );

    if (!allCompletedOrCancelled) {
      return BackendApiService.errorResponse(
        "All matches in the current round must be completed or cancelled before creating the next round",
        400
      );
    }

    // Get winners for the next round (only from completed matches)
    const winners = currentRoundMatches
      .filter((m: any) => m.status === "COMPLETED" && m.winner)
      .map((m: any) => m.winner);

    // Check if we can create another round (need at least 2 winners)
    if (winners.length < 2) {
      return BackendApiService.errorResponse(
        "Need at least 2 winners to create next round",
        400
      );
    }

    // Check if this is already the final
    if (winners.length === 1) {
      return BackendApiService.errorResponse(
        "This is already the final round",
        400
      );
    }

    // Calculate total rounds based on initial bracket size
    const totalPlayers = tournament.players.length;
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalPlayers)));
    const totalRounds = Math.log2(bracketSize);

    const nextRound = currentRound + 1;
    const nextRoundName = getRoundName(totalRounds, nextRound);

    // Create next round matches
    const nextRoundMatches: any[] = [];
    const matchesInNextRound = Math.floor(winners.length / 2);
    let warningMessage = null;

    // Check for odd number of winners
    if (winners.length % 2 !== 0) {
      const playerWithoutOpponent = winners[winners.length - 1];
      warningMessage = `אזהרה: ${playerWithoutOpponent.name} אין לו יריב בסיבוב זה`;
    }

    for (let matchIndex = 0; matchIndex < matchesInNextRound; matchIndex++) {
      const player1Index = matchIndex * 2;
      const player2Index = matchIndex * 2 + 1;

      const player1 =
        player1Index < winners.length ? winners[player1Index]._id : null;
      const player2 =
        player2Index < winners.length ? winners[player2Index]._id : null;

      const match = await mongoService.createMatch({
        tournament: tournamentId,
        player1,
        player2,
        player1Score: 0,
        player2Score: 0,
        winner: null,
        status: "SCHEDULED",
        group: null,
        textNotes: "",
        image: "",
        round: nextRound,
        roundName: nextRoundName,
        nextMatchId: null,
        bracketPosition: matchIndex,
        gambling: {
          votes: [],
          player1Votes: 0,
          player2Votes: 0,
        },
      } as any);

      nextRoundMatches.push(match);
    }

    return BackendApiService.successResponse(
      {
        matches: nextRoundMatches,
        round: nextRound,
        roundName: nextRoundName,
        totalMatches: nextRoundMatches.length,
        warning: warningMessage,
      },
      `Successfully created ${nextRoundName} with ${nextRoundMatches.length} matches`
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
