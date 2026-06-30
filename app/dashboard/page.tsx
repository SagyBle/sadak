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
import { useAuth } from "@/app/contexts/AuthContext";
import AdminFrontendService from "@/app/frontendServices/admin.frontendService";
import HrFrontendService from "@/app/frontendServices/hr.frontendService";
import {
  ACTIVITY_TYPE_HEBREW,
  DUTY_TYPE_HEBREW,
  HEBREW_TABS,
  LEAVE_STATUS_HEBREW,
} from "@/app/lib/hr.constants";

type TabKey = "personnel" | "schedule" | "leave" | "duties";

const TAB_OPTIONS: Array<{ key: TabKey; label: string }> = [
  { key: "personnel", label: HEBREW_TABS.PERSONNEL },
  { key: "schedule", label: HEBREW_TABS.SCHEDULE },
  { key: "leave", label: HEBREW_TABS.LEAVE },
  { key: "duties", label: HEBREW_TABS.DUTIES },
];

export default function DashboardPage() {
  const router = useRouter();
  const { session, isLoading, isGodMode, logout } = useAuth();
  const [tab, setTab] = useState<TabKey>("personnel");
  const [summary, setSummary] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [duties, setDuties] = useState<any[]>([]);
  const [leaveFilter, setLeaveFilter] = useState("");
  const [leaveIntelligence, setLeaveIntelligence] = useState<any[]>([]);

  const [newUser, setNewUser] = useState({ name: "", role: "SOLDIER" as "SOLDIER" | "COMMANDER" });
  const [newSchedule, setNewSchedule] = useState({
    startDate: "",
    endDate: "",
    activityType: "TRAINING",
    requiredPersonnelCount: 0,
    scope: "ALL_DEPARTMENT",
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

  const isCommander = session?.role === "COMMANDER";

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
  }, [isLoading, session, isGodMode, router]);

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

  const monthlyCalendar = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }).map((_, index) => {
      const day = new Date(year, month, index + 1);
      const active = schedules.find((event) => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        return day >= start && day <= end;
      });
      return { day, active };
    });
  }, [schedules]);

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
    const response = await HrFrontendService.createSchedule(newSchedule);
    if (!response.success) {
      toast.error(response.error || "יצירת אירוע לו״ז נכשלה");
      return;
    }
    toast.success("אירוע לו״ז נוסף");
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
              <CardContent className="grid grid-cols-7 gap-2">
                {monthlyCalendar.map((entry) => {
                  const isHome = entry.active?.activityType === "HOME";
                  return (
                    <div
                      key={entry.day.toISOString()}
                      className={`rounded border p-2 text-xs ${
                        !entry.active ? "bg-white" : isHome ? "bg-blue-100" : "bg-green-100"
                      }`}
                    >
                      {entry.day.getDate()}
                    </div>
                  );
                })}
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
                    <div className="font-medium">
                      {ACTIVITY_TYPE_HEBREW[event.activityType as keyof typeof ACTIVITY_TYPE_HEBREW]}
                    </div>
                    <div>
                      {new Date(event.startDate).toLocaleDateString("he-IL")} -{" "}
                      {new Date(event.endDate).toLocaleDateString("he-IL")}
                    </div>
                    <div>נדרש: {event.requiredPersonnelCount}</div>
                    <div>היקף: {event.scope === "ALL_DEPARTMENT" ? "כל המחלקה" : "נבחרים בלבד"}</div>
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
                      onChange={(e) => setNewSchedule((prev) => ({ ...prev, scope: e.target.value }))}
                    >
                      <option value="ALL_DEPARTMENT">כל המחלקה</option>
                      <option value="SPECIFIC_USERS">משתמשים ספציפיים</option>
                    </select>
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
