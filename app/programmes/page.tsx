"use client";

import { useMemo, useState } from "react";
import { BookOpen, Plus, Search, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useCampusData } from "@/components/data-context";
import { campusesFromData, programmeId } from "@/lib/master-data";
import type { Module, Programme } from "@/types";

export default function ProgrammesPage() {
  const { data, addProgramme, addModule } = useCampusData();
  const campuses = campusesFromData(data);
  const [campus, setCampus] = useState(campuses[0] || "Birmingham");
  const [query, setQuery] = useState("");
  const [createMode, setCreateMode] = useState<"programme" | "module" | null>(null);
  const [message, setMessage] = useState("");

  const programmes = useMemo(() => (data.programmes || []).filter(item => item.campus === campus && `${item.code} ${item.name}`.toLowerCase().includes(query.toLowerCase())), [campus, data.programmes, query]);
  const modules = useMemo(() => data.modules.filter(item => item.campus === campus && `${item.code} ${item.name} ${item.course}`.toLowerCase().includes(query.toLowerCase())), [campus, data.modules, query]);

  return <AppShell title="Programmes & Modules" subtitle="Maintain separate Programme of Study and module records for each campus">
    <div className="enterprise-card p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <select className="input sm:w-56" value={campus} onChange={event => setCampus(event.target.value)}>{campuses.map(item => <option key={item}>{item}</option>)}</select>
          <div className="relative sm:w-80"><Search className="absolute left-3 top-2.5 text-slate-400" size={17}/><input className="input w-full pl-9" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search programmes or modules"/></div>
        </div>
        <div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={() => { setCreateMode("programme"); setMessage(""); }}><Plus size={16}/>Create Programme</button><button className="btn-primary" onClick={() => { setCreateMode("module"); setMessage(""); }}><Plus size={16}/>Create Module</button></div>
      </div>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <section className="enterprise-card overflow-hidden">
        <div className="border-b border-slate-200 p-5"><h3 className="font-bold text-navy">Programme of Study</h3><p className="mt-1 text-sm text-slate-500">{programmes.length} records maintained under {campus}</p></div>
        <div className="divide-y divide-slate-100">{programmes.map(programme => <div key={programme.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-navy">{programme.code}</p><p className="mt-1 text-sm text-slate-600">{programme.name}</p></div><span className="badge bg-emerald-50 text-emerald-700">{programme.status}</span></div><p className="mt-2 text-xs text-slate-500">{programme.id} · {programme.academicYear} · {programme.campus}</p></div>)}</div>
        {!programmes.length && <p className="p-8 text-center text-sm text-slate-500">No programme records match the selected campus and search.</p>}
      </section>

      <section className="enterprise-card overflow-hidden">
        <div className="border-b border-slate-200 p-5"><h3 className="font-bold text-navy">Modules</h3><p className="mt-1 text-sm text-slate-500">Each module record belongs to one campus-specific Programme of Study.</p></div>
        <div className="overflow-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500"><th className="p-4">Module</th><th>Programme</th><th>Staff</th><th>Sessions</th><th>Room type</th></tr></thead><tbody>{modules.map(module => <tr key={module.code} className="border-b last:border-0"><td className="p-4"><p className="font-semibold text-navy">{module.code}</p><p className="text-xs text-slate-500">{module.name}</p></td><td>{module.course}<p className="text-xs text-slate-500">{module.programmeId}</p></td><td>{module.lecturerName || "Unassigned"}</td><td>{module.weeklySessions || 1} × {module.hoursPerSession || 2} hrs</td><td>{module.roomTypeRequired || "Not set"}</td></tr>)}</tbody></table></div>
        {!modules.length && <p className="p-8 text-center text-sm text-slate-500">No module records match the selected campus and search.</p>}
      </section>
    </div>

    {createMode && <CreateModal mode={createMode} campus={campus} data={data} message={message} onClose={() => setCreateMode(null)} onCreateProgramme={programme => {
      if ((data.programmes || []).some(item => item.id === programme.id)) { setMessage("A programme with this campus and code already exists."); return; }
      addProgramme(programme); setCreateMode(null);
    }} onCreateModule={module => {
      if (data.modules.some(item => item.code.toLowerCase() === module.code.toLowerCase())) { setMessage("A module with this code already exists."); return; }
      addModule(module); setCreateMode(null);
    }}/>} 
  </AppShell>;
}

function CreateModal({ mode, campus, data, message, onClose, onCreateProgramme, onCreateModule }: { mode: "programme" | "module"; campus: string; data: ReturnType<typeof useCampusData>["data"]; message: string; onClose: () => void; onCreateProgramme: (programme: Programme) => void; onCreateModule: (module: Module) => void }) {
  const campusProgrammes = (data.programmes || []).filter(item => item.campus === campus);
  const staff = data.lecturers.filter(item => item.primaryCampus === campus || (item.additionalCampuses || []).includes(campus));
  const [form, setForm] = useState({ code: "", name: "", academicYear: "2026/27", programmeCode: campusProgrammes[0]?.code || "", lecturer: "", weeklySessions: "1", hours: "2", roomType: "Workshop room" });

  function submit() {
    if (!form.code.trim() || !form.name.trim()) return;
    if (mode === "programme") {
      onCreateProgramme({ id: programmeId(campus, form.code.trim()), code: form.code.trim().toUpperCase(), name: form.name.trim(), campus, academicYear: form.academicYear, status: "Active" });
      return;
    }
    const selectedProgramme = campusProgrammes.find(item => item.code === form.programmeCode);
    const lecturer = staff.find(item => item.name === form.lecturer);
    onCreateModule({
      id: `M-${Date.now()}`,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      course: selectedProgramme?.code || form.programmeCode,
      campus,
      programmeId: selectedProgramme?.id || programmeId(campus, form.programmeCode),
      lecturerId: lecturer?.id,
      lecturerName: lecturer?.name,
      weeklySessions: Number(form.weeklySessions || 1),
      hoursPerSession: Number(form.hours || 2),
      roomTypeRequired: form.roomType
    });
  }

  return <div className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4"><div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-executive"><div className="flex items-start justify-between"><div><h3 className="flex items-center gap-2 text-xl font-bold text-navy"><BookOpen size={20}/>{mode === "programme" ? "Create Programme of Study" : "Create Module"}</h3><p className="mt-1 text-sm text-slate-500">New record will be maintained under {campus}.</p></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><X size={18}/></button></div>{message && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{message}</div>}<div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Campus"><input className="input w-full bg-slate-50" value={campus} disabled/></Field><Field label={mode === "programme" ? "Programme code" : "Module code"}><input className="input w-full" value={form.code} onChange={event => setForm({ ...form, code: event.target.value })}/></Field><Field label={mode === "programme" ? "Programme name" : "Module name"}><input className="input w-full" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })}/></Field>{mode === "programme" ? <Field label="Academic year"><input className="input w-full" value={form.academicYear} onChange={event => setForm({ ...form, academicYear: event.target.value })}/></Field> : <><Field label="Programme of Study"><select className="input w-full" value={form.programmeCode} onChange={event => setForm({ ...form, programmeCode: event.target.value })}>{campusProgrammes.map(item => <option key={item.id} value={item.code}>{item.code} · {item.name}</option>)}</select></Field><Field label="Staff"><select className="input w-full" value={form.lecturer} onChange={event => setForm({ ...form, lecturer: event.target.value })}><option value="">Unassigned</option>{staff.map(item => <option key={item.id || item.name}>{item.name}</option>)}</select></Field><Field label="Weekly sessions"><input className="input w-full" type="number" min="1" value={form.weeklySessions} onChange={event => setForm({ ...form, weeklySessions: event.target.value })}/></Field><Field label="Hours per session"><input className="input w-full" type="number" min="0.5" step="0.5" value={form.hours} onChange={event => setForm({ ...form, hours: event.target.value })}/></Field><Field label="Room type"><input className="input w-full" value={form.roomType} onChange={event => setForm({ ...form, roomType: event.target.value })}/></Field></>}</div><div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit} disabled={!form.code.trim() || !form.name.trim() || (mode === "module" && !form.programmeCode)}>Create</button></div></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>; }
