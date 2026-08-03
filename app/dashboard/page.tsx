"use client";
import { AppShell } from "@/components/app-shell";
import { AiWidget } from "@/components/ai-widget";
import { KpiCard } from "@/components/kpi-card";
import { LecturerWorkloadChart, RoomUsageChart } from "@/components/charts";
import { StatusBadge } from "@/components/status-badge";
import { useCampusData } from "@/components/data-context";

export default function DashboardPage() {
  const { data } = useCampusData();
  const activeConflicts = data.conflicts.filter(c => !c.resolved).length;
  const activeRooms = data.rooms.filter(r => r.status !== "Maintenance").length;
  const roomUtil = Math.round((new Set(data.sessions.map(s=>s.room)).size / Math.max(1, data.rooms.length)) * 100);
  const kpis = [
    { label: "Total Scheduled Classes", value: String(data.sessions.length), change: data.generatedAt ? "Live" : "+12%" },
    { label: "Active Rooms", value: String(activeRooms), change: `${data.rooms.length} total` },
    { label: "Lecturer Utilisation", value: `${Math.min(100, Math.round((data.sessions.length * 2 / Math.max(1, data.lecturers.length * 18)) * 100))}%`, change: "Dynamic" },
    { label: "Student Groups", value: String(data.studentGroups.length), change: "+ imported" },
    { label: "Active Conflicts", value: String(activeConflicts), change: activeConflicts ? "Needs review" : "Clear" },
    { label: "Room Utilisation", value: `${roomUtil}%`, change: "Live" }
  ];
  return <AppShell title="Admin Dashboard" subtitle="Institution-wide scheduling command centre"><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">{kpis.map(k=><KpiCard key={k.label} {...k}/>)}</div>{data.generatedAt && <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-800">Live schedule generated at {new Date(data.generatedAt).toLocaleString()}. Dashboard, rooms, lecturers, students, conflicts, and analytics are now using imported data.</div>}<div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]"><div className="space-y-6"><div className="enterprise-card p-5"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold text-navy">Today’s Sessions</h3><StatusBadge value="Available"/></div><div className="grid gap-3 md:grid-cols-2">{data.sessions.slice(0,4).map(s=><div key={s.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-navy">{s.moduleCode} · {s.moduleName}</p><p className="mt-1 text-sm text-slate-500">{s.start}-{s.end} · {s.room}</p></div>{s.conflict && <StatusBadge value="Critical"/>}</div><p className="mt-3 text-sm text-slate-600">{s.lecturer} · {s.group}</p></div>)}</div></div><div className="grid gap-6 xl:grid-cols-2"><RoomUsageChart/><LecturerWorkloadChart/></div></div><div className="space-y-6"><AiWidget/><div className="enterprise-card p-5"><h3 className="mb-4 font-semibold text-navy">Recent Conflict Alerts</h3><div className="space-y-3">{data.conflicts.slice(0,3).map((c, index)=><div key={c.id || c.module+c.time+index} className="rounded-2xl border border-slate-200 p-3"><div className="flex items-center justify-between"><p className="font-semibold text-navy">{c.type}</p><StatusBadge value={c.severity}/></div><p className="mt-1 text-sm text-slate-500">{c.module} · {c.time}</p></div>)}</div></div></div></div></AppShell>;
}
