import { NextRequest } from "next/server";
import BackendApiService from "@/app/api/backendServices/api.backendService";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import JWTUtils from "@/app/api/utils/jwt.utils";

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json();
    if (!userId || !password) {
      return BackendApiService.errorResponse("נדרש לבחור משתמש ולהזין סיסמה", 400);
    }

    const db = await DashboardMongoDBService.getInstance();
    const user = await db.getUserById(userId);
    if (!user || !user.isActive) {
      return BackendApiService.errorResponse("משתמש לא נמצא", 404);
    }

    if (user.password !== password) {
      return BackendApiService.errorResponse("סיסמה שגויה", 401);
    }

    const departmentValue = user.department as any;
    const departmentId =
      typeof departmentValue === "object" && departmentValue
        ? departmentValue._id?.toString?.() || ""
        : String(departmentValue || "");

    const { token, expiresIn } = JWTUtils.generateToken({
      userId: user._id.toString(),
      name: user.name,
      role: user.role,
      departmentId,
    });

    return BackendApiService.successResponse(
      {
        token,
        expiresIn,
        session: {
          userId: user._id,
          role: user.role,
          name: user.name,
          departmentId,
        },
      },
      "התחברת בהצלחה"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
