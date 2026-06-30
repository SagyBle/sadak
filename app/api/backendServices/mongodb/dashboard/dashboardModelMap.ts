import { DepartmentSchema } from "./schemas/department.schema";
import { UserSchema } from "./schemas/user.schema";
import { ScheduleEventSchema } from "./schemas/schedule-event.schema";
import { LeaveRequestSchema } from "./schemas/leave-request.schema";
import { DutyLogSchema } from "./schemas/duty-log.schema";
import { DailyCustomOverrideStatusSchema } from "./schemas/daily-custom-override-status.schema";

export const dashboardModelMap = {
  Department: DepartmentSchema,
  User: UserSchema,
  ScheduleEvent: ScheduleEventSchema,
  LeaveRequest: LeaveRequestSchema,
  DutyLog: DutyLogSchema,
  DailyCustomOverrideStatus: DailyCustomOverrideStatusSchema,
} as const;
