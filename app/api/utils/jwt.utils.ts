import jwt from "jsonwebtoken";

interface UserDetails {
  userId: string;
  email: string;
  role: string;
}

class JWTUtils {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || "";
  private static readonly JWT_EXPIRATION = "3h";

  static generateToken(userDetails: UserDetails) {
    const payload = {
      userId: userDetails.userId,
      email: userDetails.email,
      role: userDetails.role,
    };

    const token = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRATION,
    });

    return {
      token,
      expiresIn: this.JWT_EXPIRATION,
      user: userDetails,
    };
  }

  static async verifyToken(token: string) {
    try {
      const { jwtVerify } = await import("jose"); // Edge-compatible
      const secret = new TextEncoder().encode(this.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      return payload;
    } catch (error) {
      console.error("Token verification failed:", error);
      return null;
    }
  }

  static getTokenFromRequest(request: any): string | null {
    // Try Authorization header first
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    // Try cookies as fallback
    const cookieToken = request.cookies.get("auth-token")?.value;
    return cookieToken || null;
  }
}

export default JWTUtils;

