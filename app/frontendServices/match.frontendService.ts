import ApiService from "./api.frontendService";

interface UpdateScoreData {
  matchId: string;
  player1Score: number;
  player2Score: number;
}

interface CreateCustomMatchData {
  tournamentId: string;
  player1Id: string;
  player2Id: string;
  round: number;
  roundName: string;
}

interface ToggleCancelledData {
  matchId: string;
  cancelled: boolean;
}

interface VoteData {
  matchId: string;
  sessionId: string;
  votedFor: "player1" | "player2";
}

interface ResetGamblingData {
  matchId: string;
}

class MatchFrontendService {
  static async updateScore(data: UpdateScoreData) {
    return await ApiService.put("/matches/update-score", data);
  }

  static async createCustomMatch(data: CreateCustomMatchData) {
    return await ApiService.post("/matches/create-custom", data);
  }

  static async toggleCancelled(data: ToggleCancelledData) {
    return await ApiService.put("/matches/toggle-cancelled", data);
  }

  static async vote(data: VoteData) {
    return await ApiService.post("/matches/vote", data);
  }

  static async resetGambling(data: ResetGamblingData) {
    return await ApiService.put("/matches/reset-gambling", data);
  }
}

export default MatchFrontendService;
