"use client";

import { useMemo, useState } from "react";
import { CalendarOff, Clock3, Plus, Search, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useCampusData } from "@/components/data-context";
import { useWorkflow } from "@/components/workflow-context";
import type { AvailabilityException } from "@/types/workflow";

const initialDraft = {
  resourceType: "Lecturer" as AvailabilityException["resourceType"],
  resourceId: "",
  resourceName: "",
  startDate: "",
  endDate: "",
  startTime: "09:00",
  endTime: "17:00",
  availabilityType: "Unavailable" as AvailabilityException["availabilityType"],
  reason: "Annual leave",
  notes: ""
};

export default function AvailabilityPage() {
  const { data } = useCampusData();
  const { exceptions, addException, removeException } = useWorkflow();
  const [query, setQuery] = useState("");
  const [resourceType, setResourceType] = useState<"All" | AvailabilityException["resourceType"]>("All");
  const [modal, setModal] = useState(false);
  const [draft, setDraft] = useState(initialDraft);
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => exceptions.filter(exception => {
    if (resourceType !== "All" && exception.resourceType !== resourceType) return false;
    const text = [exception.resourceName, exception.resourceType, exception.reason, exception.notes].join(" ").toLowerCase();
    return text.includes(query.toLowerCase());
  }), [exceptions, query, resourceType]);

  const resources = resourceOptions(draft.resourceType, data);

  function openForm() {
    const options = resourceOptions("Lecturer", data);
    setDraft({ ...initialDraft, resourceId: options[0]?.id || "", resourceName: options[0]?.name || "" });
    setMessage("");
    setModal(true);
  }

  function changeResourceType(type: AvailabilityException["resourceType"]) {
    const options = resourceOptions(type, data);
    setDraft(current => ({ ...current, resourceType: type, resourceId: options[0]?.id || "", resourceName: options[0]?.name || "" }));
  }

  function saveException() {
    if (!draft.resourceName || !draft.startDate || !draft.endDate) {
      setMessage("Select a resource and enter the start and end dates.");
      return;
    }
    if (draft.endDate < draft.startDate) {
      setMessage("The end date cannot be before the start date.");
      return;
    }
    addException(draft);
    setModal(false);
  }

  return <AppShell title="Availability" subtitle="Maintain recurring resource patterns and individual teaching-week exceptions">
    <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
      <div className="space-y-5">
        <div className="enterprise-card p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><h3 className="font-bold text-navy">Availability exceptions</h3><p className="mt-1 text-sm text-slate-500">Record annual leave, meetings, illness, maintenance and other date-specific changes without changing the normal weekly pattern.</p></div>
            <button onClick={openForm} className="btn-primary"><Plus size={16}/>Add exception</button>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1"><Search className="absolute left-3 top-2.5 text-slate-400" size={17}/><input className="input w-full pl-9" placeholder="Search resource or reason" value={query} onChange={event => setQuery(event.target.value)}/></div>
            <select className="input" value={resourceType} onChange={event => setResourceType(event.target.value as typeof resourceType)}><option>All</option><option>Lecturer</option><option>Student group</option><option>Room</option></select>
          </div>
        </div>

        <div className="enterprise-card overflow-hidden">
          <div className="overflow-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500"><th className="p-4">Resource</th><th>Date range</th><th>Time</th><th>Type</th><th>Reason</th><th>Notes</th><th></th></tr></thead><tbody>{filtered.map(exception => <tr key={exception.id} className="border-b last:border-0"><td className="p-4"><p className="font-semibold text-navy">{exception.resourceName}</p><p className="text-xs text-slate-500">{exception.resourceType}</p></td><td>{formatDate(exception.startDate)}{exception.endDate !== exception.startDate && ` – ${formatDate(exception.endDate)}`}</td><td>{exception.startTime}–{exception.endTime}</td><td><AvailabilityBadge value={exception.availabilityType}/></td><td>{exception.reason}</td><td className="max-w-xs text-slate-500">{exception.notes || "—"}</td><td><button onClick={() => removeException(exception.id)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Remove exception"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>
          {!filtered.length && <div className="p-10 text-center"><CalendarOff className="mx-auto text-slate-400" size={32}/><p className="mt-3 text-sm text-slate-500">No availability exceptions match the current filters.</p></div>}
        </div>
      </div>

      <aside className="space-y-5">
        <div className="enterprise-card p-5"><h3 className="font-bold text-navy">Normal lecturer patterns</h3><p className="mt-1 text-sm text-slate-500">Recurring availability remains attached to the lecturer record. Exceptions above apply to individual dates.</p><div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">{data.lecturers.map(lecturer => <div key={lecturer.id || lecturer.name} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-navy">{lecturer.name}</p><p className="mt-1 text-xs text-slate-500">{lecturer.department} · {lecturer.preferredCampus}</p></div><Clock3 className="text-teal-600" size={18}/></div><p className="mt-3 text-sm text-slate-600">{lecturer.availability || "No recurring availability recorded"}</p><p className="mt-2 text-xs font-semibold text-slate-400">Maximum {lecturer.maxWeeklyHours || 18} teaching hours</p></div>)}</div></div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><h3 className="font-semibold text-blue-900">How availability is used</h3><p className="mt-2 text-sm leading-6 text-blue-800">The scheduler uses normal patterns and date-specific exceptions to avoid unsuitable teaching periods. A preferred period is treated as guidance; an unavailable period is treated as a hard restriction.</p></div>
      </aside>
    </div>

    {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-executive">
        <div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-bold text-navy">Add Availability Exception</h3><p className="mt-1 text-sm text-slate-500">Create a date-specific availability change for a lecturer, room or student group.</p></div><button onClick={() => setModal(false)} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><X size={18}/></button></div>
        {message && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</div>}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Resource type"><select className="input w-full" value={draft.resourceType} onChange={event => changeResourceType(event.target.value as AvailabilityException["resourceType"])}><option>Lecturer</option><option>Student group</option><option>Room</option></select></Field>
          <Field label="Resource"><select className="input w-full" value={draft.resourceId} onChange={event => { const option = resources.find(item => item.id === event.target.value); setDraft(current => ({ ...current, resourceId: event.target.value, resourceName: option?.name || "" })); }}>{resources.map(resource => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</select></Field>
          <Field label="Start date"><input className="input w-full" type="date" value={draft.startDate} onChange={event => setDraft(current => ({ ...current, startDate: event.target.value }))}/></Field>
          <Field label="End date"><input className="input w-full" type="date" value={draft.endDate} onChange={event => setDraft(current => ({ ...current, endDate: event.target.value }))}/></Field>
          <Field label="Start time"><input className="input w-full" type="time" value={draft.startTime} onChange={event => setDraft(current => ({ ...current, startTime: event.target.value }))}/></Field>
          <Field label="End time"><input className="input w-full" type="time" value={draft.endTime} onChange={event => setDraft(current => ({ ...current, endTime: event.target.value }))}/></Field>
          <Field label="Availability type"><select className="input w-full" value={draft.availabilityType} onChange={event => setDraft(current => ({ ...current, availabilityType: event.target.value as AvailabilityException["availabilityType"] }))}><option>Unavailable</option><option>Preferred</option><option>Available</option></select></Field>
          <Field label="Reason"><select className="input w-full" value={draft.reason} onChange={event => setDraft(current => ({ ...current, reason: event.target.value }))}><option>Annual leave</option><option>Conference</option><option>Meeting</option><option>Illness</option><option>Working from home</option><option>Maintenance</option><option>Assessment</option><option>Other</option></select></Field>
          <label className="md:col-span-2"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes</span><textarea className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none ring-tealBrand/20 focus:ring-4" value={draft.notes} onChange={event => setDraft(current => ({ ...current, notes: event.target.value }))}/></label>
        </div>
        <div className="mt-6 flex justify-end gap-2"><button onClick={() => setModal(false)} className="btn-secondary">Cancel</button><button onClick={saveException} className="btn-primary">Save exception</button></div>
      </div>
    </div>}
  </AppShell>;
}

function resourceOptions(type: AvailabilityException["resourceType"], data: ReturnType<typeof useCampusData>["data"]) {
  if (type === "Lecturer") return data.lecturers.map(item => ({ id: item.id || item.name, name: item.name }));
  if (type === "Room") return data.rooms.map(item => ({ id: item.id || item.room, name: `${item.room} · ${item.campus}` }));
  return data.studentGroups.map(item => ({ id: item.id || item.name, name: `${item.name} · ${item.course}` }));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>;
}

function AvailabilityBadge({ value }: { value: AvailabilityException["availabilityType"] }) {
  const style = value === "Unavailable" ? "bg-red-50 text-red-700" : value === "Preferred" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";
  return <span className={`badge ${style}`}>{value}</span>;
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
