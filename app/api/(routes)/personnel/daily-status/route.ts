import { NextRequest } from "next/server";
import BackendApiService from "@/app/api/backendServices/api.backendService";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import { getSessionUser, requireDepartmentContext } from "@/app/api/utils/auth-session.utils";
import { isUserInEventScope, resolveDailyStatus } from "@/app/lib/hr.logic";

const normalizeDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

export async function GET(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const authError = requireDepartmentContext(session);
    if (authError) return authError;

    const dateParam = request.nextUrl.searchParams.get("date");
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    const db = await DashboardMongoDBService.getInstance();
    const [users, schedules, leaves, overrides] = await Promise.all([
      db.getUsersByDepartment(session.departmentId!),
      db.getDepartmentSchedule(session.departmentId!),
      db.listLeaveRequestsByDepartment(session.departmentId!),
      db.listDailyOverridesByDepartment(session.departmentId!),
    ]);

    const activeEvents = schedules.filter((event: any) => {
      const target = normalizeDay(targetDate);
      return (
        target >= normalizeDay(new Date(event.startDate)) &&
        target <= normalizeDay(new Date(event.endDate))
      );
    });
    const hasActiveSchedule = activeEvents.length > 0;

    const usersById = new Map<string, any>(
      users.map((user: any) => [String(user._id), user])
    );

    const rows = users.map((user: any) => {
      if (!hasActiveSchedule) {
        return {
          id: user._id,
          name: user.name,
          role: user.role,
          bucket: "NOT_ENLISTED" as const,
          isPresent: false,
          statusText: "לא מגוייסים",
          reason: "אין הגדרת לו״ז ליום זה",
          source: "BASELINE" as const,
          isException: false,
        };
      }

      const userId = String(user._id);
      const hasUserScopedEvent = activeEvents.some((event: any) =>
        isUserInEventScope(event, userId)
      );

      if (!hasUserScopedEvent) {
        return {
          id: user._id,
          name: user.name,
          role: user.role,
          bucket: "NOT_ENLISTED" as const,
          isPresent: false,
          statusText: "לא מגוייסים",
          reason: "אין הגדרת לו״ז אישית ליום זה",
          source: "BASELINE" as const,
          isException: false,
        };
      }

      const status = resolveDailyStatus({
        date: targetDate,
        userId,
        events: schedules as any,
        leaves: leaves.filter((item: any) => item.user),
        overrides: overrides.filter((item: any) => item.user),
      });

      const reason =
        status.source === "BASELINE"
          ? status.isPresent
            ? "לפי לו״ז - נוכח"
            : "לפי לו״ז - בית"
          : status.status;

      return {
        id: user._id,
        name: user.name,
        role: user.role,
        bucket: status.isPresent ? ("IN_BASE" as const) : ("HOME" as const),
        isPresent: status.isPresent,
        statusText: status.status,
        reason,
        source: status.source,
        isException: status.source !== "BASELINE",
      };
    });

    const inBase = rows.filter((item) => item.bucket === "IN_BASE");
    const home = rows.filter((item) => item.bucket === "HOME");
    const notEnlisted = rows.filter((item) => item.bucket === "NOT_ENLISTED");

    const pendingLeaveCount = leaves.filter((item: any) => {
      if (!item.user || item.status !== "PENDING") return false;
      const start = normalizeDay(new Date(item.startDate));
      const end = normalizeDay(new Date(item.endDate));
      const target = normalizeDay(targetDate);
      return target >= start && target <= end && usersById.has(String(item.user._id));
    }).length;

    const totalRequired = Math.max(
      ...activeEvents.map((event: any) => event.requiredPersonnelCount),
      0
    );

    return BackendApiService.successResponse({
      date: targetDate.toISOString(),
      summary: {
        totalDepartmentUsers: rows.length,
        inBaseCount: inBase.length,
        homeCount: home.length,
        notEnlistedCount: notEnlisted.length,
        exceptionsCount: rows.filter((item) => item.isException).length,
        pendingLeaveCount,
        totalRequired,
        availableNow: inBase.length,
        hasActiveSchedule,
      },
      inBase,
      home,
      notEnlisted,
    });
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
