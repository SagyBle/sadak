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
