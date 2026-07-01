import ApiService from "./api.frontendService";

class HrFrontendService {
  static getSummary(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    return ApiService.get<{ summary: any }>(`/personnel/summary${query}`);
  }

  static getDailyStatus(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    return ApiService.get<{
      date: string;
      summary: any;
      inBase: any[];
      home: any[];
      notEnlisted: any[];
      transitions: {
        returningToday: any[];
        leavingToday: any[];
      };
    }>(`/personnel/daily-status${query}`);
  }

  static getRoster() {
    return ApiService.get<{ roster: any[] }>("/personnel/roster");
  }

  static getSelfStatus(payload?: { month?: string; date?: string; userId?: string }) {
    const params = new URLSearchParams();
    if (payload?.month) params.set("month", payload.month);
    if (payload?.date) params.set("date", payload.date);
    if (payload?.userId) params.set("userId", payload.userId);
    const query = params.toString() ? `?${params.toString()}` : "";
    return ApiService.get<{
      user: any;
      activeOrder: {
        id: string;
        label: string;
        startDate: string;
        endDate: string;
      };
      calendar: { month: string; days: any[] };
      dailyStatus: any;
      overallStatus: any;
      leaveRequests: any[];
      duties: any[];
    }>(`/personnel/self-status${query}`);
  }

  static listUsers() {
    return ApiService.get<{ users: any[] }>("/personnel/users");
  }

  static addUser(payload: { name: string; role: "SOLDIER" | "COMMANDER"; password?: string }) {
    return ApiService.post<{ user: any }>("/personnel/users", payload);
  }

  static setOverride(payload: { userId: string; date: string; statusText: string }) {
    return ApiService.post<{ override: any }>("/personnel/override", payload);
  }

  static getSchedules() {
    return ApiService.get<{ schedules: any[] }>("/schedules");
  }

  static createSchedule(payload: any) {
    return ApiService.post<{ schedule: any }>("/schedules", payload);
  }

  static updateSchedule(payload: any) {
    return ApiService.patch<{ schedule: any }>("/schedules", payload);
  }

  static deleteSchedule(id: string) {
    return ApiService.delete<{ id: string }>("/schedules", { id });
  }

  static getLeaveRequests() {
    return ApiService.get<{ requests: any[] }>("/leave-requests");
  }

  static createLeaveRequest(payload: any) {
    return ApiService.post<{ request: any }>("/leave-requests", payload);
  }

  static updateLeaveRequest(payload: { id: string; status: string; notes?: string }) {
    return ApiService.patch<{ request: any }>("/leave-requests", payload);
  }

  static updateMyPendingLeaveRequest(payload: {
    id: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
    requestType?: "LEAVE" | "STAY_BEHIND";
    notes?: string;
  }) {
    return ApiService.patch<{ request: any }>("/leave-requests", {
      ...payload,
      action: "EDIT",
    });
  }

  static cancelMyPendingLeaveRequest(id: string) {
    return ApiService.patch<{ id: string }>("/leave-requests", {
      id,
      action: "CANCEL",
    });
  }

  static getLeaveIntelligence(payload: {
    userId: string;
    startDate: string;
    endDate: string;
  }) {
    return ApiService.post<{ days: any[] }>("/leave-requests/intelligence", payload);
  }

  static getDuties() {
    return ApiService.get<{ logs: any[] }>("/duties");
  }

  static createDuty(payload: any) {
    return ApiService.post<{ duty: any }>("/duties", payload);
  }
}

export default HrFrontendService;
