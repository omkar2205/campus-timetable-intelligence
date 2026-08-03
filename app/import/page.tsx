"use client";

import { useState } from "react";
import { Database, Download, FileSpreadsheet, RefreshCcw, Upload, Wand2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useCampusData } from "@/components/data-context";
import { parseCsv, templates } from "@/lib/csv";
import { downloadCsv, timetableRows } from "@/lib/export";

type ImportType = "rooms" | "lecturers" | "studentGroups" | "modules" | "requirements";

const cards: { type: ImportType; title: string; description: string }[] = [
  { type: "rooms", title: "Classrooms and rooms", description: "Room name, campus, building, type, capacity and operating status." },
  { type: "lecturers", title: "Lecturers", description: "Lecturer profile, department, availability and weekly teaching limits." },
  { type: "studentGroups", title: "Student groups", description: "Cohort name, course, campus and student count." },
  { type: "modules", title: "Courses and modules", description: "Module ownership, weekly sessions, duration and room requirements." },
  { type: "requirements", title: "Scheduling requirements", description: "Preferred days, teaching periods, avoided days and room constraints." }
];

export default function ImportPage() {
  const { data, stagedData, importRows, generateSchedule, resetData } = useCampusData();
  const [preview, setPreview] = useState<{ type: ImportType; rows: Record<string, string>[] } | null>(null);
  const [message, setMessage] = useState("The current timetable remains available while replacement files are uploaded into staging.");

  async function handleFile(type: ImportType, file?: File) {
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) throw new Error("The file does not contain any data rows.");
      setPreview({ type, rows });
      importRows(type, rows);
      setMessage(`${rows.length} ${label(type)} records were added to staging. The current timetable has not changed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The file could not be read.");
    }
  }

  function loadExample(type: ImportType) {
    const rows = parseCsv(templates[type]);
    setPreview({ type, rows });
    importRows(type, rows);
    setMessage(`Example ${label(type)} records were added to staging.`);
  }

  function downloadTemplate(type: ImportType) {
    const blob = new Blob([templates[type]], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${type}-template.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function publishSchedule() {
    const ready = stagedData.rooms.length && stagedData.lecturers.length && stagedData.studentGroups.length && stagedData.modules.length;
    if (!ready) {
      setMessage("Rooms, lecturers, student groups and modules are required before a replacement timetable can be generated.");
      return;
    }
    generateSchedule();
    setMessage("The replacement timetable has been generated and published across the platform.");
  }

  return <AppShell title="Data Import" subtitle="Stage institutional data, validate file structure and generate a replacement timetable">
    <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="enterprise-card p-5">
        <div className="flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Database size={20}/></div><div><h3 className="font-bold text-navy">Controlled import process</h3><p className="mt-1 text-sm leading-6 text-slate-600">Upload source files into staging first. Review the record counts and preview before generating the timetable. The current schedule remains unchanged until the replacement timetable is generated.</p></div></div>
        <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-800">{message}</div>
      </div>

      <div className="enterprise-card p-5">
        <h3 className="font-bold text-navy">Staged and published data</h3>
        <p className="mt-1 text-xs text-slate-500">Staged records are waiting to be scheduled. Published records are currently used across the platform.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Metric label="Staged rooms" value={stagedData.rooms.length}/><Metric label="Published rooms" value={data.rooms.length}/>
          <Metric label="Staged lecturers" value={stagedData.lecturers.length}/><Metric label="Published lecturers" value={data.lecturers.length}/>
          <Metric label="Staged groups" value={stagedData.studentGroups.length}/><Metric label="Published sessions" value={data.sessions.length}/>
          <Metric label="Staged modules" value={stagedData.modules.length}/><Metric label="Staged requirements" value={stagedData.requirements.length}/>
        </div>
        <div className="mt-5 grid gap-2">
          <button onClick={publishSchedule} className="btn-primary w-full"><Wand2 size={16}/>Generate replacement timetable</button>
          <button onClick={() => downloadCsv("current-timetable.csv", timetableRows(data.sessions))} className="btn-secondary w-full"><Download size={16}/>Export current timetable</button>
          <button onClick={() => { resetData(); setPreview(null); setMessage("The reference timetable and source data have been restored."); }} className="btn-secondary w-full"><RefreshCcw size={16}/>Restore reference data</button>
        </div>
      </div>
    </div>

    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {cards.map(card => <div key={card.type} className="enterprise-card p-5">
        <div className="mb-4 flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-navy"><FileSpreadsheet size={18}/></div><div><h3 className="font-bold text-navy">{card.title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{card.description}</p></div></div>
        <label className="btn-primary w-full cursor-pointer justify-center"><Upload size={16}/>Upload CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={event => handleFile(card.type, event.target.files?.[0])}/></label>
        <div className="mt-3 flex gap-2"><button onClick={() => loadExample(card.type)} className="btn-secondary flex-1">Load example</button><button onClick={() => downloadTemplate(card.type)} className="btn-secondary flex-1">Template</button></div>
      </div>)}
    </div>

    <div className="enterprise-card mt-6 overflow-hidden">
      <div className="border-b border-slate-200 p-5"><h3 className="font-bold text-navy">File preview</h3><p className="mt-1 text-sm text-slate-500">The most recently uploaded or loaded file is shown before scheduling.</p></div>
      <div className="overflow-auto p-5">{preview?.rows.length ? <table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{Object.keys(preview.rows[0]).map(header => <th key={header} className="p-3">{header}</th>)}</tr></thead><tbody>{preview.rows.slice(0, 10).map((row, index) => <tr key={index} className="border-b last:border-0">{Object.keys(preview.rows[0]).map(header => <td key={header} className="p-3">{row[header]}</td>)}</tr>)}</tbody></table> : <p className="text-sm text-slate-500">Upload a CSV file or load an example to preview its structure.</p>}</div>
    </div>
  </AppShell>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-xl font-bold text-navy">{value}</p></div>;
}

function label(type: ImportType) {
  return ({ rooms: "room", lecturers: "lecturer", studentGroups: "student-group", modules: "module", requirements: "requirement" } as const)[type];
}
