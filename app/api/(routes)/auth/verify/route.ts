import { NextRequest } from "next/server";
import BackendApiService from "@/app/api/backendServices/api.backendService";
import JWTUtils from "@/app/api/utils/jwt.utils";

export async function GET(request: NextRequest) {
  try {
    const token = JWTUtils.getTokenFromRequest(request);
    if (!token) {
      return BackendApiService.successResponse({ isValid: false });
    }

    const payload = await JWTUtils.verifyToken(token);
    if (!payload) {
      return BackendApiService.successResponse({ isValid: false });
    }

    return BackendApiService.successResponse({
      isValid: true,
      session: {
        userId: String(payload.userId || ""),
        role: String(payload.role || "SOLDIER"),
        name: String(payload.name || ""),
        departmentId: payload.departmentId
          ? String(payload.departmentId)
          : undefined,
      },
    });
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
