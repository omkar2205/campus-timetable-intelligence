"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, CheckCircle2, MoveRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ConflictTable } from "@/components/conflict-table";
import { useCampusData } from "@/components/data-context";

export default function ConflictsPage() {
  const { data } = useCampusData();
  const open = data.conflicts.filter(conflict => !conflict.resolved);
  const critical = open.filter(conflict => conflict.severity === "Critical").length;
  const resolved = data.conflicts.filter(conflict => conflict.resolved).length;

  return <AppShell title="Conflict Alerts" subtitle="Review clashes generated from the current timetable and track their resolution">
    <div className="mb-5 grid gap-4 sm:grid-cols-3">
      <Summary label="Open conflicts" value={open.length} icon={AlertTriangle}/>
      <Summary label="Critical conflicts" value={critical} icon={AlertTriangle}/>
      <Summary label="Resolved conflicts" value={resolved} icon={CheckCircle2}/>
    </div>
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-navy">Conflict checks run after schedule changes</p><p className="mt-1 text-sm text-slate-500">Room overlaps, lecturer overlaps, student-group clashes and capacity issues are recalculated when sessions are moved or added.</p></div><Link href="/timetable" className="btn-secondary">Open timetable<MoveRight size={16}/></Link></div>
    <ConflictTable/>
  </AppShell>;
}

function Summary({ label, value, icon: Icon }: { label: string; value: number; icon: typeof CalendarDays }) {
  return <div className="enterprise-card flex items-center gap-4 p-5"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-navy"><Icon size={20}/></div><div><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-navy">{value}</p></div></div>;
}
