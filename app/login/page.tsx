"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AdminFrontendService from "@/app/frontendServices/admin.frontendService";
import { useAuth } from "@/app/contexts/AuthContext";

type DepartmentOption = {
  id: string;
  name: string;
  users: Array<{ id: string; name: string; role: string }>;
};

export default function LoginPage() {
  const router = useRouter();
  const { checkAuth, isAuthenticated } = useAuth();
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [godPassword, setGodPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const users = useMemo(
    () => departments.find((dep) => dep.id === departmentId)?.users || [],
    [departments, departmentId]
  );

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
      return;
    }

    const load = async () => {
      const response = await AdminFrontendService.getDepartmentsAndUsers();
      if (response.success && response.data) {
        setDepartments(response.data.departments);
      }
    };
    load();
  }, [isAuthenticated, router]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await AdminFrontendService.login({ userId, password });
      if (!response.success) {
        toast.error(response.error || "התחברות נכשלה");
        return;
      }

      await checkAuth();
      toast.success("התחברת בהצלחה");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleGodLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await AdminFrontendService.godLogin(godPassword);
      if (!response.success) {
        toast.error(response.error || "כניסת God Mode נכשלה");
        return;
      }

      await checkAuth();
      toast.success("כניסה ל-God Mode בוצעה בהצלחה");
      router.push("/god");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>כניסת חייל/מפקד</CardTitle>
            <CardDescription>
              בחר מחלקה, בחר משתמש והזן סיסמה
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="department">מחלקה</Label>
                <select
                  id="department"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setUserId("");
                  }}
                  required
                >
                  <option value="">בחר מחלקה</option>
                  {departments.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user">משתמש</Label>
                <select
                  id="user"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                >
                  <option value="">בחר משתמש</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role === "COMMANDER" ? "מפקד" : "חייל"})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="הזן סיסמה"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                התחבר
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>God Mode</CardTitle>
            <CardDescription>
              כניסה לניהול גלובלי של מחלקות ומשתמשים
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleGodLogin}>
              <div className="space-y-2">
                <Label htmlFor="godPassword">סיסמת מאסטר</Label>
                <Input
                  id="godPassword"
                  type="password"
                  value={godPassword}
                  onChange={(e) => setGodPassword(e.target.value)}
                  placeholder="הזן סיסמת God Mode"
                  required
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
                כניסה ל-God Mode
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
