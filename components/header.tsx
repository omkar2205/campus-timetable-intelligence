"use client";

import Link from "next/link";
import { Bell, CalendarDays, FileBarChart, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { useCampusData } from "@/components/data-context";

export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  const [open, setOpen] = useState(false);
  const { data, backendStatus } = useCampusData();
  const activeConflicts = data.conflicts.filter(conflict => !conflict.resolved);
  const connected = backendStatus === "Connected" || backendStatus === "Syncing";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-soft/90 backdrop-blur-xl">
      <div className="flex min-h-20 items-center justify-between gap-4 px-6 py-3 lg:px-8">
        <div><h2 className="text-2xl font-bold tracking-tight text-navy">{title}</h2><p className="text-sm text-slate-500">{subtitle}</p></div>
        <div className="flex items-center gap-2">
          <span className={connected ? "hidden items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:inline-flex" : "hidden items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 sm:inline-flex"}>
            {connected ? <Wifi size={15}/> : <WifiOff size={15}/>} {backendStatus}
          </span>
          <Link href="/timetable" className="btn-secondary hidden md:inline-flex"><CalendarDays size={16}/>Timetable</Link>
          <Link href="/reports" className="btn-secondary hidden md:inline-flex"><FileBarChart size={16}/>Reports</Link>
          <button onClick={() => setOpen(!open)} className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white" aria-label="Notifications">
            <Bell size={17}/>{activeConflicts.length > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{activeConflicts.length}</span>}
          </button>
        </div>
      </div>
      {open && <div className="absolute right-6 top-16 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-executive lg:right-8">
        <div className="flex items-center justify-between"><p className="font-semibold text-navy">Notifications</p><span className="badge bg-slate-100 text-slate-600">{activeConflicts.length}</span></div>
        {activeConflicts.length ? <div className="mt-3 space-y-2">{activeConflicts.slice(0, 4).map(conflict => <div key={conflict.id || `${conflict.module}-${conflict.time}`} className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-semibold text-navy">{conflict.type}</p><p className="mt-1 text-xs text-slate-500">{conflict.module} · {conflict.time}</p></div>)}</div> : <p className="mt-3 text-sm text-slate-600">No active timetable conflicts.</p>}
      </div>}
    </header>
  );
}
