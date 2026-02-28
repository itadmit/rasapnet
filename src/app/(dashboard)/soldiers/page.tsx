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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

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
      toast.error("שגיאה בטעינת נתונים");
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">ניהול חיילים</h1>
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
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
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
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[160px]">
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם מלא</TableHead>
                <TableHead>טלפון</TableHead>
                <TableHead>מחלקה</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>הערות</TableHead>
                <TableHead className="text-left">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSoldiers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    לא נמצאו חיילים
                  </TableCell>
                </TableRow>
              ) : (
                filteredSoldiers.map((soldier) => (
                  <TableRow key={soldier.id}>
                    <TableCell className="font-medium">
                      {soldier.fullName}
                    </TableCell>
                    <TableCell dir="ltr" className="text-right">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        {soldier.phoneE164}
                      </div>
                    </TableCell>
                    <TableCell>{soldier.departmentName}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[soldier.status] || ""}
                      >
                        {statusLabels[soldier.status] || soldier.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                      {soldier.notes || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(soldier)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(soldier)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
