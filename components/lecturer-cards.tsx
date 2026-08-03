"use client";
import { useCampusData } from "@/components/data-context";
import { StatusBadge } from "@/components/status-badge";

export function LecturerCards() {
  const { data } = useCampusData();
  return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{data.lecturers.map(l => <div key={l.id || l.name} className="enterprise-card p-5"><div className="flex items-start justify-between gap-2"><div><h3 className="font-bold text-navy">{l.name}</h3><p className="mt-1 text-sm text-slate-500">{l.department}</p></div><StatusBadge value={l.workload}/></div><div className="mt-4 space-y-3 text-sm"><p><span className="font-semibold text-slate-500">Modules:</span> {l.modules.length ? l.modules.join(", ") : data.modules.filter(m=>m.lecturerId===l.id).map(m=>m.code).join(", ") || "Not assigned"}</p><p><span className="font-semibold text-slate-500">Weekly hours:</span> {l.weeklyHours || data.sessions.filter(s=>s.lecturer===l.name).length*2} / {l.maxWeeklyHours || 18}</p><p><span className="font-semibold text-slate-500">Availability:</span> {l.availability}</p></div></div>)}</div>;
}
