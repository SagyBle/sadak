import ApiService from "./api.frontendService";

class GodFrontendService {
  static getOverview() {
    return ApiService.get<{ departments: any[]; users: any[] }>("/god/overview");
  }

  static createDepartment(payload: {
    departmentName: string;
    commanderName: string;
    commanderPassword?: string;
  }) {
    return ApiService.post<{ department: any; commander: any }>(
      "/god/create-department",
      payload
    );
  }
}

export default GodFrontendService;
