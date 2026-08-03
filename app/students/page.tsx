"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { TimetableGrid } from "@/components/timetable-grid";
import { StatusBadge } from "@/components/status-badge";
import { useCampusData } from "@/components/data-context";
import { downloadCsv, timetableRows } from "@/lib/export";
import { startOfTeachingWeek } from "@/lib/calendar";

export default function StudentsPage() {
  const { data } = useCampusData();
  const [group, setGroup] = useState(data.studentGroups[0]?.name || "");
  const [query, setQuery] = useState("");
  const [weekStart] = useState(() => startOfTeachingWeek(new Date()));

  useEffect(() => {
    if (!group || !data.studentGroups.some(item => item.name === group)) setGroup(data.studentGroups[0]?.name || "");
  }, [data.studentGroups, group]);

  const filteredGroups = useMemo(() => data.studentGroups.filter(item => {
    const text = `${item.name} ${item.course} ${item.campus}`.toLowerCase();
    return text.includes(query.toLowerCase());
  }), [data.studentGroups, query]);
  const selectedGroup = data.studentGroups.find(item => item.name === group);
  const sessions = data.sessions.filter(session => session.group === group && session.status !== "Cancelled");
  const modules = data.modules.filter(module => module.studentGroup === group || sessions.some(session => session.moduleCode === module.code));

  return <AppShell title="Student Schedules" subtitle="Review and export timetables by student group">
    <div className="mb-5 enterprise-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-72"><Search className="absolute left-3 top-2.5 text-slate-400" size={17}/><input className="input w-full pl-9" placeholder="Search groups or courses" value={query} onChange={event => setQuery(event.target.value)}/></div>
          <select className="input sm:w-96" value={group} onChange={event => setGroup(event.target.value)}>
            {filteredGroups.map(item => <option key={item.name} value={item.name}>{item.name} · {item.course}</option>)}
          </select>
        </div>
        <button onClick={() => downloadCsv(`${group || "student-group"}-timetable.csv`, timetableRows(sessions))} className="btn-secondary" disabled={!group}><Download size={16}/>Export timetable</button>
      </div>
      {selectedGroup && <div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Course" value={selectedGroup.course}/><Metric label="Campus" value={selectedGroup.campus}/><Metric label="Students" value={String(selectedGroup.studentCount)}/></div>}
    </div>

    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <TimetableGrid group={group} weekStart={weekStart}/>
      <aside className="space-y-6">
        <div className="enterprise-card p-5"><h3 className="mb-4 font-semibold text-navy">Scheduled classes</h3>{sessions.length ? sessions.map(session => <div key={session.id} className="mb-3 rounded-2xl bg-slate-50 p-3"><p className="font-semibold text-navy">{session.moduleCode}</p><p className="mt-1 text-sm text-slate-500">{session.day} {session.start}–{session.end}</p><p className="text-sm text-slate-500">{session.room} · {session.campus}</p></div>) : <p className="text-sm text-slate-500">No sessions are assigned to this group.</p>}</div>
        <div className="enterprise-card p-5"><h3 className="mb-4 font-semibold text-navy">Modules</h3><div className="space-y-2">{modules.length ? modules.map(module => <div key={module.code} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3"><div><p className="text-sm font-semibold text-navy">{module.code}</p><p className="text-xs text-slate-500">{module.name}</p></div><StatusBadge value="Scheduled"/></div>) : <p className="text-sm text-slate-500">No modules are assigned.</p>}</div></div>
      </aside>
    </div>
  </AppShell>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 font-semibold text-navy">{value}</p></div>;
}
