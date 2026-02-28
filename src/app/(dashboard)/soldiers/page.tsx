"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataList, DataListItem, DataListEmpty } from "@/components/data-list";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Phone,
  ShieldOff,
  Building2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { EXEMPTION_CODES, EXEMPTION_LABELS } from "@/lib/exemptions";

interface Department {
  id: number;
  name: string;
}

interface Soldier {
  id: number;
  fullName: string;
  phoneE164: string;
  departmentId: number;
  departmentName: string;
  status: string;
  excludeFromAutoSchedule: boolean;
  exemptions: string[];
  notes: string | null;
}

const statusLabels: Record<string, string> = {
  active: "פעיל",
  training: "בהכשרה",
  exempt: "פטור זמני",
  vacation: "בחופשה",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  training: "bg-blue-100 text-blue-700",
  exempt: "bg-amber-100 text-amber-700",
  vacation: "bg-gray-100 text-gray-700",
};

export default function SoldiersPage() {
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterDept, setFilterDept] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSoldier, setEditingSoldier] = useState<Soldier | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneE164: "",
    departmentId: "",
    status: "active",
    excludeFromAutoSchedule: false,
    exemptions: [] as string[],
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [soldiersData, deptsData] = await Promise.all([
        api<Soldier[]>("/api/soldiers"),
        api<Department[]>("/api/departments"),
      ]);
      setSoldiers(soldiersData);
      setDepartments(deptsData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה בטעינת נתונים");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSoldiers = soldiers.filter((s) => {
    if (filterDept !== "all" && s.departmentId !== parseInt(filterDept))
      return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (
      searchQuery &&
      !s.fullName.includes(searchQuery) &&
      !s.phoneE164.includes(searchQuery)
    )
      return false;
    return true;
  });

  const openAddDialog = () => {
    setEditingSoldier(null);
    setFormData({
      fullName: "",
      phoneE164: "",
      departmentId: departments[0]?.id?.toString() || "",
      status: "active",
      excludeFromAutoSchedule: false,
      exemptions: [],
      notes: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (soldier: Soldier) => {
    setEditingSoldier(soldier);
    setFormData({
      fullName: soldier.fullName,
      phoneE164: soldier.phoneE164,
      departmentId: soldier.departmentId.toString(),
      status: soldier.status,
      excludeFromAutoSchedule: soldier.excludeFromAutoSchedule ?? false,
      exemptions: soldier.exemptions ?? [],
      notes: soldier.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.fullName.trim() || !formData.phoneE164.trim() || !formData.departmentId) {
      toast.error("נא למלא שם, טלפון ומחלקה");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSoldier) {
        await api(`/api/soldiers/${editingSoldier.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        toast.success("חייל עודכן בהצלחה");
      } else {
        await api("/api/soldiers", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        toast.success("חייל נוסף בהצלחה");
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (soldier: Soldier) => {
    if (!confirm(`למחוק את ${soldier.fullName}?`)) return;
    try {
      await api(`/api/soldiers/${soldier.id}`, { method: "DELETE" });
      toast.success("חייל נמחק");
      loadData();
    } catch {
      toast.error("שגיאה במחיקה");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-primary shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">ניהול חיילים</h1>
            <p className="text-sm text-muted-foreground">
              {soldiers.length} חיילים במערכת
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף חייל
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSoldier ? "עריכת חייל" : "הוספת חייל חדש"}
              </DialogTitle>
              <DialogDescription>
                {editingSoldier
                  ? "עדכן את פרטי החייל"
                  : "מלא את הפרטים להוספת חייל חדש"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>שם מלא</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="ישראל ישראלי"
                />
              </div>
              <div className="space-y-2">
                <Label>טלפון (E.164)</Label>
                <Input
                  value={formData.phoneE164}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneE164: e.target.value })
                  }
                  placeholder="972501234567"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>מחלקה</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, departmentId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מחלקה" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>סטטוס</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData({ ...formData, status: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">לא לשבץ אוטומטית</Label>
                  <p className="text-sm text-muted-foreground">
                    מפקדים וסגנים – לא ייכללו בשיבוץ אוטומטי
                  </p>
                </div>
                <Switch
                  checked={formData.excludeFromAutoSchedule}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, excludeFromAutoSchedule: v })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>פטורים</Label>
                <p className="text-sm text-muted-foreground">
                  חייל עם פטור לא יישובץ לסוג התורנות המתאים
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  {EXEMPTION_CODES.map((code) => (
                    <div key={code} className="flex items-center gap-2">
                      <Switch
                        id={`exempt-${code}`}
                        checked={formData.exemptions.includes(code)}
                        onCheckedChange={(checked) => {
                          setFormData((prev) => ({
                            ...prev,
                            exemptions: checked
                              ? [...prev.exemptions, code]
                              : prev.exemptions.filter((c) => c !== code),
                          }));
                        }}
                      />
                      <Label htmlFor={`exempt-${code}`} className="cursor-pointer text-sm font-normal">
                        {EXEMPTION_LABELS[code]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>הערות</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="הערות, מגבלות רפואיות וכו׳"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">ביטול</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                )}
                {editingSoldier ? "שמור שינויים" : "הוסף"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            <div className="flex-1 min-w-0 sm:min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש לפי שם או טלפון..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="כל המחלקות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המחלקות</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="כל הסטטוסים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List - iOS style, no horizontal scroll */}
      <DataList>
        {filteredSoldiers.length === 0 ? (
          <DataListEmpty message="לא נמצאו חיילים" />
        ) : (
          filteredSoldiers.map((soldier) => (
            <DataListItem
              key={soldier.id}
              icon={<Users className="w-5 h-5" />}
              title={
                <div className="flex items-center gap-2 flex-wrap">
                  {soldier.excludeFromAutoSchedule && (
                    <ShieldOff className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  {soldier.fullName}
                  {(soldier.exemptions ?? []).length > 0 && (
                    <span className="flex items-center gap-1 flex-wrap">
                      {(soldier.exemptions ?? []).map((code) => (
                        <Badge key={code} variant="outline" className="text-xs">
                          {EXEMPTION_LABELS[code as keyof typeof EXEMPTION_LABELS] ?? code}
                        </Badge>
                      ))}
                    </span>
                  )}
                </div>
              }
              subtitle={soldier.notes || undefined}
              meta={[
                { icon: <Phone className="w-3.5 h-3.5" />, value: <span dir="ltr">{soldier.phoneE164}</span> },
                { icon: <Building2 className="w-3.5 h-3.5" />, value: soldier.departmentName },
                {
                  icon: null,
                  value: (
                    <Badge variant="secondary" className={statusColors[soldier.status] || ""}>
                      {statusLabels[soldier.status] || soldier.status}
                    </Badge>
                  ),
                },
              ]}
              actions={
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(soldier)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(soldier)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              }
            />
          ))
        )}
      </DataList>
    </div>
  );
}
