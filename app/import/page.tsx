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
  const [message, setMessage] = useState("Live system starts empty. Upload CSV files or load sample templates into staging, then click Generate Timetable to publish data across the tool.");

  async function handleFile(type: ImportType, file?: File) {
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    setPreview({ type, rows });
    importRows(type, rows);
    setMessage(`${rows.length} ${type} rows staged successfully. They will appear across the tool only after Generate Timetable.`);
  }

  function loadSample(type: ImportType) {
    const rows = parseCsv(templates[type]);
    setPreview({ type, rows });
    importRows(type, rows);
    setMessage(`Sample ${type} template staged. It will appear across the tool only after Generate Timetable.`);
  }

  function downloadTemplate(type: ImportType) {
    const blob = new Blob([templates[type]], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportTimetable() {
    const rows = data.sessions.map(s => ({ Day: s.day, Start: s.start, End: s.end, Module: s.moduleCode, ModuleName: s.moduleName, Lecturer: s.lecturer, Room: s.room, Group: s.group, Campus: s.campus, Enrolled: s.enrolled, Capacity: s.capacity }));
    const blob = new Blob([toCsv(rows)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-timetable.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return <AppShell title="Data Import & Auto Scheduler" subtitle="Import institutional data, generate a timetable, and push live changes across the demo.">
    <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="enterprise-card p-5">
        <div className="flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Database size={20}/></div><div><h3 className="font-bold text-navy">Working model flow</h3><p className="mt-1 text-sm leading-6 text-slate-600">Import rooms, lecturers, cohorts and modules into a staging area first. The rest of the tool remains empty until Generate Timetable is clicked. The scheduler then publishes the generated working model across dashboards, room bookings, lecturer workloads, student schedules, conflict alerts and analytics.</p></div></div>
        <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-800">{message}</div>
      </div>
      <div className="enterprise-card p-5">
        <h3 className="font-bold text-navy">Staged vs Live Data</h3>
        <p className="mt-1 text-xs text-slate-500">Staged data is imported input. Live data is published only after scheduling.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Metric label="Staged Rooms" value={stagedData.rooms.length}/><Metric label="Live Rooms" value={data.rooms.length}/><Metric label="Staged Lecturers" value={stagedData.lecturers.length}/><Metric label="Live Lecturers" value={data.lecturers.length}/><Metric label="Staged Groups" value={stagedData.studentGroups.length}/><Metric label="Live Sessions" value={data.sessions.length}/>
        </div>
        <div className="mt-5 grid gap-2"><button onClick={() => { generateSchedule(); setMessage("Timetable generated and published. Dashboard, Rooms, Lecturers, Students, Conflicts and Analytics now use the imported data."); }} className="btn-primary w-full"><Wand2 size={16}/>Generate Timetable</button><button onClick={exportTimetable} className="btn-secondary w-full"><Download size={16}/>Export Timetable CSV</button><button onClick={() => { resetData(); setPreview(null); setMessage("All live and staged data cleared. The tool is empty again until data is imported and generated."); }} className="btn-secondary w-full"><RefreshCcw size={16}/>Reset Demo Data</button></div>
      </div>
    </div>

    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {cards.map(card => <div key={card.type} className="enterprise-card p-5">
        <div className="mb-4 flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-navy"><FileSpreadsheet size={18}/></div><div><h3 className="font-bold text-navy">{card.title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{card.description}</p></div></div>
        <label className="btn-primary w-full cursor-pointer justify-center"><Upload size={16}/>Upload CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={e=>handleFile(card.type, e.target.files?.[0])}/></label>
        <div className="mt-3 flex gap-2"><button onClick={()=>loadSample(card.type)} className="btn-secondary flex-1">Load Sample</button><button onClick={()=>downloadTemplate(card.type)} className="btn-secondary flex-1">Template</button></div>
      </div>)}
    </div>

    <div className="enterprise-card mt-6 overflow-hidden">
      <div className="border-b border-slate-200 p-5"><h3 className="font-bold text-navy">Import Preview</h3><p className="mt-1 text-sm text-slate-500">The latest imported file appears below before it is used by the scheduler.</p></div>
      <div className="overflow-auto p-5">{preview?.rows.length ? <table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{Object.keys(preview.rows[0]).map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{preview.rows.slice(0,8).map((row,i)=><tr key={i} className="border-b last:border-0">{Object.keys(preview.rows[0]).map(h=><td key={h} className="p-3">{row[h]}</td>)}</tr>)}</tbody></table> : <p className="text-sm text-slate-500">No import preview yet. Upload a CSV or click Load Sample.</p>}</div>
    </div>
  </AppShell>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-xl font-bold text-navy">{value}</p></div>; }
