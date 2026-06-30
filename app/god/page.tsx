"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/app/contexts/AuthContext";
import GodFrontendService from "@/app/frontendServices/god.frontendService";

export default function GodDashboardPage() {
  const router = useRouter();
  const { session, isLoading, isGodMode, logout } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({
    departmentName: "",
    commanderName: "",
    commanderPassword: "",
  });

  const load = async () => {
    const response = await GodFrontendService.getOverview();
    if (!response.success) {
      toast.error(response.error || "טעינת God Mode נכשלה");
      return;
    }
    setDepartments(response.data?.departments || []);
    setUsers(response.data?.users || []);
  };

  useEffect(() => {
    if (isLoading) return;
    if (!session || !isGodMode) {
      router.push("/login");
      return;
    }
    load();
  }, [isLoading, isGodMode, session, router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await GodFrontendService.createDepartment(form);
    if (!response.success) {
      toast.error(response.error || "יצירת מחלקה נכשלה");
      return;
    }
    toast.success("מחלקה ומפקד נוצרו");
    setForm({ departmentName: "", commanderName: "", commanderPassword: "" });
    load();
  };

  if (!session || isLoading) {
    return <div className="p-8">טוען...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="flex items-center justify-between rounded border bg-white p-4">
          <h1 className="text-xl font-bold">God Mode Dashboard</h1>
          <Button
            variant="outline"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            התנתק
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>יצירת מחלקה ומפקד ראשוני</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-3" onSubmit={submit}>
              <Input
                placeholder="שם מחלקה"
                value={form.departmentName}
                onChange={(e) => setForm((prev) => ({ ...prev, departmentName: e.target.value }))}
                required
              />
              <Input
                placeholder="שם המפקד הראשוני"
                value={form.commanderName}
                onChange={(e) => setForm((prev) => ({ ...prev, commanderName: e.target.value }))}
                required
              />
              <Input
                placeholder="סיסמה (אופציונלי)"
                value={form.commanderPassword}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, commanderPassword: e.target.value }))
                }
              />
              <Button type="submit" className="md:col-span-3">
                צור מחלקה ומפקד
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>מחלקות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {departments.map((dep) => (
              <div key={dep._id} className="rounded border bg-white p-2">
                {dep.name}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>משתמשים וסיסמאות (Plain Text)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {users.map((user) => (
              <div key={user._id} className="rounded border bg-white p-3">
                <div>שם: {user.name}</div>
                <div>תפקיד: {user.role === "COMMANDER" ? "מפקד" : "חייל"}</div>
                <div>מחלקה: {(user.department as any)?.name || "-"}</div>
                <div>סיסמה: {user.password}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
