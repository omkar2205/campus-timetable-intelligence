"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, Database, FileBarChart, MoveRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { LecturerWorkloadChart, RoomUsageChart } from "@/components/charts";
import { StatusBadge } from "@/components/status-badge";
import { useCampusData } from "@/components/data-context";

export default function DashboardPage() {
  const { data, backendStatus } = useCampusData();
  const activeConflicts = data.conflicts.filter(conflict => !conflict.resolved);
  const activeRooms = data.rooms.filter(room => room.status !== "Maintenance").length;
  const usedRooms = new Set(data.sessions.filter(session => session.status !== "Cancelled").map(session => session.room)).size;
  const roomUtilisation = Math.round((usedRooms / Math.max(1, activeRooms)) * 100);
  const totalScheduledHours = data.sessions.reduce((total, session) => total + durationHours(session.start, session.end), 0);
  const lecturersWithTeaching = new Set(data.sessions.map(session => session.lecturer)).size;

  const kpis = [
    { label: "Scheduled sessions", value: String(data.sessions.length), change: `${Math.round(totalScheduledHours)} hours` },
    { label: "Rooms available", value: String(activeRooms), change: `${data.rooms.length} recorded` },
    { label: "Lecturers scheduled", value: String(lecturersWithTeaching), change: `${data.lecturers.length} recorded` },
    { label: "Student groups", value: String(data.studentGroups.length), change: `${data.modules.length} modules` },
    { label: "Open conflicts", value: String(activeConflicts.length), change: activeConflicts.length ? "Review required" : "No issues" },
    { label: "Rooms in use", value: `${roomUtilisation}%`, change: `${usedRooms} assigned` }
  ];

  const sessions = [...data.sessions]
    .filter(session => session.status !== "Cancelled")
    .sort((a, b) => `${dayOrder(a.day)}-${a.start}`.localeCompare(`${dayOrder(b.day)}-${b.start}`))
    .slice(0, 6);

  return <AppShell title="Dashboard" subtitle="Overview of schedules, capacity, workloads and current actions">
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">{kpis.map(kpi => <KpiCard key={kpi.label} {...kpi}/>)}</div>

    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-semibold text-navy">Shared data status: {backendStatus}</p><p className="mt-1 text-sm text-slate-500">Schedule updates are saved through the connected timetable database when the backend is available.</p></div>
      {data.generatedAt && <p className="text-xs font-semibold text-slate-400">Last generated {new Date(data.generatedAt).toLocaleString()}</p>}
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
      <div className="space-y-6">
        <div className="enterprise-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="font-semibold text-navy">Schedule overview</h3><p className="mt-1 text-sm text-slate-500">Next recurring teaching blocks in the current timetable.</p></div><Link href="/timetable" className="btn-secondary">Open timetable<MoveRight size={16}/></Link></div>
          <div className="grid gap-3 md:grid-cols-2">{sessions.map(session => <button key={session.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-teal-300 hover:bg-teal-50">
            <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-navy">{session.moduleCode}</p><p className="mt-1 text-sm font-medium text-slate-700">{session.moduleName}</p></div>{session.conflict && <StatusBadge value="Critical"/>}</div>
            <p className="mt-3 text-sm text-slate-500">{session.day} · {session.start}–{session.end}</p><p className="mt-1 text-sm text-slate-600">{session.lecturer}</p><p className="text-sm text-slate-500">{session.room} · {session.campus}</p>
          </button>)}</div>
        </div>
        <div className="grid gap-6 xl:grid-cols-2"><RoomUsageChart/><LecturerWorkloadChart/></div>
      </div>

      <aside className="space-y-6">
        <div className="enterprise-card p-5">
          <h3 className="font-semibold text-navy">Quick actions</h3>
          <div className="mt-4 grid gap-2">
            <ActionLink href="/timetable" icon={CalendarDays} title="Plan timetable" text="Move, add or filter sessions"/>
            <ActionLink href="/import" icon={Database} title="Update source data" text="Stage CSV files and regenerate"/>
            <ActionLink href="/conflicts" icon={AlertTriangle} title="Review conflicts" text={`${activeConflicts.length} currently open`}/>
            <ActionLink href="/reports" icon={FileBarChart} title="Export reports" text="Download operational data"/>
          </div>
        </div>

        <div className="enterprise-card p-5">
          <h3 className="mb-4 font-semibold text-navy">Conflict alerts</h3>
          {activeConflicts.length ? <div className="space-y-3">{activeConflicts.slice(0, 5).map(conflict => <div key={conflict.id || `${conflict.module}-${conflict.time}`} className="rounded-2xl border border-slate-200 p-3"><div className="flex items-center justify-between"><p className="font-semibold text-navy">{conflict.type}</p><StatusBadge value={conflict.severity}/></div><p className="mt-1 text-sm text-slate-500">{conflict.module} · {conflict.time}</p></div>)}</div> : <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">No active schedule conflicts.</p>}
        </div>
      </aside>
    </div>
  </AppShell>;
}

function ActionLink({ href, icon: Icon, title, text }: { href: string; icon: typeof CalendarDays; title: string; text: string }) {
  return <Link href={href} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 transition hover:border-teal-300 hover:bg-teal-50"><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-navy"><Icon size={18}/></div><div><p className="text-sm font-semibold text-navy">{title}</p><p className="text-xs text-slate-500">{text}</p></div></Link>;
}

function dayOrder(day: string) {
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(day);
}

function durationHours(start: string, end: string) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return Math.max(0, (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60);
}
