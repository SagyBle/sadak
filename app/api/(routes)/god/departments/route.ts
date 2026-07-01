import { NextRequest } from "next/server";
import BackendApiService from "@/app/api/backendServices/api.backendService";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import { getSessionUser } from "@/app/api/utils/auth-session.utils";

export async function PATCH(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (session.role !== "GOD") {
      return BackendApiService.errorResponse("גישה מותרת רק ל-God Mode", 403);
    }

    const body = await request.json();
    if (!body.id || !body.action) {
      return BackendApiService.errorResponse("מזהה מחלקה ופעולה נדרשים", 400);
    }

    const db = await DashboardMongoDBService.getInstance();
    const department = await db.ensureDepartmentHasDefaultOrder(body.id);
    if (!department) {
      return BackendApiService.errorResponse("מחלקה לא נמצאה", 404);
    }

    const parseDateOrError = (value: string, label: string) => {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(label);
      }
      return parsed;
    };

    if (body.action === "SET_ACTIVE_ORDER") {
      if (!body.orderId) {
        return BackendApiService.errorResponse("מזהה צו נדרש", 400);
      }
      const updated = await db.setActiveDepartmentOrder(body.id, body.orderId);
      if (!updated) {
        return BackendApiService.errorResponse("צו לא נמצא במחלקה", 404);
      }
      return BackendApiService.successResponse({ department: updated }, "צו פעיל עודכן");
    }

    if (body.action === "ADD_ORDER") {
      if (!body.label || !body.startDate || !body.endDate) {
        return BackendApiService.errorResponse("שם צו, תאריך התחלה ותאריך סיום נדרשים", 400);
      }
      let startDate: Date;
      let endDate: Date;
      try {
        startDate = parseDateOrError(body.startDate, "תאריך התחלה לא תקין");
        endDate = parseDateOrError(body.endDate, "תאריך סיום לא תקין");
      } catch (error) {
        return BackendApiService.errorResponse(
          error instanceof Error ? error.message : "תאריך לא תקין",
          400
        );
      }
      if (startDate > endDate) {
        return BackendApiService.errorResponse("תאריך התחלה חייב להיות קטן או שווה לתאריך סיום", 400);
      }
      const updated = await db.addDepartmentOrder(body.id, {
        label: body.label,
        startDate,
        endDate,
      });
      if (!updated) {
        return BackendApiService.errorResponse("מחלקה לא נמצאה", 404);
      }
      return BackendApiService.successResponse({ department: updated }, "צו נוסף");
    }

    if (body.action === "EDIT_ORDER") {
      if (!body.orderId) {
        return BackendApiService.errorResponse("מזהה צו נדרש", 400);
      }
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      try {
        startDate = body.startDate
          ? parseDateOrError(body.startDate, "תאריך התחלה לא תקין")
          : undefined;
        endDate = body.endDate
          ? parseDateOrError(body.endDate, "תאריך סיום לא תקין")
          : undefined;
      } catch (error) {
        return BackendApiService.errorResponse(
          error instanceof Error ? error.message : "תאריך לא תקין",
          400
        );
      }
      if (startDate && endDate && startDate > endDate) {
        return BackendApiService.errorResponse("תאריך התחלה חייב להיות קטן או שווה לתאריך סיום", 400);
      }
      const updated = await db.updateDepartmentOrder(body.id, body.orderId, {
        label: body.label,
        startDate,
        endDate,
      });
      if (!updated) {
        return BackendApiService.errorResponse("צו לא נמצא במחלקה", 404);
      }
      return BackendApiService.successResponse({ department: updated }, "צו עודכן");
    }

    if (body.action === "DELETE_ORDER") {
      if (!body.orderId) {
        return BackendApiService.errorResponse("מזהה צו נדרש", 400);
      }
      const updated = await db.deleteDepartmentOrder(body.id, body.orderId);
      if (!updated) {
        return BackendApiService.errorResponse("צו לא נמצא במחלקה", 404);
      }
      return BackendApiService.successResponse({ department: updated }, "צו נמחק");
    }

    return BackendApiService.errorResponse("פעולה לא נתמכת", 400);
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
