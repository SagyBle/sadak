import ApiService from "./api.frontendService";

interface CreateBracketData {
  tournamentId: string;
}

interface CreateNextRoundData {
  tournamentId: string;
}

class KnockoutFrontendService {
  static async createBracket(data: CreateBracketData) {
    return await ApiService.post("/knockout/create-bracket", data);
  }

  static async createNextRound(data: CreateNextRoundData) {
    return await ApiService.post("/knockout/create-next-round", data);
  }

  static async getKnockoutMatches(tournamentId: string) {
    return await ApiService.get(`/knockout/list?tournamentId=${tournamentId}`);
  }

  static async deleteKnockout(tournamentId: string) {
    return await ApiService.delete("/knockout/delete", { tournamentId });
  }
}

export default KnockoutFrontendService;
