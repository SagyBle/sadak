interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private static baseUrl = "/api";
  private static readonly tokenKey = "auth-token";
  private static readonly tokenCookieName = "auth-token";

  private static getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const encodedName = `${encodeURIComponent(name)}=`;
    const parts = document.cookie.split("; ");
    const match = parts.find((item) => item.startsWith(encodedName));
    if (!match) return null;
    return decodeURIComponent(match.substring(encodedName.length));
  }

  private static setCookie(name: string, value: string): void {
    if (typeof document === "undefined") return;
    const maxAgeSeconds = 60 * 60 * 3; // 3 hours, aligned with JWT expiration.
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
      value
    )}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
  }

  private static removeCookie(name: string): void {
    if (typeof document === "undefined") return;
    document.cookie = `${encodeURIComponent(
      name
    )}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
  }

  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers,
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: data.data,
        error: data.error,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Request failed",
      };
    }
  }

  static async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: data.data,
        error: data.error,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Request failed",
      };
    }
  }

  static async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: data.data,
        error: data.error,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Request failed",
      };
    }
  }

  static async patch<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: data.data,
        error: data.error,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Request failed",
      };
    }
  }

  static async delete<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const token = this.getToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "DELETE",
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: data.data,
        error: data.error,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Request failed",
      };
    }
  }

  static getToken(): string | null {
    if (typeof window === "undefined") return null;
    const tokenFromStorage = localStorage.getItem(this.tokenKey);
    if (tokenFromStorage) return tokenFromStorage;
    return this.getCookie(this.tokenCookieName);
  }

  static setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.tokenKey, token);
    this.setCookie(this.tokenCookieName, token);
  }

  static removeToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.tokenKey);
    this.removeCookie(this.tokenCookieName);
  }
}

export default ApiService;

