import { NextRequest } from "next/server";
import BackendApiService from "@/app/api/backendServices/api.backendService";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import { getSessionUser, requireDepartmentContext } from "@/app/api/utils/auth-session.utils";
import { resolveDailyStatus } from "@/app/lib/hr.logic";

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

    const resolved = users.map((user: any) =>
      resolveDailyStatus({
        date: targetDate,
        userId: user._id.toString(),
        events: schedules as any,
        leaves: leaves.filter((item: any) => item.user),
        overrides: overrides.filter((item: any) => item.user),
      })
    );

    const requestsForDate = leaves.filter((item: any) => {
      if (!item.user) return false;
      const start = normalizeDay(new Date(item.startDate));
      const end = normalizeDay(new Date(item.endDate));
      const target = normalizeDay(targetDate);
      return target >= start && target <= end;
    });

    const summary = {
      totalRequired: Math.max(
        ...schedules
          .filter((event: any) => {
            const target = normalizeDay(targetDate);
            return (
              target >= normalizeDay(new Date(event.startDate)) &&
              target <= normalizeDay(new Date(event.endDate))
            );
          })
          .map((event: any) => event.requiredPersonnelCount),
        0
      ),
      totalPresent: resolved.filter((status) => status.isPresent).length,
      totalAbsentHome: resolved.filter((status) => !status.isPresent).length,
      returningToday: requestsForDate.filter(
        (item: any) =>
          normalizeDay(new Date(item.endDate)) === normalizeDay(targetDate)
      ).length,
      leavingToday: requestsForDate.filter(
        (item: any) =>
          normalizeDay(new Date(item.startDate)) === normalizeDay(targetDate)
      ).length,
    };

    return BackendApiService.successResponse({ summary });
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
