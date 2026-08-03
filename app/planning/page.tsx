"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardCheck, Edit3, RefreshCcw, Search, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useWorkflow } from "@/components/workflow-context";
import { formatWeekPattern, parseWeekPattern, validateTemplate } from "@/lib/workflow";
import type { ActivityTemplate } from "@/types/workflow";

export default function PlanningPage() {
  const { templates, updateTemplate, refreshTemplates } = useWorkflow();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<ActivityTemplate | null>(null);
  const [weekPattern, setWeekPattern] = useState("");

  const ready = templates.filter(template => template.status === "Ready").length;
  const blocked = templates.filter(template => template.status === "Blocked").length;
  const draft = templates.filter(template => template.status === "Draft").length;
  const filtered = useMemo(() => templates.filter(template => {
    if (status !== "All" && template.status !== status) return false;
    const text = [template.name, template.moduleCode, template.programme, template.campus, template.studentGroup, template.activityType].join(" ").toLowerCase();
    return text.includes(query.toLowerCase());
  }), [query, status, templates]);

  function openTemplate(template: ActivityTemplate) {
    setSelected(template);
    setWeekPattern(formatWeekPattern(template.teachingWeeks));
  }

  function saveTemplate() {
    if (!selected) return;
    updateTemplate(selected.id, { ...selected, teachingWeeks: parseWeekPattern(weekPattern) });
    setSelected(null);
  }

  return <AppShell title="Activity Planning" subtitle="Create and validate teaching requirements before timetable generation">
    <div className="grid gap-4 md:grid-cols-4">
      <Metric label="Activity templates" value={templates.length} detail="Derived from modules and scheduling requirements"/>
      <Metric label="Ready to schedule" value={ready} detail="All required checks passed" tone="good"/>
      <Metric label="Blocked" value={blocked} detail="Missing or invalid information" tone={blocked ? "bad" : "good"}/>
      <Metric label="Draft" value={draft} detail="Still being prepared"/>
    </div>

    <div className="mt-6 enterprise-card p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="font-bold text-navy">Pre-scheduling validation</h3>
          <p className="mt-1 text-sm text-slate-500">Templates are checked for module, student group, description, size, duration, teaching weeks, tutor suitability and room suitability.</p>
        </div>
        <button onClick={refreshTemplates} className="btn-secondary"><RefreshCcw size={16}/>Refresh from source data</button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Checklist label="Module and student sets linked" passed={templates.every(template => Boolean(template.moduleCode && template.studentGroup))}/>
        <Checklist label="Teaching patterns entered" passed={templates.every(template => template.teachingWeeks.length > 0)}/>
        <Checklist label="Tutor suitability entered" passed={templates.every(template => Boolean(template.lecturerSuitability))}/>
        <Checklist label="Room suitability entered" passed={templates.every(template => Boolean(template.roomSuitability))}/>
      </div>
    </div>

    <div className="mt-6 enterprise-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-96"><Search className="absolute left-3 top-2.5 text-slate-400" size={17}/><input className="input w-full pl-9" placeholder="Search templates, modules or groups" value={query} onChange={event => setQuery(event.target.value)}/></div>
        <select className="input" value={status} onChange={event => setStatus(event.target.value)}><option>All</option><option>Ready</option><option>Blocked</option><option>Draft</option></select>
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[1240px] text-left text-sm">
          <thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500"><th className="p-4">Template</th><th>Programme</th><th>Activity</th><th>Student group</th><th>Size</th><th>Duration</th><th>Teaching weeks</th><th>Suitabilities</th><th>Status</th><th></th></tr></thead>
          <tbody>{filtered.map(template => <tr key={template.id} className="border-b align-top last:border-0 hover:bg-slate-50">
            <td className="p-4"><p className="font-semibold text-navy">{template.moduleCode}</p><p className="mt-1 max-w-xs text-xs text-slate-500">{template.name}</p></td>
            <td>{template.programme}<p className="text-xs text-slate-500">{template.campus}</p></td>
            <td>{template.activityType}<p className="text-xs text-slate-500">{template.weeklySessions} per week</p></td>
            <td>{template.studentGroup}</td><td>{template.plannedSize}</td><td>{template.durationHours} hrs</td><td>{formatWeekPattern(template.teachingWeeks)}</td>
            <td><p className="text-xs text-slate-600">{template.lecturerSuitability || "Not set"}</p><p className="mt-1 text-xs text-slate-500">{template.roomSuitability || "Not set"}</p></td>
            <td><Status value={template.status}/></td>
            <td><button onClick={() => openTemplate(template)} className="btn-secondary"><Edit3 size={15}/>Edit</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      {!filtered.length && <p className="p-10 text-center text-sm text-slate-500">No activity templates match the current filters.</p>}
    </div>

    {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-executive">
        <div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-bold text-navy">Edit Activity Template</h3><p className="mt-1 text-sm text-slate-500">{selected.moduleCode} · {selected.moduleName}</p></div><button onClick={() => setSelected(null)} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><X size={18}/></button></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Template name"><input className="input w-full" value={selected.name} onChange={event => setSelected({ ...selected, name: event.target.value })}/></Field>
          <Field label="Activity type"><select className="input w-full" value={selected.activityType} onChange={event => setSelected({ ...selected, activityType: event.target.value })}><option>Workshop</option><option>Large Group</option><option>Advocacy</option><option>Oral Skills</option><option>Assessment</option><option>Meeting</option></select></Field>
          <Field label="Planned size"><input className="input w-full" type="number" min="1" value={selected.plannedSize} onChange={event => setSelected({ ...selected, plannedSize: Number(event.target.value) })}/></Field>
          <Field label="Duration in hours"><input className="input w-full" type="number" min="0.25" step="0.25" value={selected.durationHours} onChange={event => setSelected({ ...selected, durationHours: Number(event.target.value) })}/></Field>
          <Field label="Weekly sessions"><input className="input w-full" type="number" min="1" value={selected.weeklySessions} onChange={event => setSelected({ ...selected, weeklySessions: Number(event.target.value) })}/></Field>
          <Field label="Teaching weeks"><input className="input w-full" value={weekPattern} onChange={event => setWeekPattern(event.target.value)} placeholder="1-12 or 1,3,5,7"/></Field>
          <Field label="Student group"><input className="input w-full" value={selected.studentGroup} onChange={event => setSelected({ ...selected, studentGroup: event.target.value })}/></Field>
          <Field label="Tutor suitability"><input className="input w-full" value={selected.lecturerSuitability} onChange={event => setSelected({ ...selected, lecturerSuitability: event.target.value })}/></Field>
          <Field label="Room suitability"><input className="input w-full" value={selected.roomSuitability} onChange={event => setSelected({ ...selected, roomSuitability: event.target.value })}/></Field>
          <Field label="Preferred days"><input className="input w-full" value={selected.preferredDays} onChange={event => setSelected({ ...selected, preferredDays: event.target.value })}/></Field>
          <Field label="Preferred time"><select className="input w-full" value={selected.preferredTime} onChange={event => setSelected({ ...selected, preferredTime: event.target.value })}><option value="">No preference</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></Field>
          <Field label="Publication rule"><select className="input w-full" value={selected.publicationRule} onChange={event => setSelected({ ...selected, publicationRule: event.target.value as ActivityTemplate["publicationRule"] })}><option>Standard</option><option>Hold until approved</option></select></Field>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 p-4"><h4 className="flex items-center gap-2 font-semibold text-navy"><ClipboardCheck size={18}/>Validation checklist</h4><div className="mt-3 grid gap-2 md:grid-cols-2">{validateTemplate({ ...selected, teachingWeeks: parseWeekPattern(weekPattern) }).map(item => <div key={item.label} className={item.passed ? "rounded-xl bg-emerald-50 p-3" : "rounded-xl bg-red-50 p-3"}><p className={item.passed ? "flex items-center gap-2 text-sm font-semibold text-emerald-700" : "flex items-center gap-2 text-sm font-semibold text-red-700"}>{item.passed ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {item.label}</p>{!item.passed && <p className="mt-1 text-xs text-red-600">{item.message}</p>}</div>)}</div></div>
        <div className="mt-6 flex justify-end gap-2"><button onClick={() => setSelected(null)} className="btn-secondary">Cancel</button><button onClick={saveTemplate} className="btn-primary">Save template</button></div>
      </div>
    </div>}
  </AppShell>;
}

function Metric({ label, value, detail, tone = "normal" }: { label: string; value: number; detail: string; tone?: "normal" | "good" | "bad" }) {
  const style = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-red-700" : "text-navy";
  return <div className="enterprise-card p-5"><p className="text-sm font-medium text-slate-500">{label}</p><p className={`mt-3 text-3xl font-bold ${style}`}>{value}</p><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></div>;
}

function Checklist({ label, passed }: { label: string; passed: boolean }) {
  return <div className={passed ? "rounded-2xl bg-emerald-50 p-4" : "rounded-2xl bg-red-50 p-4"}><p className={passed ? "flex items-center gap-2 text-sm font-semibold text-emerald-700" : "flex items-center gap-2 text-sm font-semibold text-red-700"}>{passed ? <CheckCircle2 size={17}/> : <AlertCircle size={17}/>} {label}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>;
}

function Status({ value }: { value: ActivityTemplate["status"] }) {
  const className = value === "Ready" ? "bg-emerald-50 text-emerald-700" : value === "Blocked" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";
  return <span className={`badge ${className}`}>{value}</span>;
}
