"use client";

import { useState } from "react";
import { Bell, Building2, Database, RefreshCcw, ShieldCheck, UserRoundCog } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useCampusData } from "@/components/data-context";

export default function SettingsPage() {
  const { data, backendConfig, backendStatus, syncNow, resetData } = useCampusData();
  const [message, setMessage] = useState("");

  async function sync() {
    try {
      await syncNow();
      setMessage("The current timetable data has been saved to the shared backend.");
    } catch {
      setMessage("The shared backend could not be reached. Browser storage remains available.");
    }
  }

  const items = [
    { icon: Building2, title: "Institution data", text: `${data.rooms.length} rooms, ${data.studentGroups.length} student groups and ${data.modules.length} modules are currently loaded.` },
    { icon: UserRoundCog, title: "Lecturer data", text: `${data.lecturers.length} lecturers are available for workload and schedule planning.` },
    { icon: Bell, title: "Conflict notifications", text: `${data.conflicts.filter(conflict => !conflict.resolved).length} active conflicts currently require review.` },
    { icon: Database, title: "Data connection", text: `Backend status: ${backendStatus}. Data mode: ${backendConfig.dataMode}.` },
    { icon: ShieldCheck, title: "Data use", text: "Use approved training or operational data in line with your organisation's data-handling requirements." }
  ];

  return <AppShell title="Settings" subtitle="Review data status, connection details and platform controls">
    {message && <div className="mb-5 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-800">{message}</div>}
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map(({ icon: Icon, title, text }) => <div key={title} className="enterprise-card p-6"><div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Icon size={20}/></div><h3 className="font-bold text-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>)}</div>
    <div className="enterprise-card mt-6 p-6">
      <h3 className="font-bold text-navy">Data controls</h3>
      <p className="mt-2 text-sm text-slate-500">Save the current state to the connected backend or restore the prepared reference dataset.</p>
      <div className="mt-5 flex flex-wrap gap-2"><button onClick={sync} className="btn-primary"><Database size={16}/>Sync now</button><button onClick={() => { resetData(); setMessage("The reference dataset has been restored."); }} className="btn-secondary"><RefreshCcw size={16}/>Restore reference data</button></div>
    </div>
  </AppShell>;
}
