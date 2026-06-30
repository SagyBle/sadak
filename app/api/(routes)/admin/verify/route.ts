import { NextRequest } from "next/server";
import JWTUtils from "@/app/api/utils/jwt.utils";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function GET(request: NextRequest) {
  try {
    const token = JWTUtils.getTokenFromRequest(request);

    if (!token) {
      return BackendApiService.successResponse(
        { isValid: false },
        "No token provided"
      );
    }

    const payload = await JWTUtils.verifyToken(token);

    if (!payload) {
      return BackendApiService.successResponse(
        { isValid: false },
        "Invalid token"
      );
    }

    return BackendApiService.successResponse(
      {
        isValid: true,
        user: {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
        },
      },
      "Token is valid"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
