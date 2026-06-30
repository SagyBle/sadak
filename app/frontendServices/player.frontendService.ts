import ApiService from "./api.frontendService";

interface PlayerData {
  name: string;
  phoneNumber: string;
  email: string;
  status?: "ACTIVE" | "INACTIVE" | "BANNED";
}

interface FetchPlayersOptions {
  status?: "ACTIVE" | "INACTIVE" | "BANNED";
  limit?: number;
  skip?: number;
  sortBy?: { [key: string]: 1 | -1 };
}

class PlayerFrontendService {
  static async createPlayer(data: PlayerData) {
    return await ApiService.post("/players/create", data);
  }

  static async getPlayers(status?: "ACTIVE" | "INACTIVE" | "BANNED") {
    const endpoint = status
      ? `/players/list?status=${status}`
      : "/players/list";
    return await ApiService.get(endpoint);
  }

  static async fetchPlayers(options: FetchPlayersOptions = {}) {
    return await ApiService.post("/players/fetch", options);
  }

  static async getPlayerById(id: string) {
    return await ApiService.get(`/players/${id}`);
  }

  static async updatePlayer(id: string, data: Partial<PlayerData>) {
    return await ApiService.put(`/players/${id}`, data);
  }

  static async deletePlayer(id: string) {
    return await ApiService.delete(`/players/${id}`);
  }
}

export default PlayerFrontendService;
