import ApiService from "./api.frontendService";

interface AdminSignupData {
  name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "SUPER_ADMIN";
}

interface AdminLoginData {
  email: string;
  password: string;
}

class AdminFrontendService {
  static async signup(data: AdminSignupData) {
    const response = await ApiService.post("/admin/signup", data);
    return response;
  }

  static async login(data: AdminLoginData) {
    const response = await ApiService.post<{ token: string }>(
      "/admin/login",
      data
    );

    if (response.success && response.data?.token) {
      ApiService.setToken(response.data.token);
    }

    return response;
  }

  static async verifyToken() {
    return await ApiService.get<{ isValid: boolean }>("/admin/verify");
  }

  static logout() {
    ApiService.removeToken();
  }

  static isAuthenticated(): boolean {
    return ApiService.getToken() !== null;
  }
}

export default AdminFrontendService;
