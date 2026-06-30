import BackendApiService from "@/app/api/backendServices/api.backendService";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";

export async function GET() {
  try {
    const db = await DashboardMongoDBService.getInstance();
    const departments = await db.getDepartments();
    const users = await db.getAllUsers();

    const grouped = departments.map((department) => {
      const departmentUsers = users
        .filter(
          (user: any) =>
            user.department &&
            user.department._id?.toString?.() === department._id.toString()
        )
        .map((user: any) => ({
          id: user._id,
          name: user.name,
          role: user.role,
          defaultPassword:
            user.role === "COMMANDER" ? "12345" : "1234",
        }));

      return {
        id: department._id,
        name: department.name,
        users: departmentUsers,
      };
    });

    return BackendApiService.successResponse({ departments: grouped });
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
