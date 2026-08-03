"use client";
import { Fragment } from "react";
import { StatusBadge } from "@/components/status-badge";
import { useCampusData } from "@/components/data-context";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const times = ["09:00", "11:00", "13:00", "14:00", "15:00", "16:30"];

export function TimetableGrid({ group }: { group?: string }) {
  const { data } = useCampusData();
  const filtered = group ? data.sessions.filter(s => s.group === group) : data.sessions;
  return <div className="enterprise-card overflow-auto"><div className="min-w-[900px] grid grid-cols-[90px_repeat(5,1fr)]"><div className="border-b border-slate-200 bg-slate-50 p-3 text-xs font-bold uppercase text-slate-500">Time</div>{days.map(day=><div key={day} className="border-b border-l border-slate-200 bg-slate-50 p-3 text-sm font-bold text-navy">{day}</div>)}{times.map(time => <Fragment key={time}><div className="border-b border-slate-200 p-3 text-xs font-semibold text-slate-500">{time}</div>{days.map(day => { const items = filtered.filter(s => s.day===day && s.start===time); return <div key={day+time} className="min-h-32 border-b border-l border-slate-200 p-2"><div className="space-y-2">{items.map(item => <div key={item.id} className={item.conflict ? "rounded-2xl border border-red-200 bg-red-50 p-3" : "rounded-2xl border border-teal-200 bg-teal-50 p-3"}><div className="flex items-center justify-between gap-2"><p className="font-bold text-navy">{item.moduleCode}</p>{item.conflict && <StatusBadge value="Critical"/>}</div><p className="mt-1 text-sm font-medium text-slate-700">{item.moduleName}</p><p className="mt-2 text-xs text-slate-500">{item.lecturer}</p><p className="text-xs text-slate-500">{item.room}</p><p className="mt-2 text-xs font-semibold text-teal-700">{item.group}</p></div>)}</div></div>; })}</Fragment> )}</div></div>;
}
