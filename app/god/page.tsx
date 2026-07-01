"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/app/contexts/AuthContext";
import GodFrontendService from "@/app/frontendServices/god.frontendService";

const toDateInputValue = (value?: string | Date) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export default function GodDashboardPage() {
  const router = useRouter();
  const { session, isLoading, isGodMode, logout } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({
    departmentName: "",
    commanderName: "",
    commanderPassword: "",
    initialOrderLabel: "צו ראשוני",
    initialOrderStartDate: "2026-07-02",
    initialOrderEndDate: toDateInputValue(new Date()),
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState({
    name: "",
    role: "SOLDIER" as "SOLDIER" | "COMMANDER",
    departmentId: "",
    password: "",
  });
  const [newOrderByDepartment, setNewOrderByDepartment] = useState<
    Record<string, { label: string; startDate: string; endDate: string }>
  >({});
  const [editingOrder, setEditingOrder] = useState<{
    departmentId: string;
    orderId: string;
    label: string;
    startDate: string;
    endDate: string;
  } | null>(null);

  const load = async () => {
    const response = await GodFrontendService.getOverview();
    if (!response.success) {
      toast.error(response.error || "טעינת God Mode נכשלה");
      return;
    }
    const departmentsData = response.data?.departments || [];
    setDepartments(departmentsData);
    setUsers(response.data?.users || []);
    setNewOrderByDepartment(
      Object.fromEntries(
        departmentsData.map((dep: any) => [
          String(dep._id),
          {
            label: "",
            startDate: "2026-07-02",
            endDate: toDateInputValue(new Date()),
          },
        ])
      )
    );
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
    const response = await GodFrontendService.createDepartment({
      departmentName: form.departmentName,
      commanderName: form.commanderName,
      commanderPassword: form.commanderPassword,
      employmentStartDate: form.initialOrderStartDate,
      initialOrderLabel: form.initialOrderLabel,
      initialOrderEndDate: form.initialOrderEndDate,
    });
    if (!response.success) {
      toast.error(response.error || "יצירת מחלקה נכשלה");
      return;
    }
    toast.success("מחלקה ומפקד נוצרו");
    setForm({
      departmentName: "",
      commanderName: "",
      commanderPassword: "",
      initialOrderLabel: "צו ראשוני",
      initialOrderStartDate: "2026-07-02",
      initialOrderEndDate: toDateInputValue(new Date()),
    });
    load();
  };

  const addOrder = async (departmentId: string) => {
    const draft = newOrderByDepartment[departmentId];
    if (!draft?.label || !draft?.startDate || !draft?.endDate) {
      toast.error("יש למלא שם צו ותאריכי התחלה/סיום");
      return;
    }

    const response = await GodFrontendService.addDepartmentOrder({
      id: departmentId,
      label: draft.label,
      startDate: draft.startDate,
      endDate: draft.endDate,
    });
    if (!response.success) {
      toast.error(response.error || "הוספת צו נכשלה");
      return;
    }

    toast.success("צו נוסף בהצלחה");
    load();
  };

  const setActiveOrder = async (departmentId: string, orderId: string) => {
    const response = await GodFrontendService.setActiveDepartmentOrder({
      id: departmentId,
      orderId,
    });
    if (!response.success) {
      toast.error(response.error || "עדכון צו פעיל נכשל");
      return;
    }
    toast.success("צו פעיל עודכן");
    load();
  };

  const beginEditOrder = (departmentId: string, order: any) => {
    setEditingOrder({
      departmentId,
      orderId: String(order._id),
      label: order.label || "",
      startDate: toDateInputValue(order.startDate),
      endDate: toDateInputValue(order.endDate),
    });
  };

  const cancelEditOrder = () => setEditingOrder(null);

  const saveOrderEdit = async () => {
    if (!editingOrder) return;
    const response = await GodFrontendService.editDepartmentOrder({
      id: editingOrder.departmentId,
      orderId: editingOrder.orderId,
      label: editingOrder.label,
      startDate: editingOrder.startDate,
      endDate: editingOrder.endDate,
    });
    if (!response.success) {
      toast.error(response.error || "עדכון צו נכשל");
      return;
    }
    toast.success("צו עודכן");
    setEditingOrder(null);
    load();
  };

  const removeOrder = async (departmentId: string, orderId: string) => {
    const shouldDelete = window.confirm("למחוק צו זה?");
    if (!shouldDelete) return;
    const response = await GodFrontendService.deleteDepartmentOrder({
      id: departmentId,
      orderId,
    });
    if (!response.success) {
      toast.error(response.error || "מחיקת צו נכשלה");
      return;
    }
    toast.success("צו נמחק");
    if (editingOrder?.orderId === orderId) {
      setEditingOrder(null);
    }
    load();
  };

  const startEditUser = (user: any) => {
    setEditingUserId(String(user._id));
    setEditingUser({
      name: user.name || "",
      role: user.role,
      departmentId: String(user.department?._id || user.department || ""),
      password: "",
    });
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditingUser({
      name: "",
      role: "SOLDIER",
      departmentId: "",
      password: "",
    });
  };

  const saveEditUser = async (userId: string) => {
    if (!editingUser.name.trim() || !editingUser.departmentId) {
      toast.error("יש למלא שם ומחלקה");
      return;
    }

    const response = await GodFrontendService.updateUser({
      id: userId,
      name: editingUser.name.trim(),
      role: editingUser.role,
      department: editingUser.departmentId,
      ...(editingUser.password.trim() ? { password: editingUser.password.trim() } : {}),
    });
    if (!response.success) {
      toast.error(response.error || "עדכון משתמש נכשל");
      return;
    }

    toast.success("משתמש עודכן בהצלחה");
    cancelEditUser();
    load();
  };

  const deleteUser = async (userId: string) => {
    const shouldDelete = window.confirm("למחוק משתמש זה?");
    if (!shouldDelete) return;

    const response = await GodFrontendService.deleteUser(userId);
    if (!response.success) {
      toast.error(response.error || "מחיקת משתמש נכשלה");
      return;
    }

    toast.success("משתמש נמחק בהצלחה");
    if (editingUserId === userId) {
      cancelEditUser();
    }
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
              <Input
                placeholder="שם הצו הראשוני"
                value={form.initialOrderLabel}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, initialOrderLabel: e.target.value }))
                }
              />
              <Input
                type="date"
                value={form.initialOrderStartDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, initialOrderStartDate: e.target.value }))
                }
              />
              <Input
                type="date"
                value={form.initialOrderEndDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, initialOrderEndDate: e.target.value }))
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
              <div key={dep._id} className="rounded border bg-white p-3 space-y-2">
                <div className="font-medium">{dep.name}</div>
                <div className="space-y-2">
                  {Array.isArray(dep.orders) && dep.orders.length > 0 ? (
                    dep.orders.map((order: any) => {
                      const isActive =
                        String(order._id) === String(dep.activeOrderId || "");
                      const isEditing =
                        editingOrder &&
                        editingOrder.departmentId === String(dep._id) &&
                        editingOrder.orderId === String(order._id);
                      return (
                        <div key={order._id} className="rounded border p-2">
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                value={editingOrder.label}
                                onChange={(e) =>
                                  setEditingOrder((prev) =>
                                    prev ? { ...prev, label: e.target.value } : prev
                                  )
                                }
                              />
                              <div className="grid gap-2 md:grid-cols-2">
                                <Input
                                  type="date"
                                  value={editingOrder.startDate}
                                  onChange={(e) =>
                                    setEditingOrder((prev) =>
                                      prev ? { ...prev, startDate: e.target.value } : prev
                                    )
                                  }
                                />
                                <Input
                                  type="date"
                                  value={editingOrder.endDate}
                                  onChange={(e) =>
                                    setEditingOrder((prev) =>
                                      prev ? { ...prev, endDate: e.target.value } : prev
                                    )
                                  }
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={saveOrderEdit}>
                                  שמור
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEditOrder}>
                                  בטל
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="font-medium">
                                {order.label} {isActive ? "(פעיל)" : ""}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {toDateInputValue(order.startDate)} - {toDateInputValue(order.endDate)}
                              </div>
                              <div className="mt-2 flex gap-2">
                                {!isActive && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setActiveOrder(String(dep._id), String(order._id))}
                                  >
                                    קבע כפעיל
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => beginEditOrder(String(dep._id), order)}
                                >
                                  ערוך
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeOrder(String(dep._id), String(order._id))}
                                >
                                  מחק
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-muted-foreground">אין צווים מוגדרים</div>
                  )}
                </div>
                <div className="rounded border p-2 space-y-2">
                  <div className="text-xs font-medium">הוספת צו חדש</div>
                  <Input
                    placeholder="שם צו"
                    value={newOrderByDepartment[String(dep._id)]?.label || ""}
                    onChange={(e) =>
                      setNewOrderByDepartment((prev) => ({
                        ...prev,
                        [String(dep._id)]: {
                          ...(prev[String(dep._id)] || {
                            label: "",
                            startDate: "2026-07-02",
                            endDate: toDateInputValue(new Date()),
                          }),
                          label: e.target.value,
                        },
                      }))
                    }
                  />
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input
                      type="date"
                      value={newOrderByDepartment[String(dep._id)]?.startDate || "2026-07-02"}
                      onChange={(e) =>
                        setNewOrderByDepartment((prev) => ({
                          ...prev,
                          [String(dep._id)]: {
                            ...(prev[String(dep._id)] || {
                              label: "",
                              startDate: "2026-07-02",
                              endDate: toDateInputValue(new Date()),
                            }),
                            startDate: e.target.value,
                          },
                        }))
                      }
                    />
                    <Input
                      type="date"
                      value={newOrderByDepartment[String(dep._id)]?.endDate || toDateInputValue(new Date())}
                      onChange={(e) =>
                        setNewOrderByDepartment((prev) => ({
                          ...prev,
                          [String(dep._id)]: {
                            ...(prev[String(dep._id)] || {
                              label: "",
                              startDate: "2026-07-02",
                              endDate: toDateInputValue(new Date()),
                            }),
                            endDate: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addOrder(String(dep._id))}>
                    הוסף צו
                  </Button>
                </div>
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
                {editingUserId === String(user._id) ? (
                  <div className="space-y-3">
                    <Input
                      placeholder="שם מלא"
                      value={editingUser.name}
                      onChange={(e) =>
                        setEditingUser((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editingUser.role}
                      onChange={(e) =>
                        setEditingUser((prev) => ({
                          ...prev,
                          role: e.target.value as "SOLDIER" | "COMMANDER",
                        }))
                      }
                    >
                      <option value="SOLDIER">חייל</option>
                      <option value="COMMANDER">מפקד</option>
                    </select>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editingUser.departmentId}
                      onChange={(e) =>
                        setEditingUser((prev) => ({
                          ...prev,
                          departmentId: e.target.value,
                        }))
                      }
                    >
                      <option value="">בחר מחלקה</option>
                      {departments.map((dep) => (
                        <option key={dep._id} value={dep._id}>
                          {dep.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="password"
                      placeholder="סיסמה חדשה (אופציונלי)"
                      value={editingUser.password}
                      onChange={(e) =>
                        setEditingUser((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEditUser(String(user._id))}>
                        שמור
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditUser}>
                        בטל
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>שם: {user.name}</div>
                    <div>תפקיד: {user.role === "COMMANDER" ? "מפקד" : "חייל"}</div>
                    <div>מחלקה: {(user.department as any)?.name || "-"}</div>
                    <div>סיסמה: {user.password}</div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditUser(user)}
                      >
                        ערוך
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteUser(String(user._id))}
                      >
                        מחק
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
