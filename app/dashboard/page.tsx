"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/app/contexts/AuthContext";
import AdminFrontendService from "@/app/frontendServices/admin.frontendService";
import HrFrontendService from "@/app/frontendServices/hr.frontendService";
import {
  ACTIVITY_TYPE_HEBREW,
  DUTY_TYPE_HEBREW,
  HEBREW_TABS,
  LEAVE_STATUS_HEBREW,
} from "@/app/lib/hr.constants";
import { he } from "date-fns/locale";

type TabKey = "dailyStatus" | "personnel" | "schedule" | "leave" | "duties";
type LeaveApprovalDayIntel = {
  date: string;
  requiredPersonnel: number;
  availableBeforeApproval: number;
  openRequests: number;
  warning: boolean;
};
type DailyStatusItem = {
  id: string;
  name: string;
  role: string;
  isPresent: boolean;
  statusText: string;
  reason: string;
  source: "BASELINE" | "LEAVE" | "STAY_BEHIND" | "OVERRIDE";
  isException: boolean;
};
type DailyStatusResponse = {
  date: string;
  summary: {
    totalDepartmentUsers: number;
    inBaseCount: number;
    homeCount: number;
    notEnlistedCount: number;
    exceptionsCount: number;
    pendingLeaveCount: number;
    totalRequired: number;
    availableNow: number;
    hasActiveSchedule: boolean;
  };
  inBase: DailyStatusItem[];
  home: DailyStatusItem[];
  notEnlisted: DailyStatusItem[];
};

const getTodayDateInputValue = () => new Date().toISOString().slice(0, 10);
const getDateInputValueFromOffset = (offsetDays: number) => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + offsetDays);
  return targetDate.toISOString().slice(0, 10);
};

const TAB_OPTIONS: Array<{ key: TabKey; label: string }> = [
  { key: "dailyStatus", label: "סטטוס יומי" },
  { key: "personnel", label: HEBREW_TABS.PERSONNEL },
  { key: "schedule", label: HEBREW_TABS.SCHEDULE },
  { key: "leave", label: HEBREW_TABS.LEAVE },
  { key: "duties", label: HEBREW_TABS.DUTIES },
];

export default function DashboardPage() {
  const router = useRouter();
  const { session, isLoading, isGodMode, logout } = useAuth();
  const [tab, setTab] = useState<TabKey>("dailyStatus");
  const [summary, setSummary] = useState<any>(null);
  const [dailyStatusDate, setDailyStatusDate] = useState(
    getTodayDateInputValue()
  );
  const [dailyStatus, setDailyStatus] = useState<DailyStatusResponse | null>(
    null
  );
  const todayDate = getDateInputValueFromOffset(0);
  const tomorrowDate = getDateInputValueFromOffset(1);
  const dayAfterTomorrowDate = getDateInputValueFromOffset(2);
  const [roster, setRoster] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [duties, setDuties] = useState<any[]>([]);
  const [leaveFilter, setLeaveFilter] = useState("");
  const [leaveIntelligence, setLeaveIntelligence] = useState<any[]>([]);
  const [leaveApprovalIntelByRequest, setLeaveApprovalIntelByRequest] =
    useState<Record<string, LeaveApprovalDayIntel[] | null>>({});
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [newUser, setNewUser] = useState({ name: "", role: "SOLDIER" as "SOLDIER" | "COMMANDER" });
  const [newSchedule, setNewSchedule] = useState({
    startDate: "",
    endDate: "",
    activityType: "TRAINING",
    requiredPersonnelCount: 0,
    scope: "ALL_DEPARTMENT" as "ALL_DEPARTMENT" | "SPECIFIC_USERS",
    selectedUsers: [] as string[],
    notes: "",
  });
  const [newLeave, setNewLeave] = useState({
    userId: "",
    startDate: "",
    endDate: "",
    reason: "",
    requestType: "LEAVE",
    notes: "",
  });
  const [newDuty, setNewDuty] = useState({
    userId: "",
    date: "",
    dutyType: "KITCHEN",
    notes: "",
  });
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState({
    startDate: "",
    endDate: "",
    activityType: "TRAINING",
    requiredPersonnelCount: 0,
    scope: "ALL_DEPARTMENT" as "ALL_DEPARTMENT" | "SPECIFIC_USERS",
    selectedUsers: [] as string[],
    notes: "",
  });

  const isCommander = session?.role === "COMMANDER";
  const schedulableUsers = useMemo(
    () => users.filter((user) => user.role === "SOLDIER" || user.role === "COMMANDER"),
    [users]
  );
  const sourceHebrew: Record<DailyStatusItem["source"], string> = {
    BASELINE: "לו״ז בסיסי",
    LEAVE: "חופשה מאושרת",
    STAY_BEHIND: "הישארות חריגה",
    OVERRIDE: "חריג מפקד",
  };

  const loadAll = async () => {
    const [summaryRes, rosterRes, usersRes, schedulesRes, leaveRes, dutiesRes] =
      await Promise.all([
        HrFrontendService.getSummary(),
        HrFrontendService.getRoster(),
        HrFrontendService.listUsers(),
        HrFrontendService.getSchedules(),
        HrFrontendService.getLeaveRequests(),
        HrFrontendService.getDuties(),
      ]);

    if (summaryRes.success) setSummary(summaryRes.data?.summary);
    if (rosterRes.success) setRoster(rosterRes.data?.roster || []);
    if (usersRes.success) setUsers(usersRes.data?.users || []);
    if (schedulesRes.success) setSchedules(schedulesRes.data?.schedules || []);
    if (leaveRes.success) setLeaveRequests(leaveRes.data?.requests || []);
    if (dutiesRes.success) setDuties(dutiesRes.data?.logs || []);
  };

  const loadDailyStatus = async (date: string) => {
    const response = await HrFrontendService.getDailyStatus(date);
    if (!response.success) {
      toast.error(response.error || "טעינת סטטוס יומי נכשלה");
      return;
    }
    setDailyStatus(response.data || null);
  };

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      router.push("/login");
      return;
    }
    if (isGodMode) {
      router.push("/god");
      return;
    }
    loadAll();
    loadDailyStatus(dailyStatusDate);
  }, [isLoading, session, isGodMode, router]);

  useEffect(() => {
    if (!session || isGodMode) return;
    if (tab !== "dailyStatus") return;
    loadDailyStatus(dailyStatusDate);
  }, [dailyStatusDate, tab, session, isGodMode]);

  const weeklyOutlook = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() + index);
      const active = schedules.find((event) => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        return day >= start && day <= end;
      });
      return { day, active };
    });
  }, [schedules]);

  const monthlyCalendarModifiers = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const homeDays: Date[] = [];
    const operationalDays: Date[] = [];

    for (let dayOfMonth = 1; dayOfMonth <= daysInMonth; dayOfMonth += 1) {
      const day = new Date(year, month, dayOfMonth);
      const active = schedules.find((event) => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        return day >= start && day <= end;
      });

      if (!active) continue;
      if (active.activityType === "HOME") {
        homeDays.push(day);
      } else {
        operationalDays.push(day);
      }
    }

    return { homeDays, operationalDays };
  }, [schedules, calendarMonth]);

  const dutyOverview = useMemo(() => {
    const map = new Map<string, { name: string; KITCHEN: number; MAINTENANCE_RASAP: number; OTHER: number }>();
    users.forEach((user) => {
      map.set(user._id, { name: user.name, KITCHEN: 0, MAINTENANCE_RASAP: 0, OTHER: 0 });
    });
    duties.forEach((entry) => {
      const userId = entry.user?._id || entry.user;
      const current = map.get(userId);
      if (current) {
        current[entry.dutyType as "KITCHEN" | "MAINTENANCE_RASAP" | "OTHER"] += 1;
      }
    });
    return Array.from(map.values());
  }, [users, duties]);

  const filteredLeaveRequests = useMemo(() => {
    const value = leaveFilter.trim().toLowerCase();
    if (!value) return leaveRequests;
    return leaveRequests.filter((request) =>
      request.user?.name?.toLowerCase?.().includes(value)
    );
  }, [leaveRequests, leaveFilter]);

  useEffect(() => {
    if (tab !== "leave") return;
    const pendingRequests = leaveRequests.filter(
      (request) =>
        request.status === "PENDING" &&
        request.user &&
        request.startDate &&
        request.endDate
    );

    if (pendingRequests.length === 0) {
      setLeaveApprovalIntelByRequest({});
      return;
    }

    const loadingMap = pendingRequests.reduce<
      Record<string, LeaveApprovalDayIntel[] | null>
    >((acc, request) => {
      acc[request._id] = null;
      return acc;
    }, {});
    setLeaveApprovalIntelByRequest(loadingMap);

    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        pendingRequests.map(async (request) => {
          const targetUserId = String(request.user?._id || request.user || "");
          const response = await HrFrontendService.getLeaveIntelligence({
            userId: targetUserId,
            startDate: request.startDate,
            endDate: request.endDate,
          });
          return [
            request._id,
            response.success
              ? ((response.data?.days || []) as LeaveApprovalDayIntel[])
              : [],
          ] as const;
        })
      );

      if (cancelled) return;
      setLeaveApprovalIntelByRequest(
        Object.fromEntries(entries) as Record<string, LeaveApprovalDayIntel[]>
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [leaveRequests, tab]);

  const applyOverride = async (userId: string) => {
    const statusText = window.prompt("הזן סטטוס חריג יומי");
    if (!statusText) return;
    const response = await HrFrontendService.setOverride({
      userId,
      date: new Date().toISOString(),
      statusText,
    });
    if (response.success) {
      toast.success("החריג נשמר");
      loadAll();
    } else {
      toast.error(response.error || "שמירת חריג נכשלה");
    }
  };

  const submitAddUser = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await HrFrontendService.addUser(newUser);
    if (!response.success) {
      toast.error(response.error || "הוספת משתמש נכשלה");
      return;
    }
    toast.success("משתמש נוסף");
    setNewUser({ name: "", role: "SOLDIER" });
    loadAll();
  };

  const submitSchedule = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      newSchedule.scope === "SPECIFIC_USERS" &&
      newSchedule.selectedUsers.length === 0
    ) {
      toast.error("בבחירת משתמשים ספציפיים חובה לבחור לפחות איש מחלקה אחד");
      return;
    }

    const response = await HrFrontendService.createSchedule(newSchedule);
    if (!response.success) {
      toast.error(response.error || "יצירת אירוע לו״ז נכשלה");
      return;
    }
    toast.success("אירוע לו״ז נוסף");
    setNewSchedule({
      startDate: "",
      endDate: "",
      activityType: "TRAINING",
      requiredPersonnelCount: 0,
      scope: "ALL_DEPARTMENT",
      selectedUsers: [],
      notes: "",
    });
    loadAll();
  };

  const startEditSchedule = (schedule: any) => {
    setEditingScheduleId(String(schedule._id));
    setEditingSchedule({
      startDate: new Date(schedule.startDate).toISOString().slice(0, 10),
      endDate: new Date(schedule.endDate).toISOString().slice(0, 10),
      activityType: schedule.activityType,
      requiredPersonnelCount: Number(schedule.requiredPersonnelCount || 0),
      scope: schedule.scope || "ALL_DEPARTMENT",
      selectedUsers:
        schedule.scope === "SPECIFIC_USERS"
          ? (schedule.selectedUsers || []).map((id: any) => String(id))
          : [],
      notes: schedule.notes || "",
    });
  };

  const cancelEditSchedule = () => {
    setEditingScheduleId(null);
    setEditingSchedule({
      startDate: "",
      endDate: "",
      activityType: "TRAINING",
      requiredPersonnelCount: 0,
      scope: "ALL_DEPARTMENT",
      selectedUsers: [],
      notes: "",
    });
  };

  const saveEditSchedule = async (scheduleId: string) => {
    if (
      editingSchedule.scope === "SPECIFIC_USERS" &&
      editingSchedule.selectedUsers.length === 0
    ) {
      toast.error("בעריכה עם משתמשים ספציפיים חובה לבחור לפחות איש מחלקה אחד");
      return;
    }

    const response = await HrFrontendService.updateSchedule({
      id: scheduleId,
      ...editingSchedule,
    });
    if (!response.success) {
      toast.error(response.error || "עדכון אירוע לו״ז נכשל");
      return;
    }

    toast.success("אירוע לו״ז עודכן");
    cancelEditSchedule();
    loadAll();
  };

  const removeSchedule = async (scheduleId: string) => {
    const shouldDelete = window.confirm("למחוק את אירוע הלו״ז הזה?");
    if (!shouldDelete) return;

    const response = await HrFrontendService.deleteSchedule(scheduleId);
    if (!response.success) {
      toast.error(response.error || "מחיקת אירוע לו״ז נכשלה");
      return;
    }

    toast.success("אירוע לו״ז נמחק");
    if (editingScheduleId === scheduleId) {
      cancelEditSchedule();
    }
    loadAll();
  };

  const submitLeave = async (event: React.FormEvent) => {
    event.preventDefault();
    const intelligenceRes = await HrFrontendService.getLeaveIntelligence({
      userId: newLeave.userId,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
    });
    if (intelligenceRes.success) {
      setLeaveIntelligence(intelligenceRes.data?.days || []);
    }

    const response = await HrFrontendService.createLeaveRequest(newLeave);
    if (!response.success) {
      toast.error(response.error || "יצירת בקשה נכשלה");
      return;
    }
    toast.success("בקשת יציאה נוצרה");
    setNewLeave({
      userId: "",
      startDate: "",
      endDate: "",
      reason: "",
      requestType: "LEAVE",
      notes: "",
    });
    setLeaveIntelligence([]);
    loadAll();
  };

  const submitDuty = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await HrFrontendService.createDuty(newDuty);
    if (!response.success) {
      toast.error(response.error || "רישום תורנות נכשל");
      return;
    }
    toast.success("התורנות נרשמה");
    loadAll();
  };

  const updateLeaveStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    const response = await HrFrontendService.updateLeaveRequest({ id, status });
    if (!response.success) {
      toast.error(response.error || "עדכון סטטוס נכשל");
      return;
    }
    toast.success("סטטוס בקשה עודכן");
    loadAll();
  };

  if (!session || isLoading) {
    return <div className="p-8">טוען...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 rounded-lg border bg-white p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold">ניהול מחלקתי</h1>
            <p className="text-sm text-muted-foreground">
              שלום {session.name}, תפקיד: {session.role === "COMMANDER" ? "מפקד" : "חייל"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            התנתק
          </Button>
        </header>

        <div className="flex flex-wrap gap-2">
          {TAB_OPTIONS.map((item) => (
            <Button
              key={item.key}
              variant={tab === item.key ? "default" : "outline"}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {tab === "dailyStatus" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>סטטוס יומי מחלקתי</CardTitle>
                <CardDescription>
                  תמונת מצב לתאריך הנבחר: מי אמור להיות בצבא ומי אמור להיות בבית
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-end">
                  <div className="w-full max-w-xs">
                    <Label htmlFor="dailyStatusDate">תאריך</Label>
                    <Input
                      id="dailyStatusDate"
                      type="date"
                      value={dailyStatusDate}
                      onChange={(e) => setDailyStatusDate(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={dailyStatusDate === todayDate ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDailyStatusDate(todayDate)}
                    >
                      היום
                    </Button>
                    <Button
                      type="button"
                      variant={dailyStatusDate === tomorrowDate ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDailyStatusDate(tomorrowDate)}
                    >
                      מחר
                    </Button>
                    <Button
                      type="button"
                      variant={
                        dailyStatusDate === dayAfterTomorrowDate
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => setDailyStatusDate(dayAfterTomorrowDate)}
                    >
                      מחרתיים
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-4 text-sm">
                  <div className="rounded border bg-white p-3">
                    סה״כ חיילים במחלקה: {dailyStatus?.summary.totalDepartmentUsers ?? 0}
                  </div>
                  <div className="rounded border bg-green-50 p-3">
                    אמורים בצבא: {dailyStatus?.summary.inBaseCount ?? 0}
                  </div>
                  <div className="rounded border bg-blue-50 p-3">
                    אמורים בבית: {dailyStatus?.summary.homeCount ?? 0}
                  </div>
                  <div className="rounded border bg-slate-100 p-3">
                    לא מגוייסים: {dailyStatus?.summary.notEnlistedCount ?? 0}
                  </div>
                  <div className="rounded border bg-amber-50 p-3">
                    חריגים יומיים: {dailyStatus?.summary.exceptionsCount ?? 0}
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3 text-sm">
                  <div className="rounded border bg-white p-3">
                    סד״כ נדרש היום: {dailyStatus?.summary.totalRequired ?? 0}
                  </div>
                  <div className="rounded border bg-white p-3">
                    זמינים כרגע: {dailyStatus?.summary.availableNow ?? 0}
                  </div>
                  <div className="rounded border bg-white p-3">
                    בקשות ממתינות להיום: {dailyStatus?.summary.pendingLeaveCount ?? 0}
                  </div>
                </div>
                {dailyStatus?.summary.hasActiveSchedule === false && (
                  <div className="rounded border border-slate-300 bg-slate-50 p-3 text-sm">
                    אין הגדרת לו״ז ליום זה - כלל החיילים מסומנים כ״לא מגוייסים״.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>אמורים להיות בצבא</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(dailyStatus?.inBase || []).length === 0 ? (
                    <div className="rounded border bg-white p-3 text-sm text-muted-foreground">
                      אין חיילים משובצים כעת לצבא בתאריך זה
                    </div>
                  ) : (
                    (dailyStatus?.inBase || []).map((item) => (
                      <div
                        key={item.id}
                        className="rounded border bg-white p-3 text-sm"
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          מקור: {sourceHebrew[item.source]}
                        </div>
                        {item.isException && (
                          <div className="mt-1 inline-block rounded bg-amber-100 px-2 py-1 text-xs">
                            חריג
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>אמורים להיות בבית</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(dailyStatus?.home || []).length === 0 ? (
                    <div className="rounded border bg-white p-3 text-sm text-muted-foreground">
                      אין חיילים משובצים לבית בתאריך זה
                    </div>
                  ) : (
                    (dailyStatus?.home || []).map((item) => (
                      <div
                        key={item.id}
                        className="rounded border bg-white p-3 text-sm"
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs">
                          סיבה: {item.reason}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          מקור: {sourceHebrew[item.source]}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>לא מגוייסים</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(dailyStatus?.notEnlisted || []).length === 0 ? (
                    <div className="rounded border bg-white p-3 text-sm text-muted-foreground">
                      קיימת הגדרת לו״ז לתאריך זה
                    </div>
                  ) : (
                    (dailyStatus?.notEnlisted || []).map((item) => (
                      <div
                        key={item.id}
                        className="rounded border bg-white p-3 text-sm"
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs">סיבה: {item.reason}</div>
                        <div className="text-xs text-muted-foreground">
                          סטטוס: {item.statusText}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {tab === "personnel" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>סיכום יומי</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-5 text-sm">
                <div>סה״כ נדרש: {summary?.totalRequired ?? 0}</div>
                <div>סה״כ נוכחים: {summary?.totalPresent ?? 0}</div>
                <div>סה״כ בבית/נעדרים: {summary?.totalAbsentHome ?? 0}</div>
                <div>חוזרים היום: {summary?.returningToday ?? 0}</div>
                <div>יוצאים היום: {summary?.leavingToday ?? 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>תחזית שבועית</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {weeklyOutlook.map((entry) => (
                  <div key={entry.day.toISOString()} className="rounded border bg-white px-3 py-2 text-xs">
                    <div>{entry.day.toLocaleDateString("he-IL", { weekday: "short", day: "2-digit", month: "2-digit" })}</div>
                    <div className="font-medium">
                      {entry.active ? ACTIVITY_TYPE_HEBREW[entry.active.activityType as keyof typeof ACTIVITY_TYPE_HEBREW] : "ללא פעילות"}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>לוח חודשי</CardTitle>
                <CardDescription>ירוק = בסיס/מבצעי, כחול = בית</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  locale={he}
                  dir="rtl"
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  modifiers={{
                    homeDay: monthlyCalendarModifiers.homeDays,
                    operationalDay: monthlyCalendarModifiers.operationalDays,
                  }}
                  modifiersClassNames={{
                    homeDay:
                      "bg-blue-100 text-blue-900 hover:bg-blue-200 focus:bg-blue-200",
                    operationalDay:
                      "bg-green-100 text-green-900 hover:bg-green-200 focus:bg-green-200",
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>טבלת כוח אדם</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {roster.map((row) => (
                  <div key={row.id} className="flex flex-wrap items-center justify-between rounded border bg-white p-3 text-sm gap-2">
                    <div className="font-medium">{row.name}</div>
                    <div>{row.role === "COMMANDER" ? "מפקד" : "חייל"}</div>
                    <div>ימי תעסוקה: {row.operationalDaysCount}</div>
                    <div>סה״כ תורנויות: {row.totalDutiesPerformed}</div>
                    <div>סטטוס היום: {row.todayStatus}</div>
                    {isCommander && (
                      <Button size="sm" variant="outline" onClick={() => applyOverride(row.id)}>
                        קבע חריג יומי
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {isCommander && (
              <Card>
                <CardHeader>
                  <CardTitle>הוספת חייל/מפקד</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-3 md:grid-cols-4" onSubmit={submitAddUser}>
                    <Input
                      placeholder="שם מלא"
                      value={newUser.name}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    <select
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          role: e.target.value as "SOLDIER" | "COMMANDER",
                        }))
                      }
                    >
                      <option value="SOLDIER">חייל</option>
                      <option value="COMMANDER">מפקד</option>
                    </select>
                    <Button type="submit" className="md:col-span-2">
                      הוסף משתמש
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {tab === "schedule" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>רשימת אירועי לו״ז</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {schedules.map((event) => (
                  <div key={event._id} className="rounded border bg-white p-3">
                    {editingScheduleId === String(event._id) ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-3">
                          <Input
                            type="date"
                            value={editingSchedule.startDate}
                            onChange={(e) =>
                              setEditingSchedule((prev) => ({
                                ...prev,
                                startDate: e.target.value,
                              }))
                            }
                          />
                          <Input
                            type="date"
                            value={editingSchedule.endDate}
                            onChange={(e) =>
                              setEditingSchedule((prev) => ({
                                ...prev,
                                endDate: e.target.value,
                              }))
                            }
                          />
                          <select
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={editingSchedule.activityType}
                            onChange={(e) =>
                              setEditingSchedule((prev) => ({
                                ...prev,
                                activityType: e.target.value,
                              }))
                            }
                          >
                            {Object.entries(ACTIVITY_TYPE_HEBREW).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <Input
                            type="number"
                            min={0}
                            value={editingSchedule.requiredPersonnelCount}
                            onChange={(e) =>
                              setEditingSchedule((prev) => ({
                                ...prev,
                                requiredPersonnelCount: Number(e.target.value),
                              }))
                            }
                          />
                          <select
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={editingSchedule.scope}
                            onChange={(e) =>
                              setEditingSchedule((prev) => {
                                const scope = e.target.value as
                                  | "ALL_DEPARTMENT"
                                  | "SPECIFIC_USERS";
                                return {
                                  ...prev,
                                  scope,
                                  selectedUsers:
                                    scope === "ALL_DEPARTMENT"
                                      ? []
                                      : prev.selectedUsers,
                                };
                              })
                            }
                          >
                            <option value="ALL_DEPARTMENT">כל המחלקה</option>
                            <option value="SPECIFIC_USERS">משתמשים ספציפיים</option>
                          </select>
                          <Textarea
                            className="md:col-span-3"
                            value={editingSchedule.notes}
                            onChange={(e) =>
                              setEditingSchedule((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                            placeholder="הערות"
                          />
                        </div>
                        {editingSchedule.scope === "SPECIFIC_USERS" && (
                          <div className="rounded-md border p-3">
                            <div className="mb-2 text-sm font-medium">
                              בחירת אנשי מחלקה מחויבים לאירוע
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                              {schedulableUsers.map((member) => {
                                const memberId = String(member._id);
                                const isChecked =
                                  editingSchedule.selectedUsers.includes(memberId);
                                return (
                                  <label
                                    key={memberId}
                                    className="flex items-center gap-2 rounded border bg-white px-3 py-2 text-sm"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) =>
                                        setEditingSchedule((prev) => ({
                                          ...prev,
                                          selectedUsers: e.target.checked
                                            ? [...prev.selectedUsers, memberId]
                                            : prev.selectedUsers.filter(
                                                (id) => id !== memberId
                                              ),
                                        }))
                                      }
                                    />
                                    <span>
                                      {member.name} (
                                      {member.role === "COMMANDER" ? "מפקד" : "חייל"})
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEditSchedule(String(event._id))}>
                            שמור
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditSchedule}>
                            בטל
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium">
                          {ACTIVITY_TYPE_HEBREW[event.activityType as keyof typeof ACTIVITY_TYPE_HEBREW]}
                        </div>
                        <div>
                          {new Date(event.startDate).toLocaleDateString("he-IL")} -{" "}
                          {new Date(event.endDate).toLocaleDateString("he-IL")}
                        </div>
                        <div>נדרש: {event.requiredPersonnelCount}</div>
                        <div>היקף: {event.scope === "ALL_DEPARTMENT" ? "כל המחלקה" : "נבחרים בלבד"}</div>
                        {event.scope === "SPECIFIC_USERS" && (
                          <div className="text-xs text-muted-foreground">
                            חל על{" "}
                            {Array.isArray(event.selectedUsers)
                              ? event.selectedUsers.length
                              : 0}{" "}
                            אנשים
                          </div>
                        )}
                        {isCommander && (
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditSchedule(event)}
                            >
                              ערוך
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeSchedule(String(event._id))}
                            >
                              מחק
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {isCommander && (
              <Card>
                <CardHeader>
                  <CardTitle>יצירת אירוע לו״ז</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-3 md:grid-cols-3" onSubmit={submitSchedule}>
                    <Input
                      type="date"
                      value={newSchedule.startDate}
                      onChange={(e) => setNewSchedule((prev) => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                    <Input
                      type="date"
                      value={newSchedule.endDate}
                      onChange={(e) => setNewSchedule((prev) => ({ ...prev, endDate: e.target.value }))}
                      required
                    />
                    <select
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newSchedule.activityType}
                      onChange={(e) => setNewSchedule((prev) => ({ ...prev, activityType: e.target.value }))}
                    >
                      {Object.entries(ACTIVITY_TYPE_HEBREW).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min={0}
                      placeholder="כמות נדרשת"
                      value={newSchedule.requiredPersonnelCount}
                      onChange={(e) =>
                        setNewSchedule((prev) => ({
                          ...prev,
                          requiredPersonnelCount: Number(e.target.value),
                        }))
                      }
                    />
                    <select
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newSchedule.scope}
                      onChange={(e) =>
                        setNewSchedule((prev) => {
                          const scope = e.target.value as
                            | "ALL_DEPARTMENT"
                            | "SPECIFIC_USERS";
                          return {
                            ...prev,
                            scope,
                            selectedUsers:
                              scope === "ALL_DEPARTMENT"
                                ? []
                                : prev.selectedUsers,
                          };
                        })
                      }
                    >
                      <option value="ALL_DEPARTMENT">כל המחלקה</option>
                      <option value="SPECIFIC_USERS">משתמשים ספציפיים</option>
                    </select>
                    {newSchedule.scope === "SPECIFIC_USERS" && (
                      <div className="rounded-md border p-3 md:col-span-3">
                        <div className="mb-2 text-sm font-medium">
                          בחירת אנשי מחלקה מחויבים לאירוע
                        </div>
                        {schedulableUsers.length === 0 ? (
                          <div className="text-sm text-muted-foreground">
                            לא קיימים אנשי מחלקה זמינים כרגע
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">
                              נבחרו {newSchedule.selectedUsers.length} אנשים
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                              {schedulableUsers.map((member) => {
                                const memberId = String(member._id);
                                const isChecked =
                                  newSchedule.selectedUsers.includes(
                                    memberId
                                  );
                                return (
                                  <label
                                    key={memberId}
                                    className="flex items-center gap-2 rounded border bg-white px-3 py-2 text-sm"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        setNewSchedule((prev) => ({
                                          ...prev,
                                          selectedUsers: e.target.checked
                                            ? [
                                                ...prev.selectedUsers,
                                                memberId,
                                              ]
                                            : prev.selectedUsers.filter(
                                                (id) => id !== memberId
                                              ),
                                        }));
                                      }}
                                    />
                                    <span>
                                      {member.name} (
                                      {member.role === "COMMANDER" ? "מפקד" : "חייל"})
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <Textarea
                      placeholder="הערות"
                      value={newSchedule.notes}
                      onChange={(e) => setNewSchedule((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                    <Button type="submit" className="md:col-span-3">
                      צור אירוע
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {tab === "leave" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>בקשות יציאה</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="סינון לפי שם חייל"
                  value={leaveFilter}
                  onChange={(e) => setLeaveFilter(e.target.value)}
                />
                {filteredLeaveRequests.map((request) => (
                  <div key={request._id} className="rounded border bg-white p-3 text-sm space-y-1">
                    <div className="font-medium">{request.user?.name || "-"}</div>
                    <div>
                      {new Date(request.startDate).toLocaleDateString("he-IL")} -{" "}
                      {new Date(request.endDate).toLocaleDateString("he-IL")}
                    </div>
                    <div>סיבה: {request.reason}</div>
                    <div>סטטוס: {LEAVE_STATUS_HEBREW[request.status as keyof typeof LEAVE_STATUS_HEBREW]}</div>
                    {isCommander && request.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateLeaveStatus(request._id, "APPROVED")}>
                          אשר
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateLeaveStatus(request._id, "REJECTED")}>
                          דחה
                        </Button>
                      </div>
                    )}
                    {isCommander && request.status === "PENDING" && (
                      <div className="mt-2 rounded border bg-slate-50 p-2 text-xs space-y-1">
                        <div className="font-medium">מצב סד״כ עבור אישור הבקשה</div>
                        {leaveApprovalIntelByRequest[request._id] === null && (
                          <div className="text-muted-foreground">טוען נתונים...</div>
                        )}
                        {(leaveApprovalIntelByRequest[request._id] || []).map((day) => (
                          <div
                            key={day.date}
                            className={`rounded border p-2 ${
                              day.warning ? "border-red-500 bg-red-50" : "bg-white"
                            }`}
                          >
                            <div>
                              תאריך: {new Date(day.date).toLocaleDateString("he-IL")}
                            </div>
                            <div>כמות נדרשת: {day.requiredPersonnel}</div>
                            <div>כמות זמינה כרגע: {day.availableBeforeApproval}</div>
                            <div>בקשות פתוחות נוספות: {day.openRequests}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>רישום בקשת יציאה</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid gap-3 md:grid-cols-3" onSubmit={submitLeave}>
                  <select
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newLeave.userId}
                    onChange={(e) => setNewLeave((prev) => ({ ...prev, userId: e.target.value }))}
                    required
                  >
                    <option value="">בחר חייל</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="date"
                    value={newLeave.startDate}
                    onChange={(e) => setNewLeave((prev) => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                  <Input
                    type="date"
                    value={newLeave.endDate}
                    onChange={(e) => setNewLeave((prev) => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                  <select
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newLeave.requestType}
                    onChange={(e) => setNewLeave((prev) => ({ ...prev, requestType: e.target.value }))}
                  >
                    <option value="LEAVE">יציאה/חופשה</option>
                    <option value="STAY_BEHIND">בקשת הישארות</option>
                  </select>
                  <Input
                    placeholder="סיבת הבקשה"
                    value={newLeave.reason}
                    onChange={(e) => setNewLeave((prev) => ({ ...prev, reason: e.target.value }))}
                    required
                  />
                  <Textarea
                    placeholder="הערות"
                    value={newLeave.notes}
                    onChange={(e) => setNewLeave((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                  <Button type="submit" className="md:col-span-3">
                    שמור בקשה
                  </Button>
                </form>
              </CardContent>
            </Card>

            {leaveIntelligence.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>מודיעין אישור בקשה</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {leaveIntelligence.map((day) => (
                    <div
                      key={day.date}
                      className={`rounded border p-2 ${
                        day.warning ? "border-red-500 bg-red-50 font-semibold" : "bg-white"
                      }`}
                    >
                      <div>{new Date(day.date).toLocaleDateString("he-IL")}</div>
                      <div>נדרש: {day.requiredPersonnel}</div>
                      <div>זמינות לפני אישור: {day.availableBeforeApproval}</div>
                      <div>בקשות פתוחות/מאושרות נוספות: {day.openOrApprovedRequests}</div>
                      {day.warning && <div>אזהרה: האישור יוריד מתחת לסד״כ הנדרש</div>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {tab === "duties" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>סיכום תורנויות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {dutyOverview.map((item) => (
                  <div key={item.name} className="rounded border bg-white p-3">
                    <div className="font-medium">{item.name}</div>
                    <div>{DUTY_TYPE_HEBREW.KITCHEN}: {item.KITCHEN}</div>
                    <div>{DUTY_TYPE_HEBREW.MAINTENANCE_RASAP}: {item.MAINTENANCE_RASAP}</div>
                    <div>{DUTY_TYPE_HEBREW.OTHER}: {item.OTHER}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {isCommander && (
              <Card>
                <CardHeader>
                  <CardTitle>רישום תורנות</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-3 md:grid-cols-2" onSubmit={submitDuty}>
                    <select
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newDuty.userId}
                      onChange={(e) => setNewDuty((prev) => ({ ...prev, userId: e.target.value }))}
                      required
                    >
                      <option value="">בחר חייל</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="date"
                      value={newDuty.date}
                      onChange={(e) => setNewDuty((prev) => ({ ...prev, date: e.target.value }))}
                      required
                    />
                    <select
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newDuty.dutyType}
                      onChange={(e) => setNewDuty((prev) => ({ ...prev, dutyType: e.target.value }))}
                    >
                      {Object.entries(DUTY_TYPE_HEBREW).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <Textarea
                      placeholder="הערות"
                      value={newDuty.notes}
                      onChange={(e) => setNewDuty((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                    <Button type="submit" className="md:col-span-2">
                      הוסף תורנות
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
