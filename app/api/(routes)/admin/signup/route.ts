import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import PasswordUtils from "@/app/api/utils/password.utils";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return BackendApiService.errorResponse(
        "Name, email, and password are required",
        400
      );
    }

    console.log("sagy2");

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return BackendApiService.errorResponse("Invalid email format", 400);
    }

    // Password validation
    if (password.length < 8) {
      return BackendApiService.errorResponse(
        "Password must be at least 8 characters",
        400
      );
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    // Check if admin already exists
    const existingAdmin = await mongoService.findAdminByEmail(email);
    if (existingAdmin) {
      return BackendApiService.errorResponse(
        "Admin with this email already exists",
        409
      );
    }

    // Hash password
    const passwordHash = await PasswordUtils.hashPassword(password);

    // Create admin
    const admin = await mongoService.createAdmin({
      name,
      email,
      passwordHash,
      role: role || "ADMIN",
      isActive: true,
    });

    return BackendApiService.successResponse(
      {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      "Admin created successfully"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}
