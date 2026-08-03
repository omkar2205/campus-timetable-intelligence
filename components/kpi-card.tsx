import { ArrowUpRight } from "lucide-react";

export function KpiCard({ label, value, change }: { label: string; value: string; change: string }) {
  const positive = !change.startsWith("-");
  return <div className="enterprise-card p-5"><div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><span className={positive ? "badge bg-emerald-50 text-emerald-700" : "badge bg-red-50 text-red-700"}>{change}</span></div><div className="mt-4 flex items-end justify-between"><h3 className="text-3xl font-bold text-navy">{value}</h3><div className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-teal-700"><ArrowUpRight size={18}/></div></div></div>;
}
