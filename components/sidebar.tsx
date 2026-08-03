"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Database,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Siren,
  UserRoundCog
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCampusData } from "@/components/data-context";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/timetable", label: "Timetable", icon: CalendarDays },
  { href: "/import", label: "Data Import", icon: Database },
  { href: "/rooms", label: "Room Booking", icon: Building2 },
  { href: "/lecturers", label: "Lecturers", icon: UserRoundCog },
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/conflicts", label: "Conflict Alerts", icon: Siren },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();
  const { data, backendStatus } = useCampusData();
  const activeConflicts = data.conflicts.filter(conflict => !conflict.resolved).length;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-navy text-white lg:block">
      <div className="flex h-20 items-center gap-3 px-6">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-tealBrand shadow-lg"><CalendarDays size={22}/></div>
        <div><p className="text-sm text-teal-100">Campus</p><h1 className="font-semibold leading-tight">Timetable Intelligence</h1></div>
      </div>
      <nav className="space-y-1 px-4 py-4">
        {nav.map(item => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white", active && "bg-white/12 text-white ring-1 ring-white/10")}><Icon size={18}/>{item.label}</Link>;
        })}
      </nav>
      <div className="absolute bottom-6 left-4 right-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
        <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold"><span className="flex items-center gap-2"><Bell size={16}/>System status</span><span className="text-xs text-teal-200">{backendStatus}</span></div>
        <p className="text-xs leading-5 text-slate-300">{activeConflicts ? `${activeConflicts} conflict${activeConflicts === 1 ? "" : "s"} require review.` : "No active conflicts require review."}</p>
      </div>
    </aside>
  );
}
