import ApiService from "./api.frontendService";
import type { SessionUser } from "../lib/hr.types";

interface UserLoginData {
  userId: string;
  password: string;
}

class AdminFrontendService {
  static async getDepartmentsAndUsers() {
    return ApiService.get<{
      departments: Array<{
        id: string;
        name: string;
        users: Array<{ id: string; name: string; role: string }>;
      }>;
    }>("/auth/users");
  }

  static async login(data: UserLoginData) {
    const response = await ApiService.post<{
      token: string;
      session: SessionUser;
    }>(
      "/auth/login",
      data
    );

    if (response.success && response.data?.token) {
      ApiService.setToken(response.data.token);
    }

    return response;
  }

  static async godLogin(password: string) {
    const response = await ApiService.post<{
      token: string;
      session: SessionUser;
    }>("/auth/god-login", { password });

    if (response.success && response.data?.token) {
      ApiService.setToken(response.data.token);
    }

    return response;
  }

  static async verifyToken() {
    return await ApiService.get<{ isValid: boolean; session?: SessionUser }>(
      "/auth/verify"
    );
  }

  static logout() {
    ApiService.removeToken();
  }

  static isAuthenticated(): boolean {
    return ApiService.getToken() !== null;
  }
}

export default AdminFrontendService;
