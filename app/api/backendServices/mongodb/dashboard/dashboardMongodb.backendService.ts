import { Model } from "mongoose";
import MongoDBAbstractService from "../mongodbAbstract.backendService";
import { dashboardModelMap } from "./dashboardModelMap";
import type { Department } from "./schemas/department.schema";
import type { AppUser } from "./schemas/user.schema";
import type { ScheduleEvent } from "./schemas/schedule-event.schema";
import type { LeaveRequest } from "./schemas/leave-request.schema";
import type { DutyLog } from "./schemas/duty-log.schema";
import type { DailyCustomOverrideStatus } from "./schemas/daily-custom-override-status.schema";

class DashboardMongoDBService extends MongoDBAbstractService {
  private static instance: DashboardMongoDBService;

  private constructor() {
    super();
  }

  public static async getInstance(): Promise<DashboardMongoDBService> {
    if (!DashboardMongoDBService.instance) {
      const instance = new DashboardMongoDBService();
      await instance.init();
      DashboardMongoDBService.instance = instance;
    }
    return DashboardMongoDBService.instance;
  }

  protected getUri(): string {
    return process.env.MONGODB_DASHBOARD_URI || "";
  }

  private async init() {
    await this.connect();

    // Register all models from the model map
    for (const [modelName, schema] of Object.entries(dashboardModelMap)) {
      this.models[modelName] = this.getOrCreateModel(modelName, schema as any);
    }
  }

  get Department(): Model<Department> {
    return this.getModel<Department>("Department");
  }

  get User(): Model<AppUser> {
    return this.getModel<AppUser>("User");
  }

  get ScheduleEvent(): Model<ScheduleEvent> {
    return this.getModel<ScheduleEvent>("ScheduleEvent");
  }

  get LeaveRequest(): Model<LeaveRequest> {
    return this.getModel<LeaveRequest>("LeaveRequest");
  }

  get DutyLog(): Model<DutyLog> {
    return this.getModel<DutyLog>("DutyLog");
  }

  get DailyCustomOverrideStatus(): Model<DailyCustomOverrideStatus> {
    return this.getModel<DailyCustomOverrideStatus>("DailyCustomOverrideStatus");
  }

  public async createDepartment(
    data: Omit<Department, "_id" | "createdAt" | "updatedAt">
  ) {
    return this.create<Department>(this.Department, data);
  }

  public async getDepartments() {
    return this.Department.find({}).sort({ name: 1 }).lean();
  }

  public async createUser(data: Omit<AppUser, "_id" | "createdAt" | "updatedAt">) {
    return this.create<AppUser>(this.User, data);
  }

  public async getUsersByDepartment(departmentId: string) {
    return this.User.find({ department: departmentId, isActive: true })
      .sort({ role: 1, name: 1 })
      .lean();
  }

  public async getAllUsers() {
    return this.User.find({}).populate("department", "name").sort({ name: 1 }).lean();
  }

  public async getUserById(userId: string) {
    return this.User.findById(userId).populate("department", "name").lean();
  }

  public async createScheduleEvent(
    data: Omit<ScheduleEvent, "_id" | "createdAt" | "updatedAt">
  ) {
    return this.create<ScheduleEvent>(this.ScheduleEvent, data);
  }

  public async getDepartmentSchedule(departmentId: string) {
    return this.ScheduleEvent.find({ department: departmentId })
      .sort({ startDate: 1 })
      .lean();
  }

  public async updateScheduleEvent(
    id: string,
    departmentId: string,
    data: Partial<
      Omit<ScheduleEvent, "_id" | "createdAt" | "updatedAt" | "department">
    >
  ) {
    return this.ScheduleEvent.findOneAndUpdate(
      { _id: id, department: departmentId },
      data,
      { new: true }
    ).lean();
  }

  public async deleteScheduleEvent(id: string, departmentId: string) {
    const deleted = await this.ScheduleEvent.findOneAndDelete({
      _id: id,
      department: departmentId,
    });
    return deleted !== null;
  }

  public async createLeaveRequest(
    data: Omit<LeaveRequest, "_id" | "createdAt" | "updatedAt">
  ) {
    return this.create<LeaveRequest>(this.LeaveRequest, data);
  }

  public async listLeaveRequestsByDepartment(departmentId: string) {
    return this.LeaveRequest.find({})
      .populate({
        path: "user",
        match: { department: departmentId },
        select: "name role department",
      })
      .sort({ startDate: -1 })
      .lean();
  }

  public async updateLeaveRequestStatus(
    id: string,
    status: "PENDING" | "APPROVED" | "REJECTED",
    notes?: string
  ) {
    return this.LeaveRequest.findByIdAndUpdate(
      id,
      { status, ...(notes !== undefined ? { notes } : {}) },
      { new: true }
    ).lean();
  }

  public async createDutyLog(
    data: Omit<DutyLog, "_id" | "createdAt" | "updatedAt">
  ) {
    return this.create<DutyLog>(this.DutyLog, data);
  }

  public async listDutyLogsByDepartment(departmentId: string) {
    return this.DutyLog.find({})
      .populate({
        path: "user",
        match: { department: departmentId },
        select: "name role department",
      })
      .sort({ date: -1 })
      .lean();
  }

  public async setDailyOverride(
    data: Omit<DailyCustomOverrideStatus, "_id" | "createdAt" | "updatedAt">
  ) {
    return this.DailyCustomOverrideStatus.findOneAndUpdate(
      {
        user: data.user,
        date: data.date,
      },
      { statusText: data.statusText },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
  }

  public async listDailyOverridesByDepartment(departmentId: string) {
    return this.DailyCustomOverrideStatus.find({})
      .populate({
        path: "user",
        match: { department: departmentId },
        select: "name role department",
      })
      .lean();
  }
}

export default DashboardMongoDBService;
