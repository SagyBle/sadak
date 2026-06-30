import { NextRequest } from "next/server";
import BackendApiService from "../backendServices/api.backendService";
import type { SessionUser } from "@/app/lib/hr.types";

export const getSessionUser = (request: NextRequest): SessionUser => {
  return {
    userId: request.headers.get("x-user-id") || "",
    role: (request.headers.get("x-user-role") as SessionUser["role"]) || "SOLDIER",
    departmentId: request.headers.get("x-department-id") || undefined,
    // Name is resolved from JWT verify response on the client.
    name: "",
  };
};

export const requireDepartmentContext = (session: SessionUser) => {
  if (session.role === "GOD") {
    return BackendApiService.errorResponse("אין הקשר מחלקה למשתמש God Mode", 403);
  }

  if (!session.departmentId) {
    return BackendApiService.errorResponse("חסרה מחלקה במזהה ההתחברות", 401);
  }

  return null;
};
