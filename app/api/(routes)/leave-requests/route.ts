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
    const requests = await db.listLeaveRequestsByDepartment(session.departmentId!);
    return BackendApiService.successResponse({
      requests: requests.filter((item: any) => item.user),
    });
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const authError = requireDepartmentContext(session);
    if (authError) return authError;

    const body = await request.json();
    const userId = body.userId || session.userId;
    const created = await (await DashboardMongoDBService.getInstance()).createLeaveRequest({
      user: userId,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      reason: body.reason,
      requestType: body.requestType || "LEAVE",
      status: "PENDING",
      notes: body.notes || "",
    });

    return BackendApiService.successResponse({ request: created }, "בקשה נוצרה");
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
      return BackendApiService.errorResponse("רק מפקדים יכולים לאשר/לדחות בקשה", 403);
    }

    const body = await request.json();
    if (!body.id || !body.status) {
      return BackendApiService.errorResponse("מזהה בקשה וסטטוס נדרשים", 400);
    }

    const updated = await (
      await DashboardMongoDBService.getInstance()
    ).updateLeaveRequestStatus(body.id, body.status, body.notes);

    return BackendApiService.successResponse({ request: updated }, "סטטוס עודכן");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
