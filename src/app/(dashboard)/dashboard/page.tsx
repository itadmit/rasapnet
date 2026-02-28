"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  Users,
  ClipboardList,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Loader2,
  Wand2,
  Plus,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardStats {
  totalSoldiers: number;
  activeSoldiers: number;
  totalDutyTypes: number;
  upcomingEvents: number;
  todayEvents: DutyEventInfo[];
  tomorrowEvents: DutyEventInfo[];
}

interface DutyEventInfo {
  id: number;
  dutyTypeName: string;
  startAt: string;
  status: string;
  assignedCount: number;
}

interface FairnessEntry {
  id: number;
  fullName: string;
  departmentName: string;
  totalPoints: number;
  totalDuties: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  planned: { label: "מתוכנן", color: "text-[#837531]", bg: "bg-[#837531]/8", icon: Clock },
  done: { label: "בוצע", color: "text-[#34c759]", bg: "bg-[#34c759]/8", icon: CheckCircle2 },
  swapped: { label: "הוחלף", color: "text-[#ff9500]", bg: "bg-[#ff9500]/8", icon: AlertCircle },
  canceled: { label: "בוטל", color: "text-[#ff3b30]", bg: "bg-[#ff3b30]/8", icon: AlertCircle },
  missed: { label: "לא בוצע", color: "text-[#8e8e93]", bg: "bg-[#8e8e93]/8", icon: AlertCircle },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [fairness, setFairness] = useState<FairnessEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, fairnessData] = await Promise.all([
          api<DashboardStats>("/api/dashboard/stats"),
          api<FairnessEntry[]>("/api/fairness?range=60"),
        ]);
        setStats(statsData);
        setFairness(fairnessData);
      } catch (err) {
        console.error("Failed to load:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#837531]" />
          <p className="text-[13px] text-[#86868b]">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "חיילים פעילים",
      value: stats?.activeSoldiers ?? 0,
      subtitle: `מתוך ${stats?.totalSoldiers ?? 0} סה״כ`,
      icon: Users,
      accent: "#837531",
    },
    {
      title: "סוגי תורנויות",
      value: stats?.totalDutyTypes ?? 0,
      subtitle: "מוגדרים במערכת",
      icon: ClipboardList,
      accent: "#34c759",
    },
    {
      title: "אירועים קרובים",
      value: stats?.upcomingEvents ?? 0,
      subtitle: "ב-7 הימים הקרובים",
      icon: CalendarDays,
      accent: "#ff9500",
    },
    {
      title: "תורנויות היום",
      value: stats?.todayEvents?.length ?? 0,
      subtitle: new Date().toLocaleDateString("he-IL", { weekday: "long" }),
      icon: Clock,
      accent: "#af52de",
    },
  ];

  const mostLoaded = fairness.slice(0, 3);
  const leastLoaded = [...fairness].reverse().slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-[28px] font-semibold text-[#1d1d1f] tracking-tight">
            שלום, {user?.name}
          </h1>
          <p className="text-[15px] text-[#86868b] mt-1">
            {new Date().toLocaleDateString("he-IL", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/schedule">
            <button className="h-9 px-4 flex items-center gap-2 rounded-lg border border-[#d2d2d7] bg-white text-[13px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] active:bg-[#e8e8ed] transition-all duration-150 shadow-sm">
              <Plus className="w-4 h-4 text-[#86868b]" />
              שיבוץ חדש
            </button>
          </Link>
          <Link href="/schedule">
            <button className="h-9 px-4 flex items-center gap-2 rounded-lg bg-[#837531] text-[13px] font-medium text-white hover:bg-[#9a8a3e] active:bg-[#756829] transition-all duration-150 shadow-[0_1px_3px_rgba(131,117,49,0.3)]">
              <Wand2 className="w-4 h-4" />
              שיבוץ אוטומטי
            </button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_0_0_1px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),_0_0_0_1px_rgba(0,0,0,0.03)] transition-shadow duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-[13px] font-medium text-[#86868b]">
                  {stat.title}
                </p>
                <p className="text-[32px] font-semibold text-[#1d1d1f] mt-1 tracking-tight leading-none">
                  {stat.value}
                </p>
                <p className="text-[12px] text-[#86868b] mt-2">
                  {stat.subtitle}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${stat.accent}10` }}
              >
                <stat.icon
                  className="w-5 h-5"
                  style={{ color: stat.accent }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fairness Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most Loaded */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_0_0_1px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f3]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#ff3b30]/8 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#ff3b30]" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#1d1d1f]">הכי עמוסים</h3>
                <p className="text-[12px] text-[#86868b]">60 יום אחרונים</p>
              </div>
            </div>
            <Link
              href="/fairness"
              className="flex items-center gap-1 text-[13px] font-medium text-[#837531] hover:text-[#9a8a3e] transition-colors"
            >
              דוח מלא
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4">
            {mostLoaded.length === 0 ? (
              <p className="text-[13px] text-[#86868b] text-center py-8">
                אין נתונים עדיין
              </p>
            ) : (
              <div className="space-y-2">
                {mostLoaded.map((soldier, idx) => (
                  <div
                    key={soldier.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-[#f5f5f7] transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#ff3b30]/8 flex items-center justify-center text-[12px] font-bold text-[#ff3b30]">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-[14px] font-medium text-[#1d1d1f]">
                          {soldier.fullName}
                        </p>
                        <p className="text-[12px] text-[#86868b]">
                          {soldier.departmentName}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-[15px] font-semibold text-[#ff3b30]">
                        {soldier.totalPoints.toFixed(0)}
                        <span className="text-[11px] font-normal text-[#86868b] mr-0.5">נק׳</span>
                      </p>
                      <p className="text-[11px] text-[#86868b]">
                        {soldier.totalDuties} תורנויות
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Least Loaded */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_0_0_1px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f3]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#34c759]/8 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-[#34c759]" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#1d1d1f]">הכי פנויים</h3>
                <p className="text-[12px] text-[#86868b]">60 יום אחרונים</p>
              </div>
            </div>
            <Link
              href="/fairness"
              className="flex items-center gap-1 text-[13px] font-medium text-[#837531] hover:text-[#9a8a3e] transition-colors"
            >
              דוח מלא
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4">
            {leastLoaded.length === 0 ? (
              <p className="text-[13px] text-[#86868b] text-center py-8">
                אין נתונים עדיין
              </p>
            ) : (
              <div className="space-y-2">
                {leastLoaded.map((soldier, idx) => (
                  <div
                    key={soldier.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-[#f5f5f7] transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#34c759]/8 flex items-center justify-center text-[12px] font-bold text-[#34c759]">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-[14px] font-medium text-[#1d1d1f]">
                          {soldier.fullName}
                        </p>
                        <p className="text-[12px] text-[#86868b]">
                          {soldier.departmentName}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-[15px] font-semibold text-[#34c759]">
                        {soldier.totalPoints.toFixed(0)}
                        <span className="text-[11px] font-normal text-[#86868b] mr-0.5">נק׳</span>
                      </p>
                      <p className="text-[11px] text-[#86868b]">
                        {soldier.totalDuties} תורנויות
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today & Tomorrow Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_0_0_1px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f0f0f3]">
            <h3 className="text-[15px] font-semibold text-[#1d1d1f]">תורנויות היום</h3>
            <p className="text-[12px] text-[#86868b] mt-0.5">
              {new Date().toLocaleDateString("he-IL", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="p-4">
            {!stats?.todayEvents?.length ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-[#34c759]/8 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-[#34c759]" />
                </div>
                <p className="text-[14px] font-medium text-[#1d1d1f]">הכל פנוי!</p>
                <p className="text-[12px] text-[#86868b] mt-0.5">אין תורנויות מתוכננות להיום</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.todayEvents.map((event) => {
                  const config = statusConfig[event.status] || statusConfig.planned;
                  const StatusIcon = config.icon;
                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-[#f5f5f7] transition-colors duration-150"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                          <StatusIcon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-[#1d1d1f]">
                            {event.dutyTypeName}
                          </p>
                          <p className="text-[12px] text-[#86868b]">
                            {event.assignedCount} משובצים
                          </p>
                        </div>
                      </div>
                      <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tomorrow */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_0_0_1px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f0f0f3]">
            <h3 className="text-[15px] font-semibold text-[#1d1d1f]">תורנויות מחר</h3>
            <p className="text-[12px] text-[#86868b] mt-0.5">
              {new Date(Date.now() + 86400000).toLocaleDateString("he-IL", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="p-4">
            {!stats?.tomorrowEvents?.length ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto mb-3">
                  <CalendarDays className="w-6 h-6 text-[#86868b]" />
                </div>
                <p className="text-[14px] font-medium text-[#1d1d1f]">אין תורנויות</p>
                <p className="text-[12px] text-[#86868b] mt-0.5">לא נקבעו תורנויות למחר</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.tomorrowEvents.map((event) => {
                  const config = statusConfig[event.status] || statusConfig.planned;
                  const StatusIcon = config.icon;
                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-[#f5f5f7] transition-colors duration-150"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                          <StatusIcon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-[#1d1d1f]">
                            {event.dutyTypeName}
                          </p>
                          <p className="text-[12px] text-[#86868b]">
                            {event.assignedCount} משובצים
                          </p>
                        </div>
                      </div>
                      <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
