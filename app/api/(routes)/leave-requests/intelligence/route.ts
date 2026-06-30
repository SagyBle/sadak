import { NextRequest } from "next/server";
import BackendApiService from "@/app/api/backendServices/api.backendService";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import { getSessionUser, requireDepartmentContext } from "@/app/api/utils/auth-session.utils";
import { resolveDailyStatus } from "@/app/lib/hr.logic";

const dayValue = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const authError = requireDepartmentContext(session);
    if (authError) return authError;

    const body = await request.json();
    const targetUserId = body.userId;
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    const db = await DashboardMongoDBService.getInstance();
    const [users, schedules, leaves, overrides] = await Promise.all([
      db.getUsersByDepartment(session.departmentId!),
      db.getDepartmentSchedule(session.departmentId!),
      db.listLeaveRequestsByDepartment(session.departmentId!),
      db.listDailyOverridesByDepartment(session.departmentId!),
    ]);

    const days: Array<{
      date: string;
      requiredPersonnel: number;
      availableBeforeApproval: number;
      openOrApprovedRequests: number;
      warning: boolean;
    }> = [];

    for (
      let current = new Date(startDate);
      current <= endDate;
      current.setDate(current.getDate() + 1)
    ) {
      const date = new Date(current);
      const activeEvents = schedules.filter((event: any) => {
        const target = dayValue(date);
        return (
          target >= dayValue(new Date(event.startDate)) &&
          target <= dayValue(new Date(event.endDate))
        );
      });

      const requiredPersonnel = Math.max(
        ...activeEvents.map((event: any) => event.requiredPersonnelCount),
        0
      );

      const availableBeforeApproval = users.filter((user: any) =>
        resolveDailyStatus({
          date,
          userId: user._id.toString(),
          events: schedules as any,
          leaves: leaves.filter((item: any) => item.user),
          overrides: overrides.filter((item: any) => item.user),
        }).isPresent
      ).length;

      const openOrApprovedRequests = leaves.filter((leave: any) => {
        if (!leave.user) return false;
        if (leave.user._id?.toString?.() === targetUserId) return false;
        const target = dayValue(date);
        const inRange =
          target >= dayValue(new Date(leave.startDate)) &&
          target <= dayValue(new Date(leave.endDate));
        return inRange && (leave.status === "PENDING" || leave.status === "APPROVED");
      }).length;

      const warning = availableBeforeApproval - 1 < requiredPersonnel;

      days.push({
        date: date.toISOString(),
        requiredPersonnel,
        availableBeforeApproval,
        openOrApprovedRequests,
        warning,
      });
    }

    return BackendApiService.successResponse({ days });
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
