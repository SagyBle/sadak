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
    const filteredLeaves = leaves.filter((item: any) => item.user);
    const filteredOverrides = overrides.filter((item: any) => item.user);

    const resolvedStatuses = hasActiveSchedule
      ? users
          .map((user: any) => {
            const userId = String(user._id);
            const hasUserScopedEvent = activeEvents.some((event: any) =>
              isUserInEventScope(event, userId)
            );
            if (!hasUserScopedEvent) return null;
            return resolveDailyStatus({
              date: targetDate,
              userId,
              events: schedules as any,
              leaves: filteredLeaves,
              overrides: filteredOverrides,
            });
          })
          .filter((status): status is NonNullable<typeof status> => Boolean(status))
      : [];

    const requestsForDate = leaves.filter((item: any) => {
      if (!item.user) return false;
      const start = normalizeDay(new Date(item.startDate));
      const end = normalizeDay(new Date(item.endDate));
      const target = normalizeDay(targetDate);
      return target >= start && target <= end;
    });

    const summary = {
      totalRequired: Math.max(
        ...activeEvents.map((event: any) => event.requiredPersonnelCount),
        0
      ),
      totalPresent: resolvedStatuses.filter((status) => status.isPresent).length,
      totalAbsentHome: resolvedStatuses.filter((status) => !status.isPresent).length,
      returningToday: hasActiveSchedule
        ? requestsForDate.filter(
            (item: any) =>
              normalizeDay(new Date(item.endDate)) === normalizeDay(targetDate)
          ).length
        : 0,
      leavingToday: hasActiveSchedule
        ? requestsForDate.filter(
            (item: any) =>
              normalizeDay(new Date(item.startDate)) === normalizeDay(targetDate)
          ).length
        : 0,
      hasActiveSchedule,
    };

    return BackendApiService.successResponse({ summary });
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
