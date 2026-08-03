"use client";

import { DragEvent, Fragment, useMemo, useState } from "react";
import { GripVertical } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { useCampusData } from "@/components/data-context";
import { addDuration, formatDayDate, teachingDays, teachingTimes, weekDates } from "@/lib/calendar";
import type { Session } from "@/types";

export type TimetableFilters = {
  course?: string;
  module?: string;
  lecturer?: string;
  room?: string;
  campus?: string;
  group?: string;
  search?: string;
};

type TimetableGridProps = {
  group?: string;
  filters?: TimetableFilters;
  weekStart?: Date;
  selectedId?: string;
  onSelect?: (id: string) => void;
  onMove?: (id: string, patch: Partial<Session>) => void;
};

export function TimetableGrid({ group, filters = {}, weekStart = new Date(), selectedId, onSelect, onMove }: TimetableGridProps) {
  const { data } = useCampusData();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const dates = useMemo(() => weekDates(weekStart), [weekStart]);
  const selectedWeekDates = Object.values(dates);
  const selectedWeekKey = selectedWeekDates.join("|");

  const filtered = useMemo(() => data.sessions.filter(session => {
    if (session.status === "Cancelled") return false;
    if (session.date && !selectedWeekDates.includes(session.date)) return false;
    if (group && session.group !== group) return false;
    if (filters.course && session.course !== filters.course) return false;
    if (filters.module && session.moduleCode !== filters.module) return false;
    if (filters.lecturer && session.lecturer !== filters.lecturer) return false;
    if (filters.room && session.room !== filters.room) return false;
    if (filters.campus && session.campus !== filters.campus) return false;
    if (filters.group && session.group !== filters.group) return false;
    if (filters.search) {
      const haystack = [session.moduleCode, session.moduleName, session.lecturer, session.room, session.group, session.course, session.campus].join(" ").toLowerCase();
      if (!haystack.includes(filters.search.toLowerCase())) return false;
    }
    return true;
  }), [data.sessions, filters, group, selectedWeekKey]);

  function handleDrop(event: DragEvent<HTMLDivElement>, day: string, start: string) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/session-id") || draggedId;
    const session = data.sessions.find(item => item.id === id);
    if (!id || !session || !onMove) return;
    const duration = getDurationHours(session.start, session.end);
    onMove(id, { day, date: dates[day], recurring: false, start, end: addDuration(start, duration), conflict: undefined });
    setDraggedId(null);
    onSelect?.(id);
  }

  function hasConflict(session: Session) {
    if (session.conflict) return true;
    return data.conflicts.some(conflict => {
      if (conflict.resolved || !conflict.module.includes(session.moduleCode)) return false;
      const scheduleDate = session.date || session.day;
      return conflict.time.includes(scheduleDate) || conflict.time.includes(session.day);
    });
  }

  return <div className="enterprise-card overflow-auto">
    <div className="min-w-[1040px] grid grid-cols-[90px_repeat(5,1fr)]">
      <div className="border-b border-slate-200 bg-slate-50 p-3 text-xs font-bold uppercase text-slate-500">Time</div>
      {teachingDays.map(day => <div key={day} className="border-b border-l border-slate-200 bg-slate-50 p-3"><p className="text-sm font-bold text-navy">{day}</p><p className="mt-0.5 text-xs text-slate-500">{formatDayDate(dates[day])}</p></div>)}
      {teachingTimes.map(time => <Fragment key={time}>
        <div className="border-b border-slate-200 p-3 text-xs font-semibold text-slate-500">{time}</div>
        {teachingDays.map(day => {
          const items = filtered.filter(session => session.day === day && session.start === time);
          return <div key={`${day}-${time}`} onDragOver={event => event.preventDefault()} onDrop={event => handleDrop(event, day, time)} className="min-h-36 border-b border-l border-slate-200 p-2 transition hover:bg-teal-50/30">
            <div className="space-y-2">{items.map(session => <SessionCard
              key={session.id}
              session={session}
              conflict={hasConflict(session)}
              selected={selectedId === session.id}
              movable={Boolean(onMove)}
              onSelect={() => onSelect?.(session.id)}
              onDragStart={event => {
                setDraggedId(session.id);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/session-id", session.id);
              }}
            />)}</div>
          </div>;
        })}
      </Fragment>)}
    </div>
  </div>;
}

function SessionCard({ session, conflict, selected, movable, onSelect, onDragStart }: {
  session: Session;
  conflict: boolean;
  selected: boolean;
  movable: boolean;
  onSelect: () => void;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
}) {
  const className = conflict
    ? "rounded-2xl border border-red-200 bg-red-50 p-3 shadow-sm"
    : selected
      ? "rounded-2xl border border-teal-500 bg-teal-50 p-3 shadow-sm ring-2 ring-teal-200"
      : "rounded-2xl border border-teal-200 bg-teal-50 p-3 shadow-sm";

  return <div draggable={movable} onDragStart={onDragStart} onClick={onSelect} className={`${className} ${movable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}>
    <div className="flex items-start justify-between gap-2">
      <div><p className="font-bold text-navy">{session.moduleCode}</p><p className="mt-1 text-sm font-medium text-slate-700">{session.moduleName}</p></div>
      <div className="flex items-center gap-1">{conflict && <StatusBadge value="Critical"/>}{movable && <GripVertical className="text-slate-400" size={16}/>}</div>
    </div>
    <p className="mt-2 text-xs text-slate-500">{session.start}–{session.end} · {session.lecturer}</p>
    <p className="text-xs text-slate-500">{session.room} · {session.campus}</p>
    <p className="mt-2 text-xs font-semibold text-teal-700">{session.group}</p>
    {session.date && <p className="mt-1 text-[11px] font-semibold text-slate-400">One-off session · {formatDayDate(session.date)}</p>}
  </div>;
}

function getDurationHours(start: string, end: string) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  return Math.max(0.5, minutes / 60);
}
