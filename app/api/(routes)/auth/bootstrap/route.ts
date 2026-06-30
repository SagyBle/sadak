import { NextRequest } from "next/server";
import BackendApiService from "@/app/api/backendServices/api.backendService";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import { DEFAULT_PASSWORDS } from "@/app/lib/hr.constants";

export async function POST(request: NextRequest) {
  try {
    const setupKey = request.headers.get("x-setup-key");
    if (!setupKey || setupKey !== process.env.ADMIN_SECRET_TOKEN) {
      return BackendApiService.errorResponse("Unauthorized", 401);
    }

    const db = await DashboardMongoDBService.getInstance();
    const departments = await db.getDepartments();
    if (departments.length > 0) {
      return BackendApiService.successResponse(
        { initialized: true },
        "המערכת כבר מאותחלת"
      );
    }

    const defaultDepartment = await db.createDepartment({ name: "מחלקה א׳" });

    await db.createUser({
      name: "מפקד מחלקה",
      role: "COMMANDER",
      department: defaultDepartment._id as any,
      password: DEFAULT_PASSWORDS.COMMANDER,
      isActive: true,
    });

    await db.createUser({
      name: "חייל לדוגמה",
      role: "SOLDIER",
      department: defaultDepartment._id as any,
      password: DEFAULT_PASSWORDS.SOLDIER,
      isActive: true,
    });

    return BackendApiService.successResponse(
      { initialized: true },
      "נוצרו מחלקה ומשתמשים ראשוניים"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
