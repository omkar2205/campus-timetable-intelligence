"use client";
import { Sparkles, Wand2 } from "lucide-react";
import { useCampusData } from "@/components/data-context";

export function AiWidget() {
  const { data, generateSchedule } = useCampusData();
  const active = data.conflicts.filter(c => !c.resolved);
  const suggestions = active.length ? active.slice(0,5).map(c => c.fix) : [
    "No active conflicts detected in the current timetable.",
    "Room utilisation can be improved by clustering modules by campus.",
    "Optimised timetable scenario is ready for review.",
    "Import latest room and cohort data before final publication.",
    "Export the generated timetable for academic team review."
  ];
  return <div className="enterprise-card overflow-hidden"><div className="bg-gradient-to-br from-navy to-slateBrand p-5 text-white"><div className="flex items-center gap-2"><Sparkles className="text-teal-300"/><h3 className="font-semibold">AI Scheduling Assistant</h3></div><p className="mt-2 text-sm text-slate-300">Mock intelligent recommendations based on timetable, capacity, and workload signals.</p></div><div className="space-y-3 p-5">{suggestions.map((s, i) => <div key={s+i} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><span className="mr-2 font-bold text-teal-600">0{i+1}</span>{s}</div>)}<button onClick={generateSchedule} className="btn-primary w-full"><Wand2 size={16}/>Generate Optimised Timetable</button></div></div>;
}
