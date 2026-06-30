import type { ResolvedDailyStatus } from "./hr.types";

type EventLike = {
  startDate: Date | string;
  endDate: Date | string;
  activityType: string;
  requiredPersonnelCount: number;
  scope: "ALL_DEPARTMENT" | "SPECIFIC_USERS";
  selectedUsers: unknown[];
};

type LeaveLike = {
  user: unknown;
  startDate: Date | string;
  endDate: Date | string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestType: "LEAVE" | "STAY_BEHIND";
};

type OverrideLike = {
  user: unknown;
  date: Date | string;
  statusText: string;
};

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const normalizeDate = (d: string | Date) =>
  d instanceof Date ? d : new Date(d);

const sameDay = (a: Date, b: Date) => startOfDay(a) === startOfDay(b);

const isInDateRange = (date: Date, start: Date, end: Date) => {
  const value = startOfDay(date);
  return value >= startOfDay(start) && value <= startOfDay(end);
};

const normalizeUserId = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const candidate = value as { _id?: unknown; toString?: () => string };
    if (typeof candidate._id === "string") return candidate._id;
    if (candidate._id && typeof candidate._id === "object" && "toString" in candidate._id) {
      return (candidate._id as { toString: () => string }).toString();
    }
    if (typeof candidate.toString === "function") return candidate.toString();
  }
  return "";
};

export const isUserInEventScope = (
  event: EventLike,
  userId: string
): boolean => {
  if (event.scope === "ALL_DEPARTMENT") return true;
  return event.selectedUsers.some((id) => normalizeUserId(id) === userId);
};

export const resolveDailyStatus = ({
  date,
  userId,
  events,
  leaves,
  overrides,
}: {
  date: Date;
  userId: string;
  events: EventLike[];
  leaves: LeaveLike[];
  overrides: OverrideLike[];
}): ResolvedDailyStatus => {
  const activeEvents = events.filter((event) =>
    isInDateRange(date, normalizeDate(event.startDate), normalizeDate(event.endDate))
  );
  const userEvents = activeEvents.filter((event) => isUserInEventScope(event, userId));
  const selectedEvent = userEvents[0];

  const manualOverride = overrides.find(
    (item) => normalizeUserId(item.user) === userId && sameDay(date, normalizeDate(item.date))
  );
  if (manualOverride) {
    return {
      status: manualOverride.statusText,
      isPresent: manualOverride.statusText.includes("נוכח"),
      isOperationalPresent:
        selectedEvent?.activityType === "OPERATIONAL_EMPLOYMENT" &&
        manualOverride.statusText.includes("נוכח"),
      source: "OVERRIDE",
    };
  }

  const approvedLeave = leaves.find(
    (leave) =>
      normalizeUserId(leave.user) === userId &&
      leave.status === "APPROVED" &&
      isInDateRange(date, normalizeDate(leave.startDate), normalizeDate(leave.endDate))
  );
  if (approvedLeave?.requestType === "LEAVE") {
    return {
      status: "בית (חופשה מאושרת)",
      isPresent: false,
      isOperationalPresent: false,
      source: "LEAVE",
    };
  }

  if (approvedLeave?.requestType === "STAY_BEHIND") {
    return {
      status: "נוכח (חריג)",
      isPresent: true,
      isOperationalPresent: selectedEvent?.activityType === "OPERATIONAL_EMPLOYMENT",
      source: "STAY_BEHIND",
    };
  }

  if (selectedEvent?.activityType === "HOME") {
    return {
      status: "בית",
      isPresent: false,
      isOperationalPresent: false,
      source: "BASELINE",
    };
  }

  return {
    status: "נוכח",
    isPresent: true,
    isOperationalPresent: selectedEvent?.activityType === "OPERATIONAL_EMPLOYMENT",
    source: "BASELINE",
  };
};

export const iterateDateRange = (startDate: Date, endDate: Date): Date[] => {
  const result: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    result.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return result;
};
