import ApiService from "./api.frontendService";

class GodFrontendService {
  static getOverview() {
    return ApiService.get<{ departments: any[]; users: any[] }>("/god/overview");
  }

  static createDepartment(payload: {
    departmentName: string;
    commanderName: string;
    commanderPassword?: string;
    employmentStartDate?: string;
    initialOrderLabel?: string;
    initialOrderEndDate?: string;
  }) {
    return ApiService.post<{ department: any; commander: any }>(
      "/god/create-department",
      payload
    );
  }

  static updateUser(payload: {
    id: string;
    name?: string;
    role?: "SOLDIER" | "COMMANDER";
    department?: string;
    password?: string;
  }) {
    return ApiService.patch<{ user: any }>("/god/users", payload);
  }

  static deleteUser(id: string) {
    return ApiService.delete<{ id: string }>("/god/users", { id });
  }

  static addDepartmentOrder(payload: {
    id: string;
    label: string;
    startDate: string;
    endDate: string;
  }) {
    return ApiService.patch<{ department: any }>("/god/departments", {
      ...payload,
      action: "ADD_ORDER",
    });
  }

  static editDepartmentOrder(payload: {
    id: string;
    orderId: string;
    label?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return ApiService.patch<{ department: any }>("/god/departments", {
      ...payload,
      action: "EDIT_ORDER",
    });
  }

  static deleteDepartmentOrder(payload: { id: string; orderId: string }) {
    return ApiService.patch<{ department: any }>("/god/departments", {
      ...payload,
      action: "DELETE_ORDER",
    });
  }

  static setActiveDepartmentOrder(payload: { id: string; orderId: string }) {
    return ApiService.patch<{ department: any }>("/god/departments", {
      ...payload,
      action: "SET_ACTIVE_ORDER",
    });
  }
}

export default GodFrontendService;
