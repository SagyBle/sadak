import { NextRequest } from "next/server";
import { Types } from "mongoose";
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
    if (!body.id) {
      return BackendApiService.errorResponse("מזהה משתמש נדרש", 400);
    }

    const db = await DashboardMongoDBService.getInstance();
    const updateData: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      updateData.name = body.name.trim();
    }

    if (body.role !== undefined) {
      if (body.role !== "SOLDIER" && body.role !== "COMMANDER") {
        return BackendApiService.errorResponse("ערך role לא תקין", 400);
      }
      updateData.role = body.role;
    }

    if (body.department !== undefined) {
      if (!Types.ObjectId.isValid(body.department)) {
        return BackendApiService.errorResponse("מזהה מחלקה לא תקין", 400);
      }
      const department = await db.Department.findById(body.department).lean();
      if (!department) {
        return BackendApiService.errorResponse("מחלקה לא נמצאה", 404);
      }
      updateData.department = body.department;
    }

    if (typeof body.password === "string" && body.password.trim()) {
      updateData.password = body.password.trim();
    }

    const updated = await db.updateUserByGod(body.id, updateData as any);
    if (!updated) {
      return BackendApiService.errorResponse("משתמש לא נמצא", 404);
    }

    return BackendApiService.successResponse({ user: updated }, "משתמש עודכן בהצלחה");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (session.role !== "GOD") {
      return BackendApiService.errorResponse("גישה מותרת רק ל-God Mode", 403);
    }

    const body = await request.json();
    if (!body.id) {
      return BackendApiService.errorResponse("מזהה משתמש נדרש", 400);
    }

    const db = await DashboardMongoDBService.getInstance();
    const deleted = await db.softDeleteUserByGod(body.id);
    if (!deleted) {
      return BackendApiService.errorResponse("משתמש לא נמצא", 404);
    }

    return BackendApiService.successResponse({ id: body.id }, "משתמש הוסר בהצלחה");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
