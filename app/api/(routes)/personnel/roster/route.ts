import { NextRequest } from "next/server";
import BackendApiService from "@/app/api/backendServices/api.backendService";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import { getSessionUser, requireDepartmentContext } from "@/app/api/utils/auth-session.utils";
import { iterateDateRange, resolveDailyStatus } from "@/app/lib/hr.logic";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const authError = requireDepartmentContext(session);
    if (authError) return authError;

    const db = await DashboardMongoDBService.getInstance();
    const [users, schedules, leaves, duties, overrides] = await Promise.all([
      db.getUsersByDepartment(session.departmentId!),
      db.getDepartmentSchedule(session.departmentId!),
      db.listLeaveRequestsByDepartment(session.departmentId!),
      db.listDutyLogsByDepartment(session.departmentId!),
      db.listDailyOverridesByDepartment(session.departmentId!),
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthDays = iterateDateRange(monthStart, monthEnd);

    const roster = users.map((user: any) => {
      const userId = user._id.toString();
      const operationalDaysCount = monthDays.filter((date) =>
        resolveDailyStatus({
          date,
          userId,
          events: schedules as any,
          leaves: leaves.filter((item: any) => item.user),
          overrides: overrides.filter((item: any) => item.user),
        }).isOperationalPresent
      ).length;

      const totalDutiesPerformed = duties.filter(
        (entry: any) => entry.user && entry.user._id.toString() === userId
      ).length;

      const todayStatus = resolveDailyStatus({
        date: now,
        userId,
        events: schedules as any,
        leaves: leaves.filter((item: any) => item.user),
        overrides: overrides.filter((item: any) => item.user),
      });

      return {
        id: user._id,
        name: user.name,
        role: user.role,
        operationalDaysCount,
        totalDutiesPerformed,
        todayStatus: todayStatus.status,
      };
    });

    return BackendApiService.successResponse({ roster });
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
