import { AppShell } from "@/components/app-shell";
import { CampusUsageChart, ConflictTrendChart, LecturerWorkloadChart, PeakHoursChart, RoomUsageChart } from "@/components/charts";

export default function AnalyticsPage() {
  return <AppShell title="Analytics" subtitle="Executive scheduling intelligence and utilisation trends"><div className="grid gap-6 xl:grid-cols-2"><RoomUsageChart/><LecturerWorkloadChart/><PeakHoursChart/><ConflictTrendChart/><CampusUsageChart/><div className="enterprise-card p-5"><h3 className="mb-4 font-semibold text-navy">Module Completion %</h3><div className="space-y-4">{[["BUS401",72],["INT502",64],["CS301",81],["DA501",58]].map(([m,v])=><div key={m as string}><div className="mb-1 flex justify-between text-sm"><span className="font-semibold text-navy">{m}</span><span>{v}%</span></div><div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-tealBrand" style={{width:`${v}%`}}/></div></div>)}</div></div></div></AppShell>;
}
