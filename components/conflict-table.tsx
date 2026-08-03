"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Download, Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { useCampusData } from "@/components/data-context";
import { conflictReportRows, downloadCsv } from "@/lib/export";

export function ConflictTable() {
  const { data, resolveConflict } = useCampusData();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"open" | "resolved" | "all">("open");
  const filtered = useMemo(() => data.conflicts.filter(conflict => {
    if (status === "open" && conflict.resolved) return false;
    if (status === "resolved" && !conflict.resolved) return false;
    const text = [conflict.type, conflict.module, conflict.lecturer, conflict.room, conflict.time, conflict.description, conflict.fix].join(" ").toLowerCase();
    return text.includes(query.toLowerCase());
  }), [data.conflicts, query, status]);

  return <div className="enterprise-card overflow-hidden">
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative lg:w-80"><Search className="absolute left-3 top-2.5 text-slate-400" size={17}/><input className="input w-full pl-9" placeholder="Search conflicts" value={query} onChange={event => setQuery(event.target.value)}/></div>
      <div className="flex flex-wrap gap-2"><select className="input" value={status} onChange={event => setStatus(event.target.value as typeof status)}><option value="open">Open conflicts</option><option value="resolved">Resolved conflicts</option><option value="all">All conflicts</option></select><button onClick={() => downloadCsv("conflict-register.csv", conflictReportRows(data))} className="btn-secondary"><Download size={16}/>Export</button></div>
    </div>

    {filtered.length ? <div className="overflow-auto"><table className="w-full min-w-[1040px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500"><th className="p-4">Severity</th><th>Type</th><th>Module</th><th>Lecturer</th><th>Room</th><th>Time</th><th>Suggested action</th><th></th></tr></thead><tbody>{filtered.map((conflict, index) => <tr key={conflict.id || `${conflict.module}-${conflict.time}-${index}`} className="border-b align-top last:border-0"><td className="p-4"><StatusBadge value={conflict.resolved ? "Low" : conflict.severity}/></td><td className="font-semibold text-navy">{conflict.type}<p className="mt-1 max-w-xs text-xs font-normal text-slate-500">{conflict.description}</p></td><td>{conflict.module}</td><td>{conflict.lecturer}</td><td>{conflict.room}</td><td>{conflict.time}</td><td className="max-w-xs text-slate-600">{conflict.fix}</td><td><button disabled={Boolean(conflict.resolved)} onClick={() => resolveConflict(conflict.id)} className={conflict.resolved ? "btn-secondary opacity-70" : "btn-primary"}>{conflict.resolved ? <><CheckCircle2 size={16}/>Resolved</> : "Mark resolved"}</button></td></tr>)}</tbody></table></div> : <div className="p-10 text-center"><CheckCircle2 className="mx-auto text-emerald-500" size={32}/><h3 className="mt-3 font-semibold text-navy">No conflicts found</h3><p className="mt-1 text-sm text-slate-500">The conflict engine will add issues here when real room, lecturer, student-group or capacity clashes are detected.</p></div>}
  </div>;
}
