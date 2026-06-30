import { NextRequest } from "next/server";
import BackendApiService from "@/app/api/backendServices/api.backendService";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import { getSessionUser, requireDepartmentContext } from "@/app/api/utils/auth-session.utils";

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const authError = requireDepartmentContext(session);
    if (authError) return authError;
    if (session.role !== "COMMANDER") {
      return BackendApiService.errorResponse("רק מפקדים יכולים לקבוע חריג יומי", 403);
    }

    const body = await request.json();
    if (!body.userId || !body.date || !body.statusText) {
      return BackendApiService.errorResponse("userId, date, statusText נדרשים", 400);
    }

    const saved = await (await DashboardMongoDBService.getInstance()).setDailyOverride({
      user: body.userId,
      date: new Date(body.date),
      statusText: body.statusText,
    });

    return BackendApiService.successResponse({ override: saved }, "החריג נשמר");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
