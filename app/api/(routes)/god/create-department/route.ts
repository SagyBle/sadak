import { NextRequest } from "next/server";
import BackendApiService from "@/app/api/backendServices/api.backendService";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import { getSessionUser } from "@/app/api/utils/auth-session.utils";
import { DEFAULT_PASSWORDS } from "@/app/lib/hr.constants";

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
    const department = await db.createDepartment({ name: body.departmentName });
    const commander = await db.createUser({
      name: body.commanderName,
      role: "COMMANDER",
      department: department._id as any,
      password: body.commanderPassword || DEFAULT_PASSWORDS.COMMANDER,
      isActive: true,
    });

    return BackendApiService.successResponse(
      { department, commander },
      "מחלקה ומפקד נוצרו בהצלחה"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
