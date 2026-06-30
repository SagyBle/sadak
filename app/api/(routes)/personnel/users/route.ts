import { NextRequest } from "next/server";
import BackendApiService from "@/app/api/backendServices/api.backendService";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import { getSessionUser, requireDepartmentContext } from "@/app/api/utils/auth-session.utils";
import { DEFAULT_PASSWORDS } from "@/app/lib/hr.constants";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const authError = requireDepartmentContext(session);
    if (authError) return authError;

    const users = await (
      await DashboardMongoDBService.getInstance()
    ).getUsersByDepartment(session.departmentId!);
    return BackendApiService.successResponse({ users });
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
      return BackendApiService.errorResponse("רק מפקדים יכולים להוסיף משתמשים", 403);
    }

    const body = await request.json();
    if (!body.name || !body.role) {
      return BackendApiService.errorResponse("name ו-role נדרשים", 400);
    }

    const defaultPassword =
      body.role === "COMMANDER"
        ? DEFAULT_PASSWORDS.COMMANDER
        : DEFAULT_PASSWORDS.SOLDIER;
    const user = await (await DashboardMongoDBService.getInstance()).createUser({
      name: body.name,
      role: body.role,
      department: session.departmentId as any,
      password: body.password || defaultPassword,
      isActive: true,
    });

    return BackendApiService.successResponse({ user }, "משתמש נוסף בהצלחה");
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
