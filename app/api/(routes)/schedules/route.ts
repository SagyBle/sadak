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
    const schedules = await db.getDepartmentSchedule(session.departmentId!);
    return BackendApiService.successResponse({ schedules });
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
      return BackendApiService.errorResponse("רק מפקדים יכולים ליצור אירוע לו״ז", 403);
    }

    const body = await request.json();
    const created = await (await DashboardMongoDBService.getInstance()).createScheduleEvent({
      department: session.departmentId as any,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      activityType: body.activityType,
      requiredPersonnelCount: Number(body.requiredPersonnelCount ?? 0),
      scope: body.scope || "ALL_DEPARTMENT",
      selectedUsers: body.scope === "SPECIFIC_USERS" ? body.selectedUsers || [] : [],
      notes: body.notes || "",
    });

    return BackendApiService.successResponse({ schedule: created }, "אירוע לו״ז נוצר");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
