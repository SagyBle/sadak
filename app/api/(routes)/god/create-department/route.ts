import { NextRequest } from "next/server";
import { Types } from "mongoose";
import BackendApiService from "@/app/api/backendServices/api.backendService";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import { getSessionUser } from "@/app/api/utils/auth-session.utils";
import { DEFAULT_PASSWORDS } from "@/app/lib/hr.constants";

const DEFAULT_EMPLOYMENT_START_DATE = "2026-07-02";

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (session.role !== "GOD") {
      return BackendApiService.errorResponse("גישה מותרת רק ל-God Mode", 403);
    }

    const body = await request.json();
    if (!body.departmentName || !body.commanderName) {
      return BackendApiService.errorResponse("נדרשים שם מחלקה ושם מפקד", 400);
    }

    const db = await DashboardMongoDBService.getInstance();
    const employmentStartDate = body.employmentStartDate
      ? new Date(body.employmentStartDate)
      : new Date(DEFAULT_EMPLOYMENT_START_DATE);
    if (Number.isNaN(employmentStartDate.getTime())) {
      return BackendApiService.errorResponse("תאריך תחילת תעסוקה לא תקין", 400);
    }
    const initialOrderEndDate = body.initialOrderEndDate
      ? new Date(body.initialOrderEndDate)
      : new Date();
    if (Number.isNaN(initialOrderEndDate.getTime())) {
      return BackendApiService.errorResponse("תאריך סיום צו לא תקין", 400);
    }
    if (employmentStartDate > initialOrderEndDate) {
      return BackendApiService.errorResponse("תאריך התחלה חייב להיות קטן או שווה לתאריך סיום", 400);
    }
    const initialOrderId = new Types.ObjectId();
    const department = await db.createDepartment({
      name: body.departmentName,
      employmentStartDate,
      orders: [
        {
          _id: initialOrderId,
          label: body.initialOrderLabel || "צו ראשוני",
          startDate: employmentStartDate,
          endDate: initialOrderEndDate,
        },
      ],
      activeOrderId: initialOrderId,
    } as any);
    const refreshedDepartment = await db.ensureDepartmentHasDefaultOrder(
      String(department._id)
    );
    const commander = await db.createUser({
      name: body.commanderName,
      role: "COMMANDER",
      department: department._id as any,
      password: body.commanderPassword || DEFAULT_PASSWORDS.COMMANDER,
      isActive: true,
    });

    return BackendApiService.successResponse(
      { department: refreshedDepartment || department, commander },
      "מחלקה ומפקד נוצרו בהצלחה"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
