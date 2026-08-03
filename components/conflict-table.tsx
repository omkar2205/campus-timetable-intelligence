"use client";
import { StatusBadge } from "@/components/status-badge";
import { CheckCircle2 } from "lucide-react";
import { useCampusData } from "@/components/data-context";

export function ConflictTable() {
  const { data, resolveConflict } = useCampusData();
  return <div className="enterprise-card overflow-hidden"><table className="w-full min-w-[960px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500"><th className="p-4">Severity</th><th>Type</th><th>Module</th><th>Lecturer</th><th>Room</th><th>Time</th><th>Suggested Fix</th><th></th></tr></thead><tbody>{data.conflicts.map((c, index) => <tr key={c.id || c.module+c.time+index} className="border-b align-top last:border-0"><td className="p-4"><StatusBadge value={c.resolved ? "Low" : c.severity}/></td><td className="font-semibold text-navy">{c.type}<p className="mt-1 max-w-xs text-xs font-normal text-slate-500">{c.description}</p></td><td>{c.module}</td><td>{c.lecturer}</td><td>{c.room}</td><td>{c.time}</td><td className="max-w-xs text-slate-600">{c.fix}</td><td><button onClick={()=>resolveConflict(c.id)} className={c.resolved ? "btn-secondary" : "btn-primary"}>{c.resolved ? <><CheckCircle2 size={16}/>Resolved</> : "Resolve"}</button></td></tr>)}</tbody></table></div>;
}
