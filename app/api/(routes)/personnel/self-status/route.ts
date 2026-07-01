import { NextRequest } from "next/server";
import BackendApiService from "@/app/api/backendServices/api.backendService";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import { getSessionUser, requireDepartmentContext } from "@/app/api/utils/auth-session.utils";
import { isUserInEventScope, iterateDateRange, resolveDailyStatus } from "@/app/lib/hr.logic";

const normalizeDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

const parseMonthInput = (monthInput: string | null, fallbackDate: Date) => {
  if (!monthInput) {
    return new Date(fallbackDate.getFullYear(), fallbackDate.getMonth(), 1);
  }
  const [year, month] = monthInput.split("-").map(Number);
  if (!year || !month) {
    return new Date(fallbackDate.getFullYear(), fallbackDate.getMonth(), 1);
  }
  return new Date(year, month - 1, 1);
};

export async function GET(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const authError = requireDepartmentContext(session);
    if (authError) return authError;
    const targetUserId = request.nextUrl.searchParams.get("userId") || session.userId;

    if (targetUserId !== session.userId && session.role !== "COMMANDER") {
      return BackendApiService.errorResponse(
        "רק מפקד יכול לצפות בנתונים של משתמש אחר",
        403
      );
    }

    const summaryDateParam = request.nextUrl.searchParams.get("date");
    const summaryDate = summaryDateParam ? new Date(summaryDateParam) : new Date();
    const monthStart = parseMonthInput(
      request.nextUrl.searchParams.get("month"),
      summaryDate
    );
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    const db = await DashboardMongoDBService.getInstance();
    const [user, schedules, leaves, overrides, duties] = await Promise.all([
      db.getUserById(targetUserId),
      db.getDepartmentSchedule(session.departmentId!),
      db.listLeaveRequestsByUser(targetUserId),
      db.listDailyOverridesByDepartment(session.departmentId!),
      db.listDutyLogsByUser(targetUserId),
    ]);
    const department = await db.ensureDepartmentHasDefaultOrder(session.departmentId!);

    if (
      !user ||
      String((user as any).department?._id || (user as any).department) !== session.departmentId
    ) {
      return BackendApiService.errorResponse("משתמש לא נמצא במחלקה", 404);
    }
    if (!department) {
      return BackendApiService.errorResponse("מחלקה לא נמצאה", 404);
    }

    const activeOrder = (department as any).orders?.find(
      (order: any) => String(order._id) === String((department as any).activeOrderId || "")
    );
    if (!activeOrder) {
      return BackendApiService.errorResponse("לא נמצא צו פעיל למחלקה", 400);
    }

    const dayStatusFor = (date: Date) => {
      const activeEvents = schedules.filter((event: any) => {
        const target = normalizeDay(date);
        return (
          target >= normalizeDay(new Date(event.startDate)) &&
          target <= normalizeDay(new Date(event.endDate))
        );
      });

      if (activeEvents.length === 0) {
        return {
          bucket: "NOT_ENLISTED" as const,
          statusText: "לא מגוייסים",
          source: "BASELINE" as const,
        };
      }

      const hasScopedEvent = activeEvents.some((event: any) =>
        isUserInEventScope(event, targetUserId)
      );
      if (!hasScopedEvent) {
        return {
          bucket: "NOT_ENLISTED" as const,
          statusText: "לא מגוייסים",
          source: "BASELINE" as const,
        };
      }

      const status = resolveDailyStatus({
        date,
        userId: targetUserId,
        events: schedules as any,
        leaves: leaves as any,
        overrides: overrides.filter((item: any) => {
          const overrideUserId = String(item.user?._id || item.user || "");
          return overrideUserId === targetUserId;
        }) as any,
      });

      return {
        bucket: status.isPresent ? ("IN_BASE" as const) : ("HOME" as const),
        statusText: status.status,
        source: status.source,
      };
    };

    const summaryDayStatus = dayStatusFor(summaryDate);
    const calendarDays = iterateDateRange(monthStart, monthEnd).map((date) => {
      const status = dayStatusFor(date);
      return {
        date: date.toISOString(),
        bucket: status.bucket,
        statusText: status.statusText,
        source: status.source,
      };
    });

    const orderStartDate = new Date(activeOrder.startDate);
    const orderEndDateRaw = new Date(activeOrder.endDate);
    const summaryRangeStart =
      normalizeDay(orderStartDate) > normalizeDay(summaryDate)
        ? summaryDate
        : orderStartDate;
    const summaryRangeEnd =
      normalizeDay(orderEndDateRaw) < normalizeDay(summaryDate)
        ? orderEndDateRaw
        : summaryDate;
    const summaryDays =
      normalizeDay(summaryRangeStart) <= normalizeDay(summaryRangeEnd)
        ? iterateDateRange(summaryRangeStart, summaryRangeEnd).map((date) => dayStatusFor(date))
        : [];

    const inBaseDays = summaryDays.filter((item) => item.bucket === "IN_BASE").length;
    const homeDays = summaryDays.filter((item) => item.bucket === "HOME").length;
    const notEnlistedDays = summaryDays.filter(
      (item) => item.bucket === "NOT_ENLISTED"
    ).length;
    const leaveRequestsInOrder = leaves.filter((leave: any) => {
      const leaveStart = normalizeDay(new Date(leave.startDate));
      const leaveEnd = normalizeDay(new Date(leave.endDate));
      const rangeStart = normalizeDay(summaryRangeStart);
      const rangeEnd = normalizeDay(summaryRangeEnd);
      return leaveEnd >= rangeStart && leaveStart <= rangeEnd;
    });
    const dutiesInOrder = duties.filter((duty: any) => {
      const dutyDate = normalizeDay(new Date(duty.date));
      return (
        dutyDate >= normalizeDay(summaryRangeStart) &&
        dutyDate <= normalizeDay(summaryRangeEnd)
      );
    });

    return BackendApiService.successResponse({
      user: {
        id: String((user as any)._id),
        name: (user as any).name,
        role: (user as any).role,
        departmentName: String((user as any).department?.name || ""),
      },
      activeOrder: {
        id: String(activeOrder._id),
        label: activeOrder.label,
        startDate: orderStartDate.toISOString(),
        endDate: orderEndDateRaw.toISOString(),
      },
      calendar: {
        month: monthStart.toISOString(),
        days: calendarDays,
      },
      dailyStatus: {
        date: summaryDate.toISOString(),
        ...summaryDayStatus,
      },
      overallStatus: {
        from: summaryRangeStart.toISOString(),
        to: summaryRangeEnd.toISOString(),
        enlistedDays: inBaseDays + homeDays,
        inBaseDays,
        homeDays,
        notEnlistedDays,
        totalLeaveRequests: leaveRequestsInOrder.length,
        totalDuties: dutiesInOrder.length,
      },
      leaveRequests: leaves,
      duties,
    });
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
