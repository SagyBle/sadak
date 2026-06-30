import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

// Helper function to get round name in English
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

// Helper function to calculate next power of 2
function nextPowerOf2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

export async function POST(request: NextRequest) {
  try {
    const { tournamentId } = await request.json();

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
    if (!players || players.length < 2) {
      return BackendApiService.errorResponse(
        "Tournament must have at least 2 players",
        400
      );
    }

    // Check if knockout bracket already exists
    const existingMatches = await mongoService.Match.find({
      tournament: tournamentId,
      round: { $ne: null },
    }).lean();

    if (existingMatches.length > 0) {
      return BackendApiService.errorResponse(
        "Knockout bracket already exists for this tournament",
        400
      );
    }

    // Shuffle players randomly
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

    // Calculate bracket size (next power of 2)
    const bracketSize = nextPowerOf2(shuffledPlayers.length);
    const totalRounds = Math.log2(bracketSize);

    // Only create FIRST ROUND matches
    const round = 1;
    const matchesInRound = Math.floor(shuffledPlayers.length / 2);
    const roundName = getRoundName(totalRounds, round);

    const allMatches: any[] = [];

    // Create first round matches only
    for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
      const player1Index = matchIndex * 2;
      const player2Index = matchIndex * 2 + 1;

      const player1 =
        player1Index < shuffledPlayers.length
          ? shuffledPlayers[player1Index]._id
          : null;
      const player2 =
        player2Index < shuffledPlayers.length
          ? shuffledPlayers[player2Index]._id
          : null;

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
        round,
        roundName,
        nextMatchId: null,
        bracketPosition: matchIndex,
        gambling: {
          votes: [],
          player1Votes: 0,
          player2Votes: 0,
        },
      } as any);

      allMatches.push(match);
    }

    return BackendApiService.successResponse(
      {
        matches: allMatches,
        round: 1,
        totalMatches: allMatches.length,
        playersCount: shuffledPlayers.length,
        totalRounds,
      },
      `Successfully created ${allMatches.length} first round matches`
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
