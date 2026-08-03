"use client";

import Link from "next/link";
import { Bell, CalendarDays, Cloud, CloudOff, FileBarChart, HardDrive, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useCampusData, type BackendStatus } from "@/components/data-context";

export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  const [open, setOpen] = useState(false);
  const { data, backendStatus } = useCampusData();
  const activeConflicts = data.conflicts.filter(conflict => !conflict.resolved);
  const connection = connectionDisplay(backendStatus);
  const ConnectionIcon = connection.icon;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-soft/90 backdrop-blur-xl">
      <div className="flex min-h-20 items-center justify-between gap-4 px-6 py-3 lg:px-8">
        <div><h2 className="text-2xl font-bold tracking-tight text-navy">{title}</h2><p className="text-sm text-slate-500">{subtitle}</p></div>
        <div className="flex items-center gap-2">
          <span className={`hidden items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold sm:inline-flex ${connection.className}`} title={connection.detail}>
            <ConnectionIcon size={15} className={backendStatus === "Connecting" || backendStatus === "Syncing" ? "animate-spin" : ""}/>
            {connection.label}
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

function connectionDisplay(status: BackendStatus) {
  if (status === "Connected") return {
    label: "Backend online",
    detail: "The Apps Script service is reachable and shared writes are enabled.",
    icon: Cloud,
    className: "bg-emerald-50 text-emerald-700"
  };
  if (status === "Connecting") return {
    label: "Checking backend",
    detail: "The platform is checking the Apps Script service.",
    icon: Loader2,
    className: "bg-blue-50 text-blue-700"
  };
  if (status === "Syncing") return {
    label: "Saving changes",
    detail: "The latest timetable changes are being submitted to the backend.",
    icon: RefreshCw,
    className: "bg-blue-50 text-blue-700"
  };
  if (status === "Unavailable") return {
    label: "Local data",
    detail: "The backend could not be reached. The platform is continuing with browser storage.",
    icon: CloudOff,
    className: "bg-amber-50 text-amber-700"
  };
  return {
    label: "Local data",
    detail: "The platform is using browser storage for this session.",
    icon: HardDrive,
    className: "bg-slate-100 text-slate-600"
  };
}
