import { Model, Types } from "mongoose";
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
  private static readonly DEFAULT_ORDER_START_DATE = "2026-07-02";

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

  public async getDepartmentById(id: string) {
    return this.Department.findById(id).lean();
  }

  public async ensureDepartmentHasDefaultOrder(id: string) {
    const department = await this.Department.findById(id);
    if (!department) return null;

    const hasOrders =
      Array.isArray((department as any).orders) &&
      (department as any).orders.length > 0;
    const activeId = String((department as any).activeOrderId || "");
    const hasValidActive =
      hasOrders &&
      (department as any).orders.some(
        (item: any) => String(item._id) === activeId
      );
    if (hasOrders && hasValidActive) {
      return department.toObject();
    }

    const startDate = (department as any).employmentStartDate
      ? new Date((department as any).employmentStartDate)
      : new Date(DashboardMongoDBService.DEFAULT_ORDER_START_DATE);
    const endDate = new Date();
    const defaultOrderId = new Types.ObjectId();

    if (!hasOrders) {
      (department as any).orders = [
        {
          _id: defaultOrderId,
          label: "צו ברירת מחדל",
          startDate,
          endDate,
        },
      ];
    }

    if (!hasValidActive) {
      const firstOrderId = (department as any).orders?.[0]?._id || defaultOrderId;
      (department as any).activeOrderId = firstOrderId;
    }

    await department.save();
    return department.toObject();
  }

  public async updateDepartmentEmploymentStartDate(
    id: string,
    employmentStartDate: Date
  ) {
    return this.Department.findByIdAndUpdate(
      id,
      { employmentStartDate },
      { new: true }
    ).lean();
  }

  public async addDepartmentOrder(
    departmentId: string,
    payload: { label: string; startDate: Date; endDate: Date }
  ) {
    const department = await this.Department.findById(departmentId);
    if (!department) return null;

    const orderId = new Types.ObjectId();
    (department as any).orders = [
      ...((department as any).orders || []),
      { _id: orderId, ...payload },
    ];
    if (!(department as any).activeOrderId) {
      (department as any).activeOrderId = orderId;
    }

    await department.save();
    return department.toObject();
  }

  public async updateDepartmentOrder(
    departmentId: string,
    orderId: string,
    payload: Partial<{ label: string; startDate: Date; endDate: Date }>
  ) {
    const department = await this.Department.findById(departmentId);
    if (!department) return null;

    const orders = (department as any).orders || [];
    const target = orders.find((item: any) => String(item._id) === orderId);
    if (!target) return null;

    if (payload.label !== undefined) target.label = payload.label;
    if (payload.startDate !== undefined) target.startDate = payload.startDate;
    if (payload.endDate !== undefined) target.endDate = payload.endDate;

    await department.save();
    return department.toObject();
  }

  public async deleteDepartmentOrder(departmentId: string, orderId: string) {
    const department = await this.Department.findById(departmentId);
    if (!department) return null;

    const before = ((department as any).orders || []).length;
    (department as any).orders = ((department as any).orders || []).filter(
      (item: any) => String(item._id) !== orderId
    );

    if (((department as any).orders || []).length === before) {
      return null;
    }

    if (String((department as any).activeOrderId || "") === orderId) {
      (department as any).activeOrderId = (department as any).orders?.[0]?._id || undefined;
    }

    await department.save();
    return department.toObject();
  }

  public async setActiveDepartmentOrder(departmentId: string, orderId: string) {
    const department = await this.Department.findById(departmentId);
    if (!department) return null;

    const exists = ((department as any).orders || []).some(
      (item: any) => String(item._id) === orderId
    );
    if (!exists) return null;

    (department as any).activeOrderId = new Types.ObjectId(orderId);
    await department.save();
    return department.toObject();
  }

  public async createUser(data: Omit<AppUser, "_id" | "createdAt" | "updatedAt">) {
    return this.create<AppUser>(this.User, data);
  }

  public async getUsersByDepartment(departmentId: string) {
    return this.User.find({ department: departmentId, isActive: true })
      .sort({ role: 1, name: 1 })
      .lean();
  }

  public async getAllUsers(includeInactive = false) {
    return this.User.find(includeInactive ? {} : { isActive: true })
      .populate("department", "name")
      .sort({ name: 1 })
      .lean();
  }

  public async getUserById(userId: string) {
    return this.User.findById(userId).populate("department", "name").lean();
  }

  public async updateUserByGod(
    userId: string,
    data: Partial<
      Pick<AppUser, "name" | "role" | "department" | "password">
    >
  ) {
    return this.User.findByIdAndUpdate(userId, data, { new: true })
      .populate("department", "name")
      .lean();
  }

  public async softDeleteUserByGod(userId: string) {
    const updated = await this.User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).lean();
    return updated !== null;
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

  public async listLeaveRequestsByUser(userId: string) {
    return this.LeaveRequest.find({ user: userId })
      .populate("user", "name role department")
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

  public async updatePendingLeaveRequestForUser(
    id: string,
    userId: string,
    data: Partial<Pick<LeaveRequest, "startDate" | "endDate" | "reason" | "requestType" | "notes">>
  ) {
    return this.LeaveRequest.findOneAndUpdate(
      { _id: id, user: userId, status: "PENDING" },
      data,
      { new: true }
    )
      .populate("user", "name role department")
      .lean();
  }

  public async deletePendingLeaveRequestForUser(id: string, userId: string) {
    const deleted = await this.LeaveRequest.findOneAndDelete({
      _id: id,
      user: userId,
      status: "PENDING",
    });
    return deleted !== null;
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

  public async listDutyLogsByUser(userId: string) {
    return this.DutyLog.find({ user: userId })
      .populate("user", "name role department")
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
