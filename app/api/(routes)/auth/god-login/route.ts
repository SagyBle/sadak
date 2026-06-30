import { NextRequest } from "next/server";
import BackendApiService from "@/app/api/backendServices/api.backendService";
import JWTUtils from "@/app/api/utils/jwt.utils";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const masterPassword = process.env.GOD_MODE_PASSWORD || "GodMode!2026";

    if (!password) {
      return BackendApiService.errorResponse("נדרשת סיסמת God Mode", 400);
    }

    if (password !== masterPassword) {
      return BackendApiService.errorResponse("סיסמה שגויה", 401);
    }

    const { token, expiresIn } = JWTUtils.generateToken({
      userId: "god-mode",
      name: "God Mode",
      role: "GOD",
    });

    return BackendApiService.successResponse({
      token,
      expiresIn,
      session: { userId: "god-mode", role: "GOD", name: "God Mode" },
    });
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
