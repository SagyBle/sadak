import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function POST(request: NextRequest) {
  try {
    const { matchId, sessionId, votedFor } = await request.json();

    if (!matchId || !sessionId || !votedFor) {
      return BackendApiService.errorResponse(
        "Match ID, session ID, and votedFor are required",
        400
      );
    }

    if (votedFor !== "player1" && votedFor !== "player2") {
      return BackendApiService.errorResponse(
        "votedFor must be 'player1' or 'player2'",
        400
      );
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    // Get the match
    const match = await mongoService.Match.findById(matchId).lean();

    if (!match) {
      return BackendApiService.errorResponse("Match not found", 404);
    }

    // Check if voting is allowed (only SCHEDULED status allows voting/changing votes)
    if (match.status !== "SCHEDULED") {
      return BackendApiService.errorResponse(
        "Voting is only allowed for scheduled matches",
        400
      );
    }

    // Initialize gambling if not exists
    if (!match.gambling) {
      match.gambling = { votes: [], player1Votes: 0, player2Votes: 0 };
    }

    // Check if user already voted
    const existingVoteIndex = match.gambling.votes.findIndex(
      (v: any) => v.sessionId === sessionId
    );

    let updateQuery: any;

    if (existingVoteIndex !== -1) {
      // User is changing their vote
      const oldVote = match.gambling.votes[existingVoteIndex].votedFor;

      // Decrement old vote count
      const decrementField =
        oldVote === "player1"
          ? "gambling.player1Votes"
          : "gambling.player2Votes";

      // Increment new vote count
      const incrementField =
        votedFor === "player1"
          ? "gambling.player1Votes"
          : "gambling.player2Votes";

      updateQuery = {
        $set: {
          [`gambling.votes.${existingVoteIndex}.votedFor`]: votedFor,
          [`gambling.votes.${existingVoteIndex}.timestamp`]: new Date(),
        },
        $inc: {
          [decrementField]: -1,
          [incrementField]: 1,
        },
      };
    } else {
      // New vote
      const incrementField =
        votedFor === "player1"
          ? "gambling.player1Votes"
          : "gambling.player2Votes";

      updateQuery = {
        $push: {
          "gambling.votes": {
            sessionId,
            votedFor,
            timestamp: new Date(),
          },
        },
        $inc: {
          [incrementField]: 1,
        },
      };
    }

    const updatedMatch = await mongoService.Match.findByIdAndUpdate(
      matchId,
      updateQuery,
      { new: true }
    )
      .populate("player1", "name phoneNumber")
      .populate("player2", "name phoneNumber")
      .populate("winner", "name")
      .lean();

    return BackendApiService.successResponse(
      updatedMatch,
      "Vote recorded successfully"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
