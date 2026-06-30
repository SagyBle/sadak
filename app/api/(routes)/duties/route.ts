import { NextRequest } from "next/server";
import BackendApiService from "@/app/api/backendServices/api.backendService";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import { getSessionUser, requireDepartmentContext } from "@/app/api/utils/auth-session.utils";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const authError = requireDepartmentContext(session);
    if (authError) return authError;

    const db = await DashboardMongoDBService.getInstance();
    const logs = await db.listDutyLogsByDepartment(session.departmentId!);
    const filtered = logs.filter((item: any) => item.user);
    return BackendApiService.successResponse({ logs: filtered });
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const authError = requireDepartmentContext(session);
    if (authError) return authError;
    if (session.role !== "COMMANDER") {
      return BackendApiService.errorResponse("רק מפקדים יכולים לרשום תורנות", 403);
    }

    const body = await request.json();
    const created = await (await DashboardMongoDBService.getInstance()).createDutyLog({
      user: body.userId,
      date: new Date(body.date),
      dutyType: body.dutyType,
      notes: body.notes || "",
    });

    return BackendApiService.successResponse({ duty: created }, "תורנות נרשמה");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
