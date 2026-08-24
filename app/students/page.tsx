"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Search, UserPlus, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useCampusData } from "@/components/data-context";
import { campusesFromData } from "@/lib/master-data";
import { downloadCsv, timetableRows } from "@/lib/export";
import type { Student } from "@/types";

export default function StudentsPage() {
  const { data, addStudent } = useCampusData();
  const campuses = campusesFromData(data);
  const [campus, setCampus] = useState(campuses[0] || "Birmingham");
  const [programme, setProgramme] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [open, setOpen] = useState(false);

  const campusProgrammes = (data.programmes || []).filter(item => item.campus === campus);
  const students = useMemo(() => (data.students || []).filter(student => {
    if (student.campus !== campus) return false;
    if (programme && student.programme !== programme) return false;
    return `${student.id} ${student.name} ${student.email || ""} ${student.programme} ${student.cohort || ""}`.toLowerCase().includes(query.toLowerCase());
  }), [campus, data.students, programme, query]);
  const selected = (data.students || []).find(item => item.id === selectedId) || students[0];
  const sessions = selected ? data.sessions.filter(session => session.campus === selected.campus && (session.studentIds?.includes(selected.id) || selected.moduleCodes.includes(session.moduleCode)) && session.status !== "Cancelled") : [];

  return <AppShell title="Students" subtitle="Maintain and schedule individual student records separately for each campus">
    <div className="enterprise-card p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <select className="input sm:w-52" value={campus} onChange={event => { setCampus(event.target.value); setProgramme(""); setSelectedId(""); }}>{campuses.map(item => <option key={item}>{item}</option>)}</select>
          <select className="input sm:w-56" value={programme} onChange={event => setProgramme(event.target.value)}><option value="">All programmes</option>{campusProgrammes.map(item => <option key={item.id} value={item.code}>{item.code} · {item.name}</option>)}</select>
          <div className="relative sm:w-72"><Search className="absolute left-3 top-2.5 text-slate-400" size={17}/><input className="input w-full pl-9" placeholder="Search student, ID or email" value={query} onChange={event => setQuery(event.target.value)}/></div>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}><UserPlus size={16}/>Create Student</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Students at campus" value={String((data.students || []).filter(item => item.campus === campus).length)}/><Metric label="Programmes" value={String(campusProgrammes.length)}/><Metric label="Visible records" value={String(students.length)}/></div>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="enterprise-card overflow-hidden"><div className="border-b border-slate-200 p-5"><h3 className="font-bold text-navy">Individual student records</h3><p className="mt-1 text-sm text-slate-500">Students are owned by a single campus and allocated individually to modules.</p></div><div className="max-h-[620px] divide-y divide-slate-100 overflow-y-auto">{students.map(student => <button key={student.id} onClick={() => setSelectedId(student.id)} className={`w-full p-4 text-left transition hover:bg-slate-50 ${selected?.id === student.id ? "bg-teal-50" : ""}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-navy">{student.name}</p><p className="text-xs text-slate-500">{student.id} · {student.email}</p></div><span className="badge bg-emerald-50 text-emerald-700">{student.status}</span></div><p className="mt-2 text-sm text-slate-600">{student.programme} · {student.cohort || "No cohort"}</p><p className="mt-1 text-xs text-slate-500">{student.moduleCodes.length} module allocation{student.moduleCodes.length === 1 ? "" : "s"}</p></button>)}</div>{!students.length && <p className="p-10 text-center text-sm text-slate-500">No individual student records match the selected campus and filters.</p>}</section>

      <section className="space-y-6">{selected ? <><div className="enterprise-card p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Student record</p><h3 className="mt-1 text-xl font-bold text-navy">{selected.name}</h3><p className="mt-1 text-sm text-slate-500">{selected.id} · {selected.campus}</p></div><button className="btn-secondary" onClick={() => downloadCsv(`${selected.id}-timetable.csv`, timetableRows(sessions))}><Download size={16}/>Export schedule</button></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric label="Programme" value={selected.programme}/><Metric label="Modules" value={String(selected.moduleCodes.length)}/><Metric label="Scheduled classes" value={String(sessions.length)}/></div></div>
        <div className="enterprise-card p-5"><h3 className="font-bold text-navy">Module allocation</h3><div className="mt-4 grid gap-2 md:grid-cols-2">{selected.moduleCodes.map(code => { const module = data.modules.find(item => item.code === code); return <div key={code} className="rounded-2xl bg-slate-50 p-3"><p className="text-sm font-semibold text-navy">{code}</p><p className="text-xs text-slate-500">{module?.name || "Module"}</p></div>; })}</div>{!selected.moduleCodes.length && <p className="mt-3 text-sm text-slate-500">No modules are allocated to this student.</p>}</div>
        <div className="enterprise-card p-5"><h3 className="font-bold text-navy">Student timetable</h3><div className="mt-4 space-y-3">{sessions.map(session => <div key={session.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-navy">{session.moduleCode} · {session.moduleName}</p><p className="mt-1 text-sm text-slate-500">{session.day} {session.start}–{session.end}</p></div><span className="badge bg-blue-50 text-blue-700">{session.campus}</span></div><p className="mt-2 text-sm text-slate-600">{session.lecturer} · {session.room}</p></div>)}{!sessions.length && <p className="text-sm text-slate-500">No scheduled sessions currently match this student's module allocation.</p>}</div></div></> : <div className="enterprise-card p-8 text-center text-sm text-slate-500">Select a student to review their module allocation and timetable.</div>}</section>
    </div>

    {open && <CreateStudent campus={campus} data={data} onClose={() => setOpen(false)} onCreate={student => { addStudent(student); setSelectedId(student.id); setOpen(false); }}/>} 
  </AppShell>;
}

function CreateStudent({ campus, data, onClose, onCreate }: { campus: string; data: ReturnType<typeof useCampusData>["data"]; onClose: () => void; onCreate: (student: Student) => void }) {
  const programmes = (data.programmes || []).filter(item => item.campus === campus);
  const [form, setForm] = useState({ id: `STU-${campus === "Manchester" ? "MAN" : "BHM"}-${String((data.students || []).length + 1).padStart(3, "0")}`, name: "", email: "", programmeId: programmes[0]?.id || "", cohort: "", moduleCodes: [] as string[] });
  const programme = programmes.find(item => item.id === form.programmeId);
  const modules = data.modules.filter(item => item.campus === campus && item.programmeId === form.programmeId);
  function toggleModule(code: string) { setForm(current => ({ ...current, moduleCodes: current.moduleCodes.includes(code) ? current.moduleCodes.filter(item => item !== code) : [...current.moduleCodes, code] })); }
  function submit() { if (!form.id.trim() || !form.name.trim() || !programme) return; onCreate({ id: form.id.trim(), name: form.name.trim(), email: form.email.trim(), campus, programmeId: programme.id, programme: programme.code, cohort: form.cohort.trim(), moduleCodes: form.moduleCodes, status: "Active" }); }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-executive"><div className="flex items-start justify-between"><div><h3 className="flex items-center gap-2 text-xl font-bold text-navy"><Plus size={20}/>Create Student</h3><p className="mt-1 text-sm text-slate-500">This individual record will belong to {campus}.</p></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><X size={18}/></button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Student ID"><input className="input w-full" value={form.id} onChange={event => setForm({ ...form, id: event.target.value })}/></Field><Field label="Student name"><input className="input w-full" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })}/></Field><Field label="Email"><input className="input w-full" type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })}/></Field><Field label="Campus"><input className="input w-full bg-slate-50" value={campus} disabled/></Field><Field label="Programme of Study"><select className="input w-full" value={form.programmeId} onChange={event => setForm({ ...form, programmeId: event.target.value, moduleCodes: [] })}>{programmes.map(item => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></Field><Field label="Cohort / intake"><input className="input w-full" value={form.cohort} onChange={event => setForm({ ...form, cohort: event.target.value })} placeholder="e.g. Sep 2026"/></Field></div><div className="mt-5"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Individual module allocation</p><div className="grid max-h-56 gap-2 overflow-y-auto rounded-2xl border border-slate-200 p-3 md:grid-cols-2">{modules.map(module => <label key={module.code} className="flex items-start gap-2 rounded-xl p-2 hover:bg-slate-50"><input className="mt-1" type="checkbox" checked={form.moduleCodes.includes(module.code)} onChange={() => toggleModule(module.code)}/><span><span className="block text-sm font-semibold text-navy">{module.code}</span><span className="text-xs text-slate-500">{module.name}</span></span></label>)}{!modules.length && <p className="text-sm text-slate-500">No modules exist for this campus and Programme of Study yet.</p>}</div></div><div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit} disabled={!form.name.trim() || !programme}>Create student record</button></div></div></div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 font-semibold text-navy">{value}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>; }
