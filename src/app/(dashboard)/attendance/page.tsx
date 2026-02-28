"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Save,
  History,
  X,
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────

interface SoldierAttendance {
  soldierId: number;
  fullName: string;
  departmentId: number;
  departmentName: string;
  attendance: Record<
    string,
    { status: string; notes: string | null; recordId: number | null }
  >;
}

interface WeeklyData {
  dates: string[];
  soldiers: SoldierAttendance[];
}

interface AuditEntry {
  id: number;
  oldStatus: string;
  newStatus: string;
  oldNotes: string | null;
  newNotes: string | null;
  editedByName: string;
  editedAt: string;
}

// ─── Status Config ───────────────────────────────────────────────

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; textColor: string }
> = {
  present: {
    label: "נוכח",
    color: "#34c759",
    bg: "bg-[#34c759]/10",
    textColor: "text-[#34c759]",
  },
  leave: {
    label: "חופש",
    color: "#0071e3",
    bg: "bg-[#0071e3]/10",
    textColor: "text-[#0071e3]",
  },
  shabbat: {
    label: "שבת",
    color: "#af52de",
    bg: "bg-[#af52de]/10",
    textColor: "text-[#af52de]",
  },
  compassionate: {
    label: "גימלים",
    color: "#ff9500",
    bg: "bg-[#ff9500]/10",
    textColor: "text-[#ff9500]",
  },
  home: {
    label: "בתים",
    color: "#ff3b30",
    bg: "bg-[#ff3b30]/10",
    textColor: "text-[#ff3b30]",
  },
  other: {
    label: "אחר",
    color: "#8e8e93",
    bg: "bg-[#8e8e93]/10",
    textColor: "text-[#8e8e93]",
  },
  unreported: {
    label: "לא דווח",
    color: "#c7c7cc",
    bg: "bg-transparent",
    textColor: "text-[#c7c7cc]",
  },
};

const statuses = ["present", "leave", "shabbat", "compassionate", "home", "other"];

const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

// ─── Helpers ─────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ─── Component ───────────────────────────────────────────────────

export default function AttendancePage() {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [data, setData] = useState<WeeklyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Changes tracking: { "soldierId-date": status }
  const [changes, setChanges] = useState<
    Record<string, { status: string; notes?: string }>
  >({});

  // Quick-edit day selector
  const [editDate, setEditDate] = useState<string | null>(null);

  // Audit modal
  const [auditData, setAuditData] = useState<AuditEntry[] | null>(null);
  const [auditSoldierName, setAuditSoldierName] = useState("");
  const [auditDate, setAuditDate] = useState("");
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // Dropdown
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!activeDropdown) return;
    const handleClick = () => setActiveDropdown(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [activeDropdown]);

  // Access control
  const hasAccess =
    user?.role === "admin" || user?.role === "shlishut";

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const from = toDateStr(weekStart);
      const to = toDateStr(weekEnd);
      const result = await api<WeeklyData>(
        `/api/attendance/weekly?from=${from}&to=${to}`
      );
      setData(result);
      setChanges({});
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בטעינת נתוני נוכחות");
    } finally {
      setIsLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    if (hasAccess) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [loadData, hasAccess]);

  // Navigation
  const goToPrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const goToNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const goToThisWeek = () => {
    setWeekStart(getWeekStart(new Date()));
  };

  // Change a status
  const handleStatusChange = (
    soldierId: number,
    date: string,
    newStatus: string
  ) => {
    const key = `${soldierId}-${date}`;
    setChanges((prev) => ({
      ...prev,
      [key]: { status: newStatus },
    }));
    setActiveDropdown(null);
  };

  // Get effective status (changes override data)
  const getEffectiveStatus = (
    soldier: SoldierAttendance,
    date: string
  ): string => {
    const key = `${soldier.soldierId}-${date}`;
    if (changes[key]) return changes[key].status;
    return soldier.attendance[date]?.status ?? "unreported";
  };

  // Save changes
  const handleSave = async () => {
    if (Object.keys(changes).length === 0) {
      toast.info("אין שינויים לשמירה");
      return;
    }

    setIsSaving(true);
    try {
      // Group changes by date
      const byDate: Record<
        string,
        Array<{ soldierId: number; status: string; notes?: string }>
      > = {};

      for (const [key, change] of Object.entries(changes)) {
        const [soldierId, date] = key.split("-");
        const dateKey = key.substring(key.indexOf("-") + 1);
        if (!byDate[dateKey]) byDate[dateKey] = [];
        byDate[dateKey].push({
          soldierId: parseInt(soldierId),
          status: change.status,
          notes: change.notes,
        });
      }

      // Send each date as a separate request
      for (const [date, records] of Object.entries(byDate)) {
        await api("/api/attendance", {
          method: "POST",
          body: JSON.stringify({ date, records }),
        });
      }

      toast.success("הנוכחות נשמרה בהצלחה");
      setChanges({});
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בשמירת נוכחות");
    } finally {
      setIsSaving(false);
    }
  };

  // Load audit trail
  const handleViewAudit = async (
    recordId: number,
    soldierName: string,
    date: string
  ) => {
    setIsAuditLoading(true);
    setAuditSoldierName(soldierName);
    setAuditDate(date);
    setAuditData(null);
    try {
      const logs = await api<AuditEntry[]>(
        `/api/attendance/audit?recordId=${recordId}`
      );
      setAuditData(logs);
    } catch {
      toast.error("שגיאה בטעינת היסטוריה");
      setAuditData([]);
    } finally {
      setIsAuditLoading(false);
    }
  };

  // Quick report buttons
  const today = toDateStr(new Date());
  const yesterday = toDateStr(
    new Date(Date.now() - 86400000)
  );
  const tomorrow = toDateStr(
    new Date(Date.now() + 86400000)
  );

  // ─── Access denied ─────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#ff3b30]/8 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserX className="w-8 h-8 text-[#ff3b30]" />
          </div>
          <h2 className="text-[18px] font-semibold text-[#1d1d1f]">
            אין הרשאה
          </h2>
          <p className="text-[14px] text-[#86868b] mt-1">
            דף זה נגיש רק למשתמשי שלישות ומנהלים
          </p>
        </div>
      </div>
    );
  }

  // ─── Loading ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#837531]" />
          <p className="text-[13px] text-[#86868b]">טוען נתוני נוכחות...</p>
        </div>
      </div>
    );
  }

  // Group soldiers by department
  const departments = new Map<
    string,
    SoldierAttendance[]
  >();
  if (data) {
    for (const soldier of data.soldiers) {
      const dept = soldier.departmentName;
      if (!departments.has(dept)) departments.set(dept, []);
      departments.get(dept)!.push(soldier);
    }
  }

  const hasChanges = Object.keys(changes).length > 0;

  // Stats for today
  const todayStats = data
    ? (() => {
        const todayDate = today;
        if (!data.dates.includes(todayDate)) return null;
        let present = 0;
        let absent = 0;
        let unreported = 0;
        for (const s of data.soldiers) {
          const status = getEffectiveStatus(s, todayDate);
          if (status === "present") present++;
          else if (status === "unreported") unreported++;
          else absent++;
        }
        return { present, absent, unreported, total: data.soldiers.length };
      })()
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-[28px] font-semibold text-[#1d1d1f] tracking-tight">
            דוח שלישות
          </h1>
          <p className="text-[15px] text-[#86868b] mt-1">
            דוח נוכחות יומי לפי מחלקות
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 px-4 flex items-center gap-2 rounded-lg bg-[#837531] text-[13px] font-medium text-white hover:bg-[#9a8a3e] active:bg-[#756829] transition-all duration-150 shadow-[0_1px_3px_rgba(131,117,49,0.3)] disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              שמור שינויים ({Object.keys(changes).length})
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      {todayStats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_0_0_1px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#34c759]/10 flex items-center justify-center">
                <UserCheck className="w-[18px] h-[18px] text-[#34c759]" />
              </div>
              <div>
                <p className="text-[22px] font-semibold text-[#1d1d1f] leading-none">
                  {todayStats.present}
                </p>
                <p className="text-[12px] text-[#86868b] mt-0.5">נוכחים היום</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_0_0_1px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#ff3b30]/10 flex items-center justify-center">
                <UserX className="w-[18px] h-[18px] text-[#ff3b30]" />
              </div>
              <div>
                <p className="text-[22px] font-semibold text-[#1d1d1f] leading-none">
                  {todayStats.absent}
                </p>
                <p className="text-[12px] text-[#86868b] mt-0.5">לא בבסיס</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_0_0_1px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#ff9500]/10 flex items-center justify-center">
                <Clock className="w-[18px] h-[18px] text-[#ff9500]" />
              </div>
              <div>
                <p className="text-[22px] font-semibold text-[#1d1d1f] leading-none">
                  {todayStats.unreported}
                </p>
                <p className="text-[12px] text-[#86868b] mt-0.5">לא דווח</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_0_0_1px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#837531]/10 flex items-center justify-center">
                <CalendarDays className="w-[18px] h-[18px] text-[#837531]" />
              </div>
              <div>
                <p className="text-[22px] font-semibold text-[#1d1d1f] leading-none">
                  {todayStats.total}
                </p>
                <p className="text-[12px] text-[#86868b] mt-0.5">סה״כ חיילים</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Report Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[13px] text-[#86868b] font-medium ml-1">
          דיווח מהיר:
        </span>
        {[
          { label: "אתמול", date: yesterday },
          { label: "היום", date: today },
          { label: "מחר", date: tomorrow },
        ].map((item) => (
          <button
            key={item.date}
            onClick={() =>
              setEditDate(editDate === item.date ? null : item.date)
            }
            className={`h-8 px-3 rounded-lg text-[13px] font-medium transition-all duration-150 ${
              editDate === item.date
                ? "bg-[#837531] text-white shadow-[0_1px_3px_rgba(131,117,49,0.3)]"
                : "bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7]"
            }`}
          >
            {item.label} ({formatDate(item.date)})
          </button>
        ))}
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_0_0_1px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f3]">
          <div className="flex items-center gap-3">
            <button
              onClick={goToNextWeek}
              className="w-8 h-8 rounded-lg border border-[#d2d2d7] flex items-center justify-center hover:bg-[#f5f5f7] transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#1d1d1f]" />
            </button>
            <div>
              <h3 className="text-[15px] font-semibold text-[#1d1d1f]">
                {formatDate(toDateStr(weekStart))} –{" "}
                {formatDate(toDateStr(weekEnd))}
              </h3>
            </div>
            <button
              onClick={goToPrevWeek}
              className="w-8 h-8 rounded-lg border border-[#d2d2d7] flex items-center justify-center hover:bg-[#f5f5f7] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#1d1d1f]" />
            </button>
          </div>
          <button
            onClick={goToThisWeek}
            className="h-8 px-3 rounded-lg text-[13px] font-medium border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
          >
            השבוע הנוכחי
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-[#f0f0f3]">
                <th className="text-right text-[12px] font-medium text-[#86868b] px-4 py-3 w-[180px] sticky right-0 bg-white z-10">
                  חייל
                </th>
                {data?.dates.map((date) => {
                  const d = new Date(date + "T00:00:00");
                  const dayIdx = d.getDay();
                  const isToday = date === today;
                  return (
                    <th
                      key={date}
                      className={`text-center text-[12px] font-medium px-2 py-3 min-w-[100px] ${
                        isToday
                          ? "text-[#837531] bg-[#837531]/4"
                          : "text-[#86868b]"
                      }`}
                    >
                      <div>{dayNames[dayIdx]}</div>
                      <div className="text-[11px] mt-0.5">{formatDate(date)}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {[...departments.entries()].map(
                ([deptName, deptSoldiers]) => (
                  <DepartmentGroup
                    key={deptName}
                    departmentName={deptName}
                    soldiers={deptSoldiers}
                    dates={data?.dates ?? []}
                    today={today}
                    changes={changes}
                    activeDropdown={activeDropdown}
                    setActiveDropdown={setActiveDropdown}
                    getEffectiveStatus={getEffectiveStatus}
                    handleStatusChange={handleStatusChange}
                    handleViewAudit={handleViewAudit}
                  />
                )
              )}
            </tbody>
          </table>
        </div>

        {(!data || data.soldiers.length === 0) && (
          <div className="text-center py-16">
            <p className="text-[14px] text-[#86868b]">אין חיילים פעילים</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-[12px] text-[#86868b] font-medium">מקרא:</span>
        {Object.entries(statusConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  key === "unreported" ? "transparent" : config.color,
                border:
                  key === "unreported"
                    ? "1.5px dashed #c7c7cc"
                    : "none",
              }}
            />
            <span className="text-[12px] text-[#1d1d1f]">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Audit Modal */}
      {auditData !== null && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => setAuditData(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f3]">
              <div>
                <h3 className="text-[15px] font-semibold text-[#1d1d1f]">
                  היסטוריית שינויים
                </h3>
                <p className="text-[12px] text-[#86868b] mt-0.5">
                  {auditSoldierName} · {formatDateFull(auditDate)}
                </p>
              </div>
              <button
                onClick={() => setAuditData(null)}
                className="w-8 h-8 rounded-lg hover:bg-[#f5f5f7] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-[#86868b]" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {isAuditLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#837531]" />
                </div>
              ) : auditData.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-8 h-8 text-[#c7c7cc] mx-auto mb-2" />
                  <p className="text-[13px] text-[#86868b]">
                    אין שינויים מתועדים
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditData.map((entry) => (
                    <div
                      key={entry.id}
                      className="border border-[#e8e8ed] rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-medium text-[#1d1d1f]">
                          {entry.editedByName}
                        </span>
                        <span className="text-[11px] text-[#86868b]">
                          {new Date(entry.editedAt).toLocaleString("he-IL")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[13px]">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            statusConfig[entry.oldStatus]?.bg ?? ""
                          } ${
                            statusConfig[entry.oldStatus]?.textColor ?? ""
                          }`}
                        >
                          {statusConfig[entry.oldStatus]?.label ??
                            entry.oldStatus}
                        </span>
                        <ArrowLeft className="w-3 h-3 text-[#86868b]" />
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            statusConfig[entry.newStatus]?.bg ?? ""
                          } ${
                            statusConfig[entry.newStatus]?.textColor ?? ""
                          }`}
                        >
                          {statusConfig[entry.newStatus]?.label ??
                            entry.newStatus}
                        </span>
                      </div>
                      {(entry.oldNotes || entry.newNotes) && (
                        <p className="text-[11px] text-[#86868b] mt-1">
                          הערות: {entry.oldNotes || "—"} → {entry.newNotes || "—"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Department Group Subcomponent ───────────────────────────────

function DepartmentGroup({
  departmentName,
  soldiers,
  dates,
  today,
  changes,
  activeDropdown,
  setActiveDropdown,
  getEffectiveStatus,
  handleStatusChange,
  handleViewAudit,
}: {
  departmentName: string;
  soldiers: SoldierAttendance[];
  dates: string[];
  today: string;
  changes: Record<string, { status: string; notes?: string }>;
  activeDropdown: string | null;
  setActiveDropdown: (key: string | null) => void;
  getEffectiveStatus: (soldier: SoldierAttendance, date: string) => string;
  handleStatusChange: (
    soldierId: number,
    date: string,
    status: string
  ) => void;
  handleViewAudit: (
    recordId: number,
    soldierName: string,
    date: string
  ) => void;
}) {
  return (
    <>
      {/* Department Header */}
      <tr className="bg-[#f5f5f7]">
        <td
          colSpan={dates.length + 1}
          className="px-4 py-2 text-[12px] font-semibold text-[#86868b] sticky right-0"
        >
          {departmentName}
        </td>
      </tr>
      {soldiers.map((soldier) => (
        <tr
          key={soldier.soldierId}
          className="border-b border-[#f0f0f3] hover:bg-[#fafafa] transition-colors"
        >
          <td className="px-4 py-2.5 text-[13px] font-medium text-[#1d1d1f] sticky right-0 bg-white">
            {soldier.fullName}
          </td>
          {dates.map((date) => {
            const status = getEffectiveStatus(soldier, date);
            const config = statusConfig[status] ?? statusConfig.unreported;
            const cellKey = `${soldier.soldierId}-${date}`;
            const isChanged = !!changes[cellKey];
            const isToday = date === today;
            const recordId = soldier.attendance[date]?.recordId;
            const isDropdownOpen = activeDropdown === cellKey;

            return (
              <td
                key={date}
                className={`text-center px-1 py-2 relative ${
                  isToday ? "bg-[#837531]/4" : ""
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(isDropdownOpen ? null : cellKey);
                    }}
                    className={`
                      px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 relative cursor-pointer hover:opacity-80
                      ${
                        status === "unreported"
                          ? "border border-dashed border-[#c7c7cc] text-[#c7c7cc] hover:border-[#837531] hover:text-[#837531]"
                          : `${config.bg} ${config.textColor}`
                      }
                      ${isChanged ? "ring-2 ring-[#837531]/30" : ""}
                    `}
                  >
                    {config.label}
                  </button>
                  {recordId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewAudit(recordId, soldier.fullName, date);
                      }}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-[#f0f0f3] transition-colors"
                      title="היסטוריית שינויים"
                    >
                      <History className="w-3 h-3 text-[#c7c7cc]" />
                    </button>
                  )}
                </div>

                {/* Status Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute top-full mt-1 z-20 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.12),_0_0_0_1px_rgba(0,0,0,0.04)] py-1 min-w-[110px] right-1/2 translate-x-1/2" onClick={(e) => e.stopPropagation()}>
                    {statuses.map((s) => {
                      const sc = statusConfig[s];
                      return (
                        <button
                          key={s}
                          onClick={() =>
                            handleStatusChange(
                              soldier.soldierId,
                              date,
                              s
                            )
                          }
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors text-right"
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sc.color }}
                          />
                          {sc.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

