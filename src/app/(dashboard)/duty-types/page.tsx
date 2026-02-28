"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
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
import {
  ClipboardList,
  Plus,
  Pencil,
  Loader2,
  Weight,
  UsersRound,
  CalendarClock,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface DutyType {
  id: number;
  name: string;
  category: string;
  weightPoints: number;
  defaultRequiredPeople: number;
  defaultFrequency: string;
  scheduleType: string;
  rotationIntervalHours: number | null;
  defaultStartHour: number | null;
  defaultEndHour: number | null;
  isActive: boolean;
}

const categoryLabels: Record<string, string> = {
  מטבח: "מטבח",
  שירותים: "שירותים",
  ניקיון: "ניקיון",
  שמירות: "שמירות",
  אחר: "אחר",
};

const categoryColors: Record<string, string> = {
  מטבח: "bg-orange-100 text-orange-700",
  שירותים: "bg-cyan-100 text-cyan-700",
  ניקיון: "bg-lime-100 text-lime-700",
  שמירות: "bg-red-100 text-red-700",
  אחר: "bg-gray-100 text-gray-700",
};

const frequencyLabels: Record<string, string> = {
  daily: "יומי",
  weekly: "שבועי",
  monthly: "חודשי",
};

const scheduleTypeLabels: Record<string, string> = {
  daily: "יומי (פעם ביום)",
  hourly: "שעתי (החלפה כל X שעות)",
};

export default function DutyTypesPage() {
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<DutyType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "אחר",
    weightPoints: 1,
    defaultRequiredPeople: 1,
    defaultFrequency: "daily",
    scheduleType: "daily",
    rotationIntervalHours: 2,
    defaultStartHour: 8,
    defaultEndHour: 20,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await api<DutyType[]>("/api/duty-types");
      setDutyTypes(data);
    } catch {
      toast.error("שגיאה בטעינת נתונים");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddDialog = () => {
    setEditingType(null);
    setFormData({
      name: "",
      category: "אחר",
      weightPoints: 1,
      defaultRequiredPeople: 1,
      defaultFrequency: "daily",
      scheduleType: "daily",
      rotationIntervalHours: 2,
      defaultStartHour: 8,
      defaultEndHour: 20,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (dt: DutyType) => {
    setEditingType(dt);
    setFormData({
      name: dt.name,
      category: dt.category,
      weightPoints: dt.weightPoints,
      defaultRequiredPeople: dt.defaultRequiredPeople,
      defaultFrequency: dt.defaultFrequency,
      scheduleType: dt.scheduleType || "daily",
      rotationIntervalHours: dt.rotationIntervalHours ?? 2,
      defaultStartHour: dt.defaultStartHour ?? 8,
      defaultEndHour: dt.defaultEndHour ?? 20,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("נא להזין שם תורנות");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingType) {
        await api(`/api/duty-types/${editingType.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...formData,
            rotationIntervalHours: formData.scheduleType === "hourly" ? formData.rotationIntervalHours : null,
            defaultStartHour: formData.scheduleType === "hourly" ? formData.defaultStartHour : null,
            defaultEndHour: formData.scheduleType === "hourly" ? formData.defaultEndHour : null,
          }),
        });
        toast.success("סוג תורנות עודכן");
      } else {
        await api("/api/duty-types", {
          method: "POST",
          body: JSON.stringify({
            ...formData,
            rotationIntervalHours: formData.scheduleType === "hourly" ? formData.rotationIntervalHours : null,
            defaultStartHour: formData.scheduleType === "hourly" ? formData.defaultStartHour : null,
            defaultEndHour: formData.scheduleType === "hourly" ? formData.defaultEndHour : null,
          }),
        });
        toast.success("סוג תורנות נוסף");
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (dt: DutyType) => {
    try {
      await api(`/api/duty-types/${dt.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !dt.isActive }),
      });
      loadData();
      toast.success(dt.isActive ? "תורנות הושבתה" : "תורנות הופעלה");
    } catch {
      toast.error("שגיאה בעדכון");
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
          <ClipboardList className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">סוגי תורנויות</h1>
            <p className="text-sm text-muted-foreground">
              {dutyTypes.filter((d) => d.isActive).length} פעילים מתוך{" "}
              {dutyTypes.length}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף סוג תורנות
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingType ? "עריכת סוג תורנות" : "הוספת סוג תורנות"}
              </DialogTitle>
              <DialogDescription>
                הגדר את פרטי סוג התורנות
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>שם התורנות</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="למשל: מטבח ערב"
                />
              </div>
              <div className="space-y-2">
                <Label>קטגוריה</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>משקל נקודות</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.weightPoints}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weightPoints: parseFloat(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>כמות נדרשת</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.defaultRequiredPeople}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultRequiredPeople: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>תדירות ברירת מחדל</Label>
                <Select
                  value={formData.defaultFrequency}
                  onValueChange={(v) =>
                    setFormData({ ...formData, defaultFrequency: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(frequencyLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>סוג שיבוץ</Label>
                <Select
                  value={formData.scheduleType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, scheduleType: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(scheduleTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.scheduleType === "hourly" && (
                <>
                  <div className="space-y-2">
                    <Label>החלפה כל (שעות)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={formData.rotationIntervalHours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rotationIntervalHours: parseInt(e.target.value) || 2,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>שעת התחלה</Label>
                      <Input
                        type="number"
                        min={0}
                        max={23}
                        value={formData.defaultStartHour}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            defaultStartHour: parseInt(e.target.value) || 8,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>שעת סיום</Label>
                      <Input
                        type="number"
                        min={0}
                        max={24}
                        value={formData.defaultEndHour}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            defaultEndHour: parseInt(e.target.value) || 20,
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">ביטול</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                )}
                {editingType ? "שמור שינויים" : "הוסף"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards view */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dutyTypes.map((dt) => (
          <Card
            key={dt.id}
            className={`relative transition-opacity ${!dt.isActive ? "opacity-50" : ""}`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{dt.name}</h3>
                  <Badge
                    variant="secondary"
                    className={`mt-1 ${categoryColors[dt.category] || categoryColors["אחר"]}`}
                  >
                    {dt.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dt.isActive}
                    onCheckedChange={() => toggleActive(dt)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(dt)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Weight className="w-3.5 h-3.5" />
                  <span>{dt.weightPoints} נק׳</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UsersRound className="w-3.5 h-3.5" />
                  <span>{dt.defaultRequiredPeople} אנשים</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>{frequencyLabels[dt.defaultFrequency]}</span>
                </div>
                {dt.scheduleType === "hourly" && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground col-span-2 sm:col-span-3">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      שעתי: כל {dt.rotationIntervalHours} שעות ({dt.defaultStartHour ?? 8}:00–{dt.defaultEndHour ?? 20}:00)
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
