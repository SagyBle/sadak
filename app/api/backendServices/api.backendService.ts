import { NextResponse } from "next/server";

interface BackendApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
  status: number;
}

class BackendApiService {
  static async post<T>(endpoint: string, data: any): Promise<BackendApiResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      return {
        success: response.ok,
        data: result.data,
        message: result.message || "Success",
        status: response.status,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        message: "Request failed",
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
      };
    }
  }

  static createNextResponse<T>(apiResponse: BackendApiResponse<T>): NextResponse {
    return NextResponse.json(
      {
        success: apiResponse.success,
        data: apiResponse.data,
        message: apiResponse.message,
        error: apiResponse.error,
      },
      { status: apiResponse.status }
    );
  }

  static handleError(error: any, status = 500): NextResponse {
    console.error("Backend error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status }
    );
  }

  static successResponse<T>(data: T, message = "Success"): NextResponse {
    return NextResponse.json(
      {
        success: true,
        data,
        message,
      },
      { status: 200 }
    );
  }

  static errorResponse(message: string, status = 400): NextResponse {
    return NextResponse.json(
      {
        success: false,
        message,
        error: message,
      },
      { status }
    );
  }
}

export default BackendApiService;

