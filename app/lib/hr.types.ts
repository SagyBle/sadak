export type UserRole = "SOLDIER" | "COMMANDER";
export type ActivityType =
  | "TRAINING"
  | "COMMANDERS_TRAINING"
  | "OPERATIONAL_EMPLOYMENT"
  | "PROCESSING_DAY"
  | "HOME";
export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type LeaveRequestType = "LEAVE" | "STAY_BEHIND";
export type DutyType = "KITCHEN" | "MAINTENANCE_RASAP" | "OTHER";

export interface SessionUser {
  userId: string;
  role: UserRole | "GOD";
  departmentId?: string;
  name: string;
}

export interface ResolvedDailyStatus {
  status: string;
  isPresent: boolean;
  isOperationalPresent: boolean;
  source: "OVERRIDE" | "LEAVE" | "STAY_BEHIND" | "BASELINE";
}
