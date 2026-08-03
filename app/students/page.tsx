"use client";
import { AppShell } from "@/components/app-shell";
import { TimetableGrid } from "@/components/timetable-grid";
import { StatusBadge } from "@/components/status-badge";
import { Download } from "lucide-react";
import { useState } from "react";
import { useCampusData } from "@/components/data-context";

export default function StudentsPage() {
  const { data } = useCampusData();
  const [group, setGroup] = useState(data.studentGroups[0]?.name || "");
  const upcoming = data.sessions.filter(s=>s.group===group);
  const modules = data.modules.filter(m => m.studentGroup === group || upcoming.some(s=>s.moduleCode===m.code));
  return <AppShell title="Student Schedule" subtitle="Cohort timetable and upcoming teaching sessions"><div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><select className="input md:w-72" value={group} onChange={e=>setGroup(e.target.value)}>{data.studentGroups.map(g=><option key={g.name}>{g.name}</option>)}</select><button className="btn-secondary"><Download size={16}/>Export Timetable</button></div><div className="grid gap-6 xl:grid-cols-[1fr_360px]"><TimetableGrid group={group}/><aside className="space-y-6"><div className="enterprise-card p-5"><h3 className="mb-4 font-semibold text-navy">Upcoming Classes</h3>{upcoming.length ? upcoming.map(s=><div key={s.id} className="mb-3 rounded-2xl bg-slate-50 p-3"><p className="font-semibold text-navy">{s.moduleCode}</p><p className="text-sm text-slate-500">{s.day} {s.start} · {s.room}</p></div>) : <p className="text-sm text-slate-500">No sessions for selected cohort.</p>}</div><div className="enterprise-card p-5"><h3 className="mb-4 font-semibold text-navy">Module List</h3><div className="space-y-2">{modules.length ? modules.map(m=><div key={m.code} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"><span className="text-sm font-semibold">{m.code}</span><StatusBadge value="Available"/></div>) : <p className="text-sm text-slate-500">No modules assigned.</p>}</div></div></aside></div></AppShell>;
}
