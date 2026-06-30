import { NextRequest } from "next/server";
import BackendApiService from "@/app/api/backendServices/api.backendService";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import { getSessionUser } from "@/app/api/utils/auth-session.utils";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (session.role !== "GOD") {
      return BackendApiService.errorResponse("גישה מותרת רק ל-God Mode", 403);
    }

    const db = await DashboardMongoDBService.getInstance();
    const [departments, users] = await Promise.all([
      db.getDepartments(),
      db.getAllUsers(),
    ]);

    return BackendApiService.successResponse({ departments, users });
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
