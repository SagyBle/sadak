import ApiService from "./api.frontendService";

interface TournamentData {
  name: string;
  description: string;
  startDate: string | Date;
  endOfRegistration: string | Date;
  format: "league" | "knockout" | "mixed" | "groups";
  maxPlayers?: number;
  location?: string;
  prizePool?: string;
  isPublished?: boolean;
  mainImage?: string;
}

class TournamentFrontendService {
  static async createTournament(data: TournamentData) {
    return await ApiService.post("/tournaments/create", data);
  }

  static async getTournaments(isPublished?: boolean, status?: string) {
    let endpoint = "/tournaments/list";
    const params: string[] = [];

    if (isPublished !== undefined) {
      params.push(`isPublished=${isPublished}`);
    }

    if (status) {
      params.push(`status=${status}`);
    }

    if (params.length > 0) {
      endpoint += `?${params.join("&")}`;
    }

    return await ApiService.get(endpoint);
  }

  static async getTournamentById(id: string) {
    return await ApiService.get(`/tournaments/${id}`);
  }

  static async updateTournament(id: string, data: Partial<TournamentData>) {
    return await ApiService.put(`/tournaments/${id}`, data);
  }

  static async deleteTournament(id: string) {
    return await ApiService.delete(`/tournaments/${id}`);
  }

  static async addPlayerToTournament(playerId: string, tournamentId: string) {
    return await ApiService.post("/tournaments/add-player", {
      playerId,
      tournamentId,
    });
  }

  static async removePlayerFromTournament(playerId: string, tournamentId: string) {
    return await ApiService.post("/tournaments/remove-player", {
      playerId,
      tournamentId,
    });
  }
}

export default TournamentFrontendService;

