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

export async function PATCH(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const authError = requireDepartmentContext(session);
    if (authError) return authError;
    if (session.role !== "COMMANDER") {
      return BackendApiService.errorResponse("רק מפקדים יכולים לערוך אירוע לו״ז", 403);
    }

    const body = await request.json();
    if (!body.id) {
      return BackendApiService.errorResponse("מזהה אירוע נדרש", 400);
    }

    const scope = body.scope || "ALL_DEPARTMENT";
    const updated = await (
      await DashboardMongoDBService.getInstance()
    ).updateScheduleEvent(body.id, session.departmentId!, {
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      activityType: body.activityType,
      requiredPersonnelCount:
        body.requiredPersonnelCount !== undefined
          ? Number(body.requiredPersonnelCount)
          : undefined,
      scope,
      selectedUsers: scope === "SPECIFIC_USERS" ? body.selectedUsers || [] : [],
      notes: body.notes,
    } as any);

    if (!updated) {
      return BackendApiService.errorResponse("אירוע לו״ז לא נמצא", 404);
    }

    return BackendApiService.successResponse({ schedule: updated }, "אירוע לו״ז עודכן");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const authError = requireDepartmentContext(session);
    if (authError) return authError;
    if (session.role !== "COMMANDER") {
      return BackendApiService.errorResponse("רק מפקדים יכולים למחוק אירוע לו״ז", 403);
    }

    const body = await request.json();
    if (!body.id) {
      return BackendApiService.errorResponse("מזהה אירוע נדרש", 400);
    }

    const deleted = await (
      await DashboardMongoDBService.getInstance()
    ).deleteScheduleEvent(body.id, session.departmentId!);

    if (!deleted) {
      return BackendApiService.errorResponse("אירוע לו״ז לא נמצא", 404);
    }

    return BackendApiService.successResponse({ id: body.id }, "אירוע לו״ז נמחק");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
