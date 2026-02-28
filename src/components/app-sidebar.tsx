"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarDays,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Shield,
  ClipboardCheck,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: string[]; // if defined, only these roles can see it
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "דשבורד", icon: LayoutDashboard },
  { href: "/soldiers", label: "חיילים", icon: Users },
  { href: "/duty-types", label: "סוגי תורנויות", icon: ClipboardList },
  { href: "/schedule", label: "לוח שיבוצים", icon: CalendarDays },
  { href: "/fairness", label: "דוח הוגנות", icon: BarChart3 },
  { href: "/attendance", label: "שלישות", icon: ClipboardCheck, roles: ["admin", "shlishut"] },
  { href: "/whatsapp", label: "וואטסאפ", icon: MessageSquare },
  { href: "/settings", label: "הגדרות", icon: Settings },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <aside className="w-[272px] h-screen bg-white border-l border-[#e8e8ed] flex flex-col shrink-0 sticky top-0">
      {/* Logo Section */}
      <div className="px-6 py-5 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-[#837531] to-[#9a8a3e] rounded-[12px] flex items-center justify-center shadow-[0_2px_8px_rgba(131,117,49,0.3)]">
          <Shield className="w-[18px] h-[18px] text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-[17px] text-[#1d1d1f] leading-tight tracking-tight">רס״פנט</h1>
          <p className="text-[12px] text-[#86868b] leading-tight mt-0.5">ניהול תורנויות חכם</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-[#e8e8ed]" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-[9px] rounded-[10px] text-[14px] transition-all duration-150",
                  isActive
                    ? "bg-[#837531] text-white font-medium shadow-[0_1px_3px_rgba(131,117,49,0.3)]"
                    : "text-[#1d1d1f] hover:bg-[#f5f5f7] font-normal"
                )}
              >
                <item.icon className={cn(
                  "w-[18px] h-[18px] shrink-0",
                  isActive ? "text-white" : "text-[#86868b]"
                )} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-[#e8e8ed]" />

      {/* User Section */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#837531] to-[#a89a4a] rounded-full flex items-center justify-center text-[13px] font-semibold text-white shadow-sm">
            {user?.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-[#1d1d1f] truncate">{user?.name}</p>
            <p className="text-[12px] text-[#86868b]" dir="ltr">
              {user?.phone}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-[7px] rounded-[10px] text-[13px] text-[#ff3b30] hover:bg-[#ff3b30]/5 transition-colors duration-150 font-medium"
        >
          <LogOut className="w-4 h-4" />
          התנתק
        </button>
      </div>
    </aside>
  );
}
