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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Plus,
  Loader2,
  Wand2,
  CheckCircle2,
  XCircle,
  X,
  Clock,
  Users,
  ShieldOff,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface DutyType {
  id: number;
  name: string;
  category: string;
  weightPoints: number;
  defaultRequiredPeople: number;
  scheduleType?: string;
  rotationIntervalHours?: number | null;
  defaultStartHour?: number | null;
  defaultEndHour?: number | null;
  isActive?: boolean;
}

interface Assignment {
  id: number;
  soldierId: number;
  soldierName: string;
  slotStartAt: string | null;
  slotEndAt: string | null;
  isConfirmed: boolean;
  doneAt: string | null;
}

interface DutyEvent {
  id: number;
  dutyTypeId: number;
  dutyTypeName: string;
  dutyTypeCategory: string;
  weightPoints: number;
  scheduleType?: string;
  startAt: string;
  endAt: string | null;
  status: string;
  notes: string | null;
  assignments: Assignment[];
}

interface Soldier {
  id: number;
  fullName: string;
  departmentName: string;
  status: string;
}

const hebrewDays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

const statusLabels: Record<string, string> = {
  planned: "מתוכנן",
  done: "בוצע",
  swapped: "הוחלף",
  canceled: "בוטל",
  missed: "לא בוצע",
};

const statusColors: Record<string, string> = {
  planned: "bg-blue-100 text-blue-700 border-blue-200",
  done: "bg-green-100 text-green-700 border-green-200",
  swapped: "bg-amber-100 text-amber-700 border-amber-200",
  canceled: "bg-red-100 text-red-700 border-red-200",
  missed: "bg-gray-100 text-gray-700 border-gray-200",
};

function getWeekDates(date: Date): Date[] {
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(start.getDate() - day);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function SchedulePage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [events, setEvents] = useState<DutyEvent[]>([]);
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([]);
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New event dialog
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventType, setNewEventType] = useState("");
  const [newEventSoldiers, setNewEventSoldiers] = useState<string[]>([]);

  // Auto schedule dialog
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoFrom, setAutoFrom] = useState("");
  const [autoTo, setAutoTo] = useState("");
  const [autoDutyTypeId, setAutoDutyTypeId] = useState<string>("all");
  const [autoExcludeCommanders, setAutoExcludeCommanders] = useState(true);
  const [autoLoading, setAutoLoading] = useState(false);

  // Event detail dialog
  const [detailEvent, setDetailEvent] = useState<DutyEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAutoAssignLoading, setDetailAutoAssignLoading] = useState(false);
  const [detailManualAssignLoading, setDetailManualAssignLoading] = useState(false);
  const [detailRemoveAssignLoading, setDetailRemoveAssignLoading] = useState<number | null>(null);

  // Delete week dialog (double confirmation)
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);

  const weekDates = getWeekDates(currentWeek);
  const fromStr = formatDateStr(weekDates[0]);
  const toStr = formatDateStr(weekDates[6]) + "T23:59:59";

  const loadData = useCallback(async () => {
    try {
      const [eventsData, typesData, soldiersData] = await Promise.all([
        api<DutyEvent[]>(`/api/duty-events?from=${fromStr}&to=${toStr}`),
        api<DutyType[]>("/api/duty-types"),
        api<Soldier[]>("/api/soldiers"),
      ]);
      setEvents(eventsData);
      setDutyTypes(typesData.filter((t) => t.id)); // all
      setSoldiers(soldiersData.filter((s) => s.status === "active"));
      return eventsData;
    } catch {
      toast.error("שגיאה בטעינת נתונים");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [fromStr, toStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const prevWeek = () => {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() - 7);
    setCurrentWeek(d);
  };

  const nextWeek = () => {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() + 7);
    setCurrentWeek(d);
  };

  const goToday = () => setCurrentWeek(new Date());

  const getEventsForDay = (date: Date) => {
    const ds = formatDateStr(date);
    return events.filter((e) => e.startAt.startsWith(ds));
  };

  const openNewEvent = (date: Date) => {
    setNewEventDate(formatDateStr(date));
    setNewEventType(dutyTypes[0]?.id?.toString() || "");
    setNewEventSoldiers([]);
    setNewEventOpen(true);
  };

  const handleCreateEvent = async () => {
    if (!newEventType || !newEventDate) {
      toast.error("נא לבחור סוג תורנות ותאריך");
      return;
    }
    const dt = dutyTypes.find((t) => t.id.toString() === newEventType);
    const isHourly = dt?.scheduleType === "hourly";
    const startH = dt?.defaultStartHour ?? 8;
    const endH = dt?.defaultEndHour ?? 20;
    setIsSubmitting(true);
    try {
      const result = await api<{ id: number }>("/api/duty-events", {
        method: "POST",
        body: JSON.stringify({
          dutyTypeId: newEventType,
          startAt: `${newEventDate}T${String(startH).padStart(2, "0")}:00:00`,
          endAt: isHourly ? `${newEventDate}T${String(endH).padStart(2, "0")}:00:00` : undefined,
        }),
      });

      if (newEventSoldiers.length > 0) {
        await api(`/api/duty-events/${result.id}/assign`, {
          method: "POST",
          body: JSON.stringify({ soldierIds: newEventSoldiers }),
        });
      }

      toast.success("אירוע תורנות נוצר");
      setNewEventOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSchedule = async () => {
    if (!autoFrom || !autoTo) {
      toast.error("נא לבחור טווח תאריכים");
      return;
    }
    setAutoLoading(true);
    try {
      const result = await api<{ message: string; created: unknown[] }>(
        "/api/auto-schedule",
        {
          method: "POST",
          body: JSON.stringify({
            fromDate: autoFrom,
            toDate: autoTo,
            dutyTypeIds: autoDutyTypeId === "all" ? undefined : [parseInt(autoDutyTypeId)],
            excludeCommanders: autoExcludeCommanders,
          }),
        }
      );
      toast.success(result.message);
      setAutoOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setAutoLoading(false);
    }
  };

  const updateEventStatus = async (eventId: number, status: string) => {
    try {
      await api(`/api/duty-events/${eventId}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      toast.success("סטטוס עודכן");
      setDetailOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    }
  };

  const handleEventAutoAssign = async () => {
    if (!detailEvent) return;
    setDetailAutoAssignLoading(true);
    try {
      const result = await api<{ message: string; assigned: number }>(
        `/api/duty-events/${detailEvent.id}/auto-assign`,
        {
          method: "POST",
          body: JSON.stringify({ excludeCommanders: autoExcludeCommanders }),
        }
      );
      toast.success(result.message);
      setDetailOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setDetailAutoAssignLoading(false);
    }
  };

  const handleManualAssign = async (soldierId: string) => {
    if (!detailEvent) return;
    setDetailManualAssignLoading(true);
    try {
      await api(`/api/duty-events/${detailEvent.id}/assign`, {
        method: "POST",
        body: JSON.stringify({ soldierIds: [soldierId] }),
      });
      toast.success("חייל שובץ בהצלחה");
      const newEvents = await loadData();
      const updated = newEvents.find((e) => e.id === detailEvent.id);
      if (updated) setDetailEvent(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setDetailManualAssignLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!detailEvent) return;
    setDetailRemoveAssignLoading(assignmentId);
    try {
      await api(
        `/api/duty-events/${detailEvent.id}/assignments/${assignmentId}`,
        { method: "DELETE" }
      );
      toast.success("שיבוץ הוסר");
      const newEvents = await loadData();
      const updated = newEvents.find((e) => e.id === detailEvent.id);
      if (updated) setDetailEvent(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setDetailRemoveAssignLoading(null);
    }
  };

  const toggleSoldierSelection = (id: string) => {
    setNewEventSoldiers((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const openDeleteDialog = () => {
    setDeleteStep(0);
    setDeleteOpen(true);
  };

  const handleDeleteEvent = async (eventId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("למחוק את אירוע התורנות?")) return;
    setDeletingEventId(eventId);
    try {
      await api(`/api/duty-events/${eventId}`, { method: "DELETE" });
      toast.success("אירוע נמחק");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setDeletingEventId(null);
    }
  };

  const handleDeleteWeek = async () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
      return;
    }
    setDeleteLoading(true);
    try {
      const result = await api<{ message: string; deleted: number }>(
        `/api/duty-events?from=${fromStr}&to=${formatDateStr(weekDates[6])}`,
        { method: "DELETE" }
      );
      toast.success(result.message);
      setDeleteOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setDeleteLoading(false);
    }
  };

  const isToday = (date: Date) =>
    formatDateStr(date) === formatDateStr(new Date());

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
          <CalendarDays className="w-7 h-7 text-primary shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold">לוח שיבוצים</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => { setAutoFrom(fromStr); setAutoTo(formatDateStr(weekDates[6])); setAutoOpen(true); }}>
            <Wand2 className="w-4 h-4 ml-2" />
            שיבוץ אוטומטי
          </Button>
          <Button
            variant="outline"
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={openDeleteDialog}
          >
            <Trash2 className="w-4 h-4 ml-2" />
            מחק שיבוצים
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" size="icon" onClick={nextWeek}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={goToday}>
            היום
          </Button>
          <span className="text-base sm:text-lg font-semibold text-center">
            {weekDates[0].toLocaleDateString("he-IL", { day: "numeric", month: "long" })} -{" "}
            {weekDates[6].toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={prevWeek}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Week Grid - scroll horizontally on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="grid grid-cols-7 gap-2 min-w-[560px] sm:min-w-0">
        {weekDates.map((date, idx) => {
          const dayEvents = getEventsForDay(date);
          const today = isToday(date);
          return (
            <div key={idx} className="min-h-[200px]">
              <Card className={`h-full ${today ? "ring-2 ring-primary" : ""}`}>
                <CardHeader className="p-3 pb-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-sm ${today ? "text-primary" : "text-muted-foreground"}`}>
                      {hebrewDays[idx]}
                    </CardTitle>
                    <span className={`text-sm font-bold ${today ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center" : ""}`}>
                      {date.getDate()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-2 pt-0 space-y-1.5">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`group relative flex items-start gap-1 text-right p-2 rounded-md text-xs border transition-colors ${statusColors[event.status] || statusColors.planned}`}
                    >
                      <button
                        onClick={() => { setDetailEvent(event); setDetailOpen(true); }}
                        className="flex-1 min-w-0 text-right hover:opacity-80"
                      >
                        <div className="font-medium truncate">{event.dutyTypeName}</div>
                        {event.assignments.length > 0 && (
                          <div className="text-[10px] mt-0.5 opacity-80 truncate">
                            {event.assignments
                              .map((a) =>
                                a.slotStartAt && a.slotEndAt
                                  ? `${a.soldierName} (${new Date(a.slotStartAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}–${new Date(a.slotEndAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })})`
                                  : a.soldierName
                              )
                              .join(", ")}
                          </div>
                        )}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteEvent(event.id, e)}
                        disabled={deletingEventId === event.id}
                      >
                        {deletingEventId === event.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs text-muted-foreground"
                    onClick={() => openNewEvent(date)}
                  >
                    <Plus className="w-3 h-3 ml-1" />
                    הוסף
                  </Button>
                </CardContent>
              </Card>
            </div>
          );
        })}
        </div>
      </div>

      {/* New Event Dialog */}
      <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>יצירת אירוע תורנות</DialogTitle>
            <DialogDescription>תאריך: {newEventDate}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>סוג תורנות</Label>
              <Select value={newEventType} onValueChange={setNewEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג" />
                </SelectTrigger>
                <SelectContent>
                  {dutyTypes.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id.toString()}>
                      {dt.name} ({dt.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>שיבוץ חיילים</Label>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                {soldiers.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleSoldierSelection(s.id.toString())}
                    className={`w-full text-right px-3 py-2 rounded-md text-sm transition-colors ${
                      newEventSoldiers.includes(s.id.toString())
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{s.fullName}</span>
                      <span className="text-xs opacity-70">
                        {s.departmentName}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {newEventSoldiers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  נבחרו {newEventSoldiers.length} חיילים
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">ביטול</Button>
            </DialogClose>
            <Button onClick={handleCreateEvent} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              צור אירוע
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Week Dialog - Double confirmation */}
      <Dialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeleteStep(0); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              מחיקת כל השיבוצים
            </DialogTitle>
            <DialogDescription>
              {deleteStep === 0 ? (
                <>
                  האם למחוק את כל השיבוצים של השבוע{" "}
                  {weekDates[0].toLocaleDateString("he-IL", { day: "numeric", month: "long" })} –{" "}
                  {weekDates[6].toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })}?
                  <br />
                  <span className="font-medium text-foreground mt-2 block">פעולה זו אינה ניתנת לביטול.</span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-foreground">אימות כפול:</span> לחיצה נוספת תמחק את כל השיבוצים.
                  <br />
                  האם להמשיך?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">ביטול</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteWeek}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : deleteStep === 0 ? (
                "מחק"
              ) : (
                "אישור סופי – מחק"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto Schedule Dialog */}
      <Dialog open={autoOpen} onOpenChange={setAutoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>שיבוץ אוטומטי</DialogTitle>
            <DialogDescription>
              המערכת תשבץ אוטומטית לפי ניקוד הוגנות
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>מתאריך</Label>
                <Input
                  type="date"
                  value={autoFrom}
                  onChange={(e) => setAutoFrom(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>עד תאריך</Label>
                <Input
                  type="date"
                  value={autoTo}
                  onChange={(e) => setAutoTo(e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>סוג תורנות</Label>
              <Select value={autoDutyTypeId} onValueChange={setAutoDutyTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="כל הסוגים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל סוגי התורנויות</SelectItem>
                  {dutyTypes.filter((t) => t.id && t.isActive !== false).map((dt) => (
                    <SelectItem key={dt.id} value={dt.id.toString()}>
                      {dt.name} ({dt.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldOff className="w-4 h-4 text-amber-600" />
                  לא לשבץ מפקדים וסגנים
                </div>
                <p className="text-sm text-muted-foreground">
                  חיילים שמסומנים כ״לא לשבץ אוטומטית״ לא ייכללו
                </p>
              </div>
              <Switch
                checked={autoExcludeCommanders}
                onCheckedChange={setAutoExcludeCommanders}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              השיבוץ לפי אלגוריתם הוגנות (החייל עם הכי מעט נקודות ייבחר ראשון).
              {autoDutyTypeId !== "all" && " נבחר סוג תורנות ספציפי."}
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">ביטול</Button>
            </DialogClose>
            <Button onClick={handleAutoSchedule} disabled={autoLoading}>
              {autoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Wand2 className="w-4 h-4 ml-2" />
              )}
              הרץ שיבוץ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          {detailEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{detailEvent.dutyTypeName}</DialogTitle>
                <DialogDescription>
                  {new Date(detailEvent.startAt).toLocaleDateString("he-IL", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">סטטוס:</span>
                  <Badge
                    variant="secondary"
                    className={statusColors[detailEvent.status]}
                  >
                    {statusLabels[detailEvent.status]}
                  </Badge>
                </div>

                <div>
                  <span className="text-sm font-medium">משובצים:</span>
                  {detailEvent.assignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-1">
                      אין חיילים משובצים
                    </p>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {detailEvent.assignments.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-2 bg-accent rounded-lg p-2"
                        >
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-sm">{a.soldierName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {a.slotStartAt && a.slotEndAt && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(a.slotStartAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}–
                                {new Date(a.slotEndAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveAssignment(a.id)}
                              disabled={detailRemoveAssignLoading === a.id}
                            >
                              {detailRemoveAssignLoading === a.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {(() => {
                    const assignedIds = new Set(detailEvent.assignments.map((a) => a.soldierId));
                    const available = soldiers.filter((s) => !assignedIds.has(s.id));
                    if (available.length === 0) return null;
                    return (
                      <div className="mt-2 pt-2 border-t">
                        <span className="text-xs font-medium text-muted-foreground">הוסף חייל:</span>
                        <div className="mt-1 max-h-32 overflow-y-auto space-y-0.5">
                          {available.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => handleManualAssign(s.id.toString())}
                              disabled={detailManualAssignLoading}
                              className="w-full text-right px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors flex items-center justify-between"
                            >
                              <span>{s.fullName}</span>
                              <span className="text-xs text-muted-foreground">{s.departmentName}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {detailEvent.notes && (
                  <div>
                    <span className="text-sm font-medium">הערות:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {detailEvent.notes}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleEventAutoAssign}
                    disabled={detailAutoAssignLoading}
                  >
                    {detailAutoAssignLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin ml-1" />
                    ) : (
                      <Wand2 className="w-4 h-4 ml-1" />
                    )}
                    שיבוץ אוטומטי
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600"
                    onClick={() => updateEventStatus(detailEvent.id, "done")}
                  >
                    <CheckCircle2 className="w-4 h-4 ml-1" />
                    סמן בוצע
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => updateEventStatus(detailEvent.id, "canceled")}
                  >
                    <XCircle className="w-4 h-4 ml-1" />
                    בטל
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-gray-600"
                    onClick={() => updateEventStatus(detailEvent.id, "missed")}
                  >
                    <Clock className="w-4 h-4 ml-1" />
                    לא בוצע
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
