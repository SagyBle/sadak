import type { ActivityType, DutyType, LeaveRequestStatus } from "./hr.types";

export const DEFAULT_PASSWORDS = {
  SOLDIER: "1234",
  COMMANDER: "12345",
} as const;

export const HEBREW_TABS = {
  PERSONNEL: "כ״א",
  SCHEDULE: "תכנון לו״ז וסדכ",
  LEAVE: "בקשות יציאה",
  DUTIES: "תורנויות",
} as const;

export const ACTIVITY_TYPE_HEBREW: Record<ActivityType, string> = {
  TRAINING: "אימון",
  COMMANDERS_TRAINING: "אימון מפקדים",
  OPERATIONAL_EMPLOYMENT: "תעסוקה מבצעית",
  PROCESSING_DAY: "יום עיבוד",
  HOME: "בית",
};

export const DUTY_TYPE_HEBREW: Record<DutyType, string> = {
  KITCHEN: "מטבח",
  MAINTENANCE_RASAP: "רס״פ",
  OTHER: "אחר",
};

export const LEAVE_STATUS_HEBREW: Record<LeaveRequestStatus, string> = {
  APPROVED: "מאושר",
  REJECTED: "דחוי",
  PENDING: "ממתין",
};
