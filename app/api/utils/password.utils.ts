import bcrypt from "bcrypt";

class PasswordUtils {
  private static readonly SALT_ROUNDS = 12;

  static async hashPassword(password: string): Promise<string> {
    const pepper = process.env.PASSWORD_PEPPER || "";
    const pepperedPassword = password + pepper;
    return await bcrypt.hash(pepperedPassword, this.SALT_ROUNDS);
  }

  static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    const pepper = process.env.PASSWORD_PEPPER || "";
    const pepperedPassword = password + pepper;
    return await bcrypt.compare(pepperedPassword, hash);
  }
}

export default PasswordUtils;
