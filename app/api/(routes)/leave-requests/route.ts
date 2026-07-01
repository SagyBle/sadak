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

    const body = await request.json();
    const db = await DashboardMongoDBService.getInstance();

    if (session.role === "COMMANDER" && body.status) {
      if (!body.id || !body.status) {
        return BackendApiService.errorResponse("מזהה בקשה וסטטוס נדרשים", 400);
      }

      const updated = await db.updateLeaveRequestStatus(body.id, body.status, body.notes);
      return BackendApiService.successResponse({ request: updated }, "סטטוס עודכן");
    }

    if (!body.id || !body.action) {
      return BackendApiService.errorResponse("מזהה בקשה ופעולה נדרשים", 400);
    }

    if (body.action === "CANCEL") {
      const cancelled = await db.deletePendingLeaveRequestForUser(body.id, session.userId);
      if (!cancelled) {
        return BackendApiService.errorResponse("לא נמצאה בקשה ממתינה לביטול", 404);
      }
      return BackendApiService.successResponse({ id: body.id }, "הבקשה בוטלה");
    }

    if (body.action === "EDIT") {
      const updated = await db.updatePendingLeaveRequestForUser(body.id, session.userId, {
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        reason: body.reason,
        requestType: body.requestType,
        notes: body.notes,
      } as any);

      if (!updated) {
        return BackendApiService.errorResponse("לא נמצאה בקשה ממתינה לעדכון", 404);
      }
      return BackendApiService.successResponse({ request: updated }, "הבקשה עודכנה");
    }

    return BackendApiService.errorResponse("פעולה לא נתמכת", 400);
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
