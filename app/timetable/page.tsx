"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  List,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Table2,
  Wand2
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { TimetableGrid, TimetableFilters } from "@/components/timetable-grid";
import { useCampusData } from "@/components/data-context";
import {
  addDuration,
  addWeeks,
  formatDayDate,
  formatWeekRange,
  isoDate,
  startOfTeachingWeek,
  teachingDays,
  teachingTimes,
  weekDates
} from "@/lib/calendar";
import { downloadCsv, timetableRows } from "@/lib/export";
import type { Session } from "@/types";

const emptyFilters: TimetableFilters = {
  course: "",
  module: "",
  lecturer: "",
  room: "",
  campus: "",
  group: "",
  search: ""
};

export default function TimetablePage() {
  const { data, generateSchedule, updateSession, addManualSession } = useCampusData();
  const [selectedId, setSelectedId] = useState(data.sessions[0]?.id || "");
  const [weekStart, setWeekStart] = useState(() => startOfTeachingWeek(new Date()));
  const [filters, setFilters] = useState<TimetableFilters>(emptyFilters);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [modal, setModal] = useState(false);
  const [draft, setDraft] = useState({
    moduleCode: "",
    lecturer: "",
    room: "",
    group: "",
    day: "Monday",
    start: "09:00",
    duration: "2"
  });

  const dates = useMemo(() => weekDates(weekStart), [weekStart]);
  const selected = useMemo(
    () => data.sessions.find(session => session.id === selectedId) || data.sessions[0],
    [data.sessions, selectedId]
  );
  const courses = unique(data.modules.map(module => module.course));
  const campuses = unique(data.rooms.map(room => room.campus));
  const groups = unique(data.studentGroups.map(group => group.name));

  const visibleSessions = useMemo(() => data.sessions.filter(session => {
    if (session.status === "Cancelled") return false;
    if (session.date && !Object.values(dates).includes(session.date)) return false;
    if (filters.course && session.course !== filters.course) return false;
    if (filters.module && session.moduleCode !== filters.module) return false;
    if (filters.lecturer && session.lecturer !== filters.lecturer) return false;
    if (filters.room && session.room !== filters.room) return false;
    if (filters.campus && session.campus !== filters.campus) return false;
    if (filters.group && session.group !== filters.group) return false;
    if (filters.search) {
      const text = [
        session.moduleCode,
        session.moduleName,
        session.course,
        session.lecturer,
        session.room,
        session.campus,
        session.group
      ].join(" ").toLowerCase();
      if (!text.includes(filters.search.toLowerCase())) return false;
    }
    return true;
  }).sort((a, b) => {
    const dayDifference = teachingDays.indexOf(a.day as typeof teachingDays[number]) - teachingDays.indexOf(b.day as typeof teachingDays[number]);
    return dayDifference || a.start.localeCompare(b.start);
  }), [data.sessions, dates, filters]);

  useEffect(() => {
    if (!selectedId || !data.sessions.some(session => session.id === selectedId)) {
      setSelectedId(data.sessions[0]?.id || "");
    }
  }, [data.sessions, selectedId]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function patchSession(id: string, patch: Partial<Session>) {
    updateSession(id, { ...patch, conflict: undefined });
  }

  function exportSchedule() {
    downloadCsv(`timetable-${isoDate(weekStart)}.csv`, timetableRows(visibleSessions, dates));
  }

  function createSession() {
    const module = data.modules.find(item => item.code === draft.moduleCode) || data.modules[0];
    const room = data.rooms.find(item => item.room === draft.room) || data.rooms[0];
    const group = data.studentGroups.find(item => item.name === draft.group) || data.studentGroups[0];
    const lecturer = draft.lecturer || module?.lecturerName || data.lecturers[0]?.name || "Unassigned";
    const session: Session = {
      id: `manual-${Date.now()}`,
      day: draft.day,
      date: dates[draft.day],
      recurring: false,
      start: draft.start,
      end: addDuration(draft.start, Number(draft.duration || 2)),
      moduleCode: module?.code || "MOD",
      moduleName: module?.name || "Manual Session",
      lecturer,
      room: room?.room || "Unassigned",
      campus: room?.campus || "Unassigned",
      group: group?.name || "Unassigned",
      course: module?.course || group?.course || "General",
      capacity: room?.capacity || 0,
      enrolled: group?.studentCount || 0,
      status: "Scheduled"
    };
    addManualSession(session);
    setSelectedId(session.id);
    setModal(false);
  }

  return <AppShell title="Timetable" subtitle="Plan, filter, move and export teaching schedules across multiple weeks">
    <div className="mb-5 space-y-4">
      <div className="enterprise-card p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setWeekStart(current => addWeeks(current, -1))} className="btn-secondary" aria-label="Previous week"><ChevronLeft size={16}/></button>
            <button onClick={() => setWeekStart(startOfTeachingWeek(new Date()))} className="btn-secondary">Today</button>
            <button onClick={() => setWeekStart(current => addWeeks(current, 1))} className="btn-secondary" aria-label="Next week"><ChevronRight size={16}/></button>
            <div className="ml-1 min-w-40">
              <p className="text-sm font-bold text-navy">{formatWeekRange(weekStart)}</p>
              <p className="text-xs text-slate-500">Teaching week</p>
            </div>
            <label className="ml-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600">
              <CalendarDays size={16}/>
              <input
                type="date"
                value={isoDate(weekStart)}
                onChange={event => event.target.value && setWeekStart(startOfTeachingWeek(event.target.value))}
                className="bg-transparent outline-none"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-xl border border-slate-200 bg-white p-1">
              <button onClick={() => setView("calendar")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${view === "calendar" ? "bg-navy text-white" : "text-slate-600"}`}><Table2 size={15}/>Calendar</button>
              <button onClick={() => setView("list")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${view === "list" ? "bg-navy text-white" : "text-slate-600"}`}><List size={15}/>List</button>
            </div>
            <button onClick={exportSchedule} className="btn-secondary"><Download size={16}/>Export</button>
            <button onClick={generateSchedule} className="btn-secondary"><Wand2 size={16}/>Auto Schedule</button>
            <button onClick={() => setModal(true)} className="btn-primary"><Plus size={16}/>Add Session</button>
          </div>
        </div>
      </div>

      <div className="enterprise-card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={17}/>
            <h3 className="font-semibold text-navy">Filters</h3>
            {activeFilterCount > 0 && <span className="badge bg-teal-50 text-teal-700">{activeFilterCount} active</span>}
          </div>
          <button onClick={() => setFilters(emptyFilters)} className="btn-secondary h-9"><RotateCcw size={15}/>Clear</button>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={17}/>
            <input className="input w-full pl-9" placeholder="Search timetable" value={filters.search || ""} onChange={event => setFilters(current => ({ ...current, search: event.target.value }))}/>
          </div>
          <FilterSelect label="Course" value={filters.course || ""} values={courses} onChange={value => setFilters(current => ({ ...current, course: value }))}/>
          <FilterSelect label="Module" value={filters.module || ""} values={unique(data.modules.map(module => module.code))} onChange={value => setFilters(current => ({ ...current, module: value }))}/>
          <FilterSelect label="Lecturer" value={filters.lecturer || ""} values={unique(data.lecturers.map(lecturer => lecturer.name))} onChange={value => setFilters(current => ({ ...current, lecturer: value }))}/>
          <FilterSelect label="Room" value={filters.room || ""} values={unique(data.rooms.map(room => room.room))} onChange={value => setFilters(current => ({ ...current, room: value }))}/>
          <FilterSelect label="Campus" value={filters.campus || ""} values={campuses} onChange={value => setFilters(current => ({ ...current, campus: value }))}/>
          <FilterSelect label="Student group" value={filters.group || ""} values={groups} onChange={value => setFilters(current => ({ ...current, group: value }))}/>
        </div>
      </div>
    </div>

    <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
      Drag a session to another day or time to move it within the selected week. The platform recalculates room, lecturer, student-group and capacity conflicts after each change.
    </div>

    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      {view === "calendar"
        ? <TimetableGrid filters={filters} weekStart={weekStart} selectedId={selectedId} onSelect={setSelectedId} onMove={patchSession}/>
        : <SessionList sessions={visibleSessions} dates={dates} selectedId={selectedId} onSelect={setSelectedId}/>
      }

      <aside className="enterprise-card p-5">
        <div className="mb-4 flex items-center gap-2"><SlidersHorizontal size={18}/><h3 className="font-semibold text-navy">Session Details</h3></div>
        {selected ? <>
          <select className="input mb-4 w-full" onChange={event => setSelectedId(event.target.value)} value={selected.id}>
            {data.sessions.map(session => <option key={session.id} value={session.id}>{session.moduleCode} · {session.day} {session.start}</option>)}
          </select>
          <dl className="space-y-3 text-sm">
            <Row label="Module" value={`${selected.moduleCode} · ${selected.moduleName}`}/>
            <Row label="Course" value={selected.course}/>
            <Editable label="Lecturer" value={selected.lecturer} options={data.lecturers.map(lecturer => lecturer.name)} onChange={lecturer => patchSession(selected.id, { lecturer })}/>
            <Editable label="Room" value={selected.room} options={data.rooms.map(room => room.room)} onChange={room => {
              const match = data.rooms.find(item => item.room === room);
              patchSession(selected.id, { room, capacity: match?.capacity || selected.capacity, campus: match?.campus || selected.campus });
            }}/>
            <Editable label="Day" value={selected.day} options={[...teachingDays]} onChange={day => patchSession(selected.id, { day, date: dates[day], recurring: false })}/>
            <Editable label="Start" value={selected.start} options={[...teachingTimes]} onChange={start => patchSession(selected.id, { start, end: addDuration(start, getDurationHours(selected.start, selected.end)) })}/>
            <Row label="Date" value={selected.date ? `${formatDayDate(selected.date)} · one-off` : "Repeats each teaching week"}/>
            <Row label="Student group" value={selected.group}/>
            <Row label="Capacity" value={`${selected.enrolled}/${selected.capacity}`}/>
            <Row label="Conflict" value={selected.conflict || "No conflict recorded"}/>
          </dl>
        </> : <p className="text-sm text-slate-500">No sessions match the current selection.</p>}
      </aside>
    </div>

    {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-executive">
        <h3 className="text-xl font-bold text-navy">Add Timetable Session</h3>
        <p className="mt-1 text-sm text-slate-500">The session will be added to the week of {formatWeekRange(weekStart)}.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <FilterSelect label="Module" value={draft.moduleCode} values={data.modules.map(module => module.code)} onChange={moduleCode => {
            const module = data.modules.find(item => item.code === moduleCode);
            setDraft(current => ({ ...current, moduleCode, lecturer: module?.lecturerName || current.lecturer, group: module?.studentGroup || current.group }));
          }}/>
          <FilterSelect label="Lecturer" value={draft.lecturer} values={data.lecturers.map(lecturer => lecturer.name)} onChange={lecturer => setDraft(current => ({ ...current, lecturer }))}/>
          <FilterSelect label="Room" value={draft.room} values={data.rooms.map(room => room.room)} onChange={room => setDraft(current => ({ ...current, room }))}/>
          <FilterSelect label="Student group" value={draft.group} values={groups} onChange={group => setDraft(current => ({ ...current, group }))}/>
          <FilterSelect label="Day" value={draft.day} values={[...teachingDays]} onChange={day => setDraft(current => ({ ...current, day }))}/>
          <FilterSelect label="Start" value={draft.start} values={[...teachingTimes]} onChange={start => setDraft(current => ({ ...current, start }))}/>
          <FilterSelect label="Duration" value={draft.duration} values={["1", "1.5", "2", "2.5", "3"]} onChange={duration => setDraft(current => ({ ...current, duration }))} suffix=" hours"/>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={createSession} className="btn-primary">Create Session</button>
        </div>
      </div>
    </div>}
  </AppShell>;
}

function SessionList({ sessions, dates, selectedId, onSelect }: { sessions: Session[]; dates: Record<string, string>; selectedId: string; onSelect: (id: string) => void }) {
  return <div className="enterprise-card overflow-auto">
    <table className="w-full min-w-[980px] text-left text-sm">
      <thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500"><th className="p-4">Date</th><th>Time</th><th>Module</th><th>Course</th><th>Lecturer</th><th>Room</th><th>Campus</th><th>Student group</th></tr></thead>
      <tbody>{sessions.map(session => <tr key={session.id} onClick={() => onSelect(session.id)} className={`cursor-pointer border-b last:border-0 hover:bg-slate-50 ${selectedId === session.id ? "bg-teal-50" : ""}`}>
        <td className="p-4 font-semibold text-navy">{formatDayDate(session.date || dates[session.day])}<p className="text-xs font-normal text-slate-500">{session.day}</p></td>
        <td>{session.start}–{session.end}</td>
        <td className="font-semibold text-navy">{session.moduleCode}<p className="text-xs font-normal text-slate-500">{session.moduleName}</p></td>
        <td>{session.course}</td><td>{session.lecturer}</td><td>{session.room}</td><td>{session.campus}</td><td>{session.group}</td>
      </tr>)}</tbody>
    </table>
    {!sessions.length && <p className="p-8 text-center text-sm text-slate-500">No sessions match the selected filters and week.</p>}
  </div>;
}

function FilterSelect({ label, value, values, onChange, suffix = "" }: { label: string; value: string; values: readonly string[]; onChange: (value: string) => void; suffix?: string }) {
  return <select className="input w-full" value={value} onChange={event => onChange(event.target.value)}>
    <option value="">{label}</option>
    {values.map(option => <option key={option} value={option}>{option}{suffix}</option>)}
  </select>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase text-slate-400">{label}</dt><dd className="mt-1 font-semibold text-slate-700">{value}</dd></div>;
}

function Editable({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase text-slate-400">{label}</dt><dd className="mt-1"><select className="input w-full" value={value} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option}>{option}</option>)}</select></dd></div>;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function getDurationHours(start: string, end: string) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return Math.max(0.5, (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60);
}
