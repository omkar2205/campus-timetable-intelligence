"use client";

import { AppShell } from "@/components/app-shell";
import { useCampusData } from "@/components/data-context";
import { parseCsv, templates, toCsv } from "@/lib/csv";
import { Database, Download, FileSpreadsheet, RefreshCcw, Upload, Wand2 } from "lucide-react";
import { useState } from "react";

type ImportType = "rooms" | "lecturers" | "studentGroups" | "modules" | "requirements";

const cards: { type: ImportType; title: string; description: string }[] = [
  { type: "rooms", title: "Classrooms / Rooms", description: "Room name, campus, building, type, capacity and availability." },
  { type: "lecturers", title: "Lecturers", description: "Lecturer profile, department, availability and weekly hour limits." },
  { type: "studentGroups", title: "Students / Cohorts", description: "Student groups, course, campus and cohort size." },
  { type: "modules", title: "Courses & Modules", description: "Module ownership, weekly sessions, duration and required room type." },
  { type: "requirements", title: "Scheduling Requirements", description: "Preferred days, times, avoid days and room constraints." }
];

export default function ImportPage() {
  const { data, stagedData, importRows, generateSchedule, resetData } = useCampusData();
  const [preview, setPreview] = useState<{ type: ImportType; rows: Record<string, string>[] } | null>(null);
  const [message, setMessage] = useState("A complete dummy timetable is already loaded for testing. Upload replacement CSV files into staging when you want to test a new dataset.");

  async function handleFile(type: ImportType, file?: File) {
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    setPreview({ type, rows });
    importRows(type, rows);
    setMessage(`${rows.length} ${type} rows staged successfully. The current demo remains unchanged until Generate Timetable is selected.`);
  }

  function loadSample(type: ImportType) {
    const rows = parseCsv(templates[type]);
    setPreview({ type, rows });
    importRows(type, rows);
    setMessage(`Sample ${type} data staged. Load the remaining required datasets, then select Generate Timetable.`);
  }

  function downloadTemplate(type: ImportType) {
    const blob = new Blob([templates[type]], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${type}-template.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportTimetable() {
    const rows = data.sessions.map(session => ({
      Day: session.day,
      Start: session.start,
      End: session.end,
      Module: session.moduleCode,
      ModuleName: session.moduleName,
      Lecturer: session.lecturer,
      Room: session.room,
      Group: session.group,
      Campus: session.campus,
      Enrolled: session.enrolled,
      Capacity: session.capacity
    }));
    const blob = new Blob([toCsv(rows)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "generated-timetable.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <AppShell title="Data Import & Auto Scheduler" subtitle="Test the existing dummy timetable or stage replacement institutional data.">
    <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="enterprise-card p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Database size={20}/></div>
          <div>
            <h3 className="font-bold text-navy">Working demo flow</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">The platform opens with linked dummy data for Birmingham and Manchester, so every page can be tested immediately. Imported CSV files are kept in staging until Generate Timetable is selected. The new schedule then replaces the current demo across the dashboard, rooms, lecturers, students, conflicts and analytics.</p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-800">{message}</div>
      </div>

      <div className="enterprise-card p-5">
        <h3 className="font-bold text-navy">Staged vs Live Data</h3>
        <p className="mt-1 text-xs text-slate-500">Live data is the timetable currently shown across the platform. Staged data is waiting to be scheduled.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Metric label="Staged Rooms" value={stagedData.rooms.length}/>
          <Metric label="Live Rooms" value={data.rooms.length}/>
          <Metric label="Staged Lecturers" value={stagedData.lecturers.length}/>
          <Metric label="Live Lecturers" value={data.lecturers.length}/>
          <Metric label="Staged Groups" value={stagedData.studentGroups.length}/>
          <Metric label="Live Sessions" value={data.sessions.length}/>
        </div>
        <div className="mt-5 grid gap-2">
          <button onClick={() => { generateSchedule(); setMessage(stagedData.modules.length ? "The staged dataset has been scheduled and published across the platform." : "The current dummy dataset has been re-optimised."); }} className="btn-primary w-full"><Wand2 size={16}/>Generate Timetable</button>
          <button onClick={exportTimetable} className="btn-secondary w-full"><Download size={16}/>Export Timetable CSV</button>
          <button onClick={() => { resetData(); setPreview(null); setMessage("The complete Birmingham and Manchester dummy dataset has been restored."); }} className="btn-secondary w-full"><RefreshCcw size={16}/>Restore Full Demo Data</button>
        </div>
      </div>
    </div>

    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {cards.map(card => <div key={card.type} className="enterprise-card p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-navy"><FileSpreadsheet size={18}/></div>
          <div><h3 className="font-bold text-navy">{card.title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{card.description}</p></div>
        </div>
        <label className="btn-primary w-full cursor-pointer justify-center"><Upload size={16}/>Upload CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={event => handleFile(card.type, event.target.files?.[0])}/></label>
        <div className="mt-3 flex gap-2"><button onClick={() => loadSample(card.type)} className="btn-secondary flex-1">Load Sample</button><button onClick={() => downloadTemplate(card.type)} className="btn-secondary flex-1">Template</button></div>
      </div>)}
    </div>

    <div className="enterprise-card mt-6 overflow-hidden">
      <div className="border-b border-slate-200 p-5"><h3 className="font-bold text-navy">Import Preview</h3><p className="mt-1 text-sm text-slate-500">The latest imported file appears below before it is used by the scheduler.</p></div>
      <div className="overflow-auto p-5">{preview?.rows.length ? <table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{Object.keys(preview.rows[0]).map(header => <th key={header} className="p-3">{header}</th>)}</tr></thead><tbody>{preview.rows.slice(0, 8).map((row, index) => <tr key={index} className="border-b last:border-0">{Object.keys(preview.rows[0]).map(header => <td key={header} className="p-3">{row[header]}</td>)}</tr>)}</tbody></table> : <p className="text-sm text-slate-500">No import preview yet. Upload a CSV or click Load Sample.</p>}</div>
    </div>
  </AppShell>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-xl font-bold text-navy">{value}</p></div>;
}
