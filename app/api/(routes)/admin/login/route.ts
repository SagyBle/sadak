import { NextRequest } from "next/server";
import DashboardMongoDBService from "@/app/api/backendServices/mongodb/dashboard/dashboardMongodb.backendService";
import PasswordUtils from "@/app/api/utils/password.utils";
import JWTUtils from "@/app/api/utils/jwt.utils";
import BackendApiService from "@/app/api/backendServices/api.backendService";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return BackendApiService.errorResponse("Email and password are required", 400);
    }

    const mongoService = await DashboardMongoDBService.getInstance();

    // Find admin by email
    const admin = await mongoService.findAdminByEmail(email);
    if (!admin) {
      return BackendApiService.errorResponse("Invalid credentials", 401);
    }

    // Check if admin is active
    if (!admin.isActive) {
      return BackendApiService.errorResponse("Account is inactive", 403);
    }

    // Verify password
    const isPasswordValid = await PasswordUtils.verifyPassword(password, admin.passwordHash);
    if (!isPasswordValid) {
      return BackendApiService.errorResponse("Invalid credentials", 401);
    }

    // Generate JWT token
    const { token, expiresIn, user } = JWTUtils.generateToken({
      userId: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    });

    return BackendApiService.successResponse(
      {
        token,
        expiresIn,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
      "Login successful"
    );
  } catch (error) {
    return BackendApiService.handleError(error);
  }
}

