import ApiService from "./api.frontendService";

interface CreateGroupsData {
  tournamentId: string;
  playersPerGroup?: number;
}

interface DeleteGroupsData {
  tournamentId: string;
}

class GroupFrontendService {
  static async createGroups(data: CreateGroupsData) {
    return await ApiService.post("/groups/create", data);
  }

  static async getGroupsByTournament(tournamentId: string) {
    return await ApiService.get(`/groups/list?tournamentId=${tournamentId}`);
  }

  static async deleteGroups(tournamentId: string) {
    return await ApiService.delete("/groups/delete", { tournamentId });
  }

  static async createMatches(groupId: string) {
    return await ApiService.post("/groups/create-matches", { groupId });
  }
}

export default GroupFrontendService;
