"use client";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { useCampusData } from "@/components/data-context";
import { conflictTrendData, peakHoursData } from "@/data/mock";

export function RoomUsageChart() {
  const { data } = useCampusData();
  const chart = data.rooms.map(r => ({ name: r.room.split(" ")[0], usage: Math.min(100, Math.round((data.sessions.filter(s => s.room === r.room).length / 6) * 100)) }));
  return <ChartCard title="Room Usage"><ResponsiveContainer width="100%" height={240}><BarChart data={chart}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="usage" fill="#14B8A6" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></ChartCard>;
}
export function LecturerWorkloadChart() {
  const { data } = useCampusData();
  const chart = data.lecturers.map(l => ({ name: l.name.split(" ").slice(-1)[0], hours: data.sessions.filter(s => s.lecturer === l.name).length * 2 || l.weeklyHours }));
  return <ChartCard title="Lecturer Workload"><ResponsiveContainer width="100%" height={240}><BarChart data={chart}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="hours" fill="#0F172A" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></ChartCard>;
}
export function ConflictTrendChart() {
  const { data } = useCampusData();
  const chart = [...conflictTrendData.slice(0,3), { week: "Live", conflicts: data.conflicts.filter(c=>!c.resolved).length }];
  return <ChartCard title="Conflict Trends"><ResponsiveContainer width="100%" height={240}><LineChart data={chart}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="week"/><YAxis/><Tooltip/><Line type="monotone" dataKey="conflicts" stroke="#14B8A6" strokeWidth={3}/></LineChart></ResponsiveContainer></ChartCard>;
}
export function PeakHoursChart() { return <ChartCard title="Peak Teaching Hours"><ResponsiveContainer width="100%" height={240}><BarChart data={peakHoursData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="hour"/><YAxis/><Tooltip/><Bar dataKey="sessions" fill="#F59E0B" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></ChartCard>; }
export function CampusUsageChart() {
  const { data } = useCampusData();
  const campuses = Array.from(new Set(data.rooms.map(r=>r.campus)));
  const chart = campuses.map(c => ({ name: c.replace(" Campus", ""), value: data.sessions.filter(s=>s.campus === c).length || 1 }));
  return <ChartCard title="Campus Usage"><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={chart} dataKey="value" nameKey="name" outerRadius={85} label>{chart.map((_,i)=><Cell key={i} fill={["#0F172A","#14B8A6","#64748B", "#F59E0B"][i % 4]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></ChartCard>;
}
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) { return <div className="enterprise-card p-5"><h3 className="mb-4 font-semibold text-navy">{title}</h3>{children}</div>; }
