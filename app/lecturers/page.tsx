"use client";

import { useMemo, useState } from "react";
import { Plus, Search, UserPlus, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useCampusData } from "@/components/data-context";
import { campusesFromData, staffCanTeachAtCampus } from "@/lib/master-data";
import type { Lecturer } from "@/types";

export default function LecturersPage() {
  const { data, addLecturer } = useCampusData();
  const campuses = campusesFromData(data);
  const [campus, setCampus] = useState(campuses[0] || "Birmingham");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const staff = useMemo(() => data.lecturers.filter(item => {
    if (!staffCanTeachAtCampus(item, campus)) return false;
    return `${item.name} ${item.department} ${item.primaryCampus} ${(item.additionalCampuses || []).join(" ")}`.toLowerCase().includes(query.toLowerCase());
  }), [campus, data.lecturers, query]);

  return <AppShell title="Staff" subtitle="Maintain staff records by primary campus with optional additional teaching campuses">
    <div className="enterprise-card p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row"><select className="input sm:w-56" value={campus} onChange={event => setCampus(event.target.value)}>{campuses.map(item => <option key={item}>{item}</option>)}</select><div className="relative sm:w-80"><Search className="absolute left-3 top-2.5 text-slate-400" size={17}/><input className="input w-full pl-9" placeholder="Search staff or department" value={query} onChange={event => setQuery(event.target.value)}/></div></div>
        <button className="btn-primary" onClick={() => setOpen(true)}><UserPlus size={16}/>Create Staff</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Visible staff" value={String(staff.length)}/><Metric label="Primary at campus" value={String(data.lecturers.filter(item => item.primaryCampus === campus).length)}/><Metric label="Cross-campus staff" value={String(data.lecturers.filter(item => (item.additionalCampuses || []).includes(campus)).length)}/></div>
    </div>

    <div className="mt-6 enterprise-card overflow-hidden"><div className="overflow-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500"><th className="p-4">Staff member</th><th>Department</th><th>Primary campus</th><th>Additional campuses</th><th>Availability</th><th>Teaching</th><th>Workload</th></tr></thead><tbody>{staff.map(item => {
      const teaching = data.sessions.filter(session => session.lecturer === item.name && session.status !== "Cancelled");
      return <tr key={item.id || item.name} className="border-b last:border-0"><td className="p-4"><p className="font-semibold text-navy">{item.name}</p><p className="text-xs text-slate-500">{item.id || "No staff ID"}</p></td><td>{item.department}</td><td><span className="badge bg-blue-50 text-blue-700">{item.primaryCampus || item.preferredCampus}</span></td><td>{(item.additionalCampuses || []).length ? (item.additionalCampuses || []).join(", ") : "None"}</td><td>{item.availability}</td><td>{teaching.length} sessions<p className="text-xs text-slate-500">{item.modules.length} modules</p></td><td>{item.weeklyHours || teaching.length * 2} / {item.maxWeeklyHours || 18} hrs</td></tr>;
    })}</tbody></table></div>{!staff.length && <p className="p-10 text-center text-sm text-slate-500">No staff records match this campus and search.</p>}</div>

    {open && <CreateStaff campuses={campuses} defaultCampus={campus} onClose={() => setOpen(false)} onCreate={lecturer => { addLecturer(lecturer); setOpen(false); }}/>} 
  </AppShell>;
}

function CreateStaff({ campuses, defaultCampus, onClose, onCreate }: { campuses: string[]; defaultCampus: string; onClose: () => void; onCreate: (lecturer: Lecturer) => void }) {
  const [form, setForm] = useState({ name: "", department: "Law School", primaryCampus: defaultCampus, additionalCampuses: [] as string[], availability: "Mon - Fri 09:00 - 17:00", maxWeeklyHours: "30" });
  const availableAdditional = campuses.filter(item => item !== form.primaryCampus);
  function toggleCampus(value: string) { setForm(current => ({ ...current, additionalCampuses: current.additionalCampuses.includes(value) ? current.additionalCampuses.filter(item => item !== value) : [...current.additionalCampuses, value] })); }
  function submit() {
    if (!form.name.trim()) return;
    onCreate({ id: `L-${Date.now()}`, name: form.name.trim(), department: form.department.trim() || "Academic", modules: [], weeklyHours: 0, availability: form.availability, workload: "Normal", primaryCampus: form.primaryCampus, preferredCampus: form.primaryCampus, additionalCampuses: form.additionalCampuses, maxWeeklyHours: Number(form.maxWeeklyHours || 30) });
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4"><div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-executive"><div className="flex items-start justify-between"><div><h3 className="flex items-center gap-2 text-xl font-bold text-navy"><Plus size={20}/>Create Staff</h3><p className="mt-1 text-sm text-slate-500">Set a primary campus and any additional campuses where this staff member can teach.</p></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><X size={18}/></button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Staff name"><input className="input w-full" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })}/></Field><Field label="Department"><input className="input w-full" value={form.department} onChange={event => setForm({ ...form, department: event.target.value })}/></Field><Field label="Primary campus"><select className="input w-full" value={form.primaryCampus} onChange={event => setForm({ ...form, primaryCampus: event.target.value, additionalCampuses: form.additionalCampuses.filter(item => item !== event.target.value) })}>{campuses.map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Maximum weekly hours"><input className="input w-full" type="number" min="1" value={form.maxWeeklyHours} onChange={event => setForm({ ...form, maxWeeklyHours: event.target.value })}/></Field><Field label="Availability"><input className="input w-full" value={form.availability} onChange={event => setForm({ ...form, availability: event.target.value })}/></Field><Field label="Additional teaching campuses"><div className="space-y-2 rounded-2xl border border-slate-200 p-3">{availableAdditional.length ? availableAdditional.map(item => <label key={item} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.additionalCampuses.includes(item)} onChange={() => toggleCampus(item)}/>{item}</label>) : <p className="text-sm text-slate-500">No other campuses available.</p>}</div></Field></div><div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit} disabled={!form.name.trim()}>Create staff record</button></div></div></div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-xl font-bold text-navy">{value}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>; }
