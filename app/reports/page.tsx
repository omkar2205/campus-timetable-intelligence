"use client";

import { AppShell } from "@/components/app-shell";
import { useCampusData } from "@/components/data-context";
import { conflictReportRows, downloadCsv, downloadJson, lecturerReportRows, roomReportRows, timetableRows } from "@/lib/export";
import { AlertTriangle, BookOpen, Building2, CalendarDays, Database, Download, GraduationCap, UserRoundCog } from "lucide-react";

export default function ReportsPage() {
  const { data } = useCampusData();

  const reports = [
    {
      title: "Complete timetable",
      description: "All scheduled sessions with module, lecturer, room, campus, cohort and capacity details.",
      icon: CalendarDays,
      count: data.sessions.length,
      action: () => downloadCsv("complete-timetable.csv", timetableRows(data.sessions))
    },
    {
      title: "Room utilisation",
      description: "Room inventory, capacity, status, scheduled sessions and assigned student volumes.",
      icon: Building2,
      count: data.rooms.length,
      action: () => downloadCsv("room-utilisation.csv", roomReportRows(data))
    },
    {
      title: "Lecturer workload",
      description: "Lecturer availability, scheduled hours, session counts and workload limits.",
      icon: UserRoundCog,
      count: data.lecturers.length,
      action: () => downloadCsv("lecturer-workload.csv", lecturerReportRows(data))
    },
    {
      title: "Student groups",
      description: "Cohort, course, campus and student-count reference report.",
      icon: GraduationCap,
      count: data.studentGroups.length,
      action: () => downloadCsv("student-groups.csv", data.studentGroups.map(group => ({
        GroupID: group.id || "",
        StudentGroup: group.name,
        Course: group.course,
        StudentCount: group.studentCount,
        Campus: group.campus,
        ScheduledSessions: data.sessions.filter(session => session.group === group.name).length
      })))
    },
    {
      title: "Modules",
      description: "Module ownership, teaching demand, room requirements and assigned groups.",
      icon: BookOpen,
      count: data.modules.length,
      action: () => downloadCsv("modules.csv", data.modules.map(module => ({
        ModuleID: module.id || "",
        ModuleCode: module.code,
        ModuleName: module.name,
        Course: module.course,
        Lecturer: module.lecturerName || data.lecturers.find(lecturer => lecturer.id === module.lecturerId)?.name || "",
        StudentGroup: module.studentGroup || "",
        WeeklySessions: module.weeklySessions || 0,
        HoursPerSession: module.hoursPerSession || 0,
        RoomTypeRequired: module.roomTypeRequired || ""
      })))
    },
    {
      title: "Conflict register",
      description: "Open and resolved conflicts with descriptions and suggested corrective action.",
      icon: AlertTriangle,
      count: data.conflicts.length,
      action: () => downloadCsv("conflict-register.csv", conflictReportRows(data))
    }
  ];

  return <AppShell title="Reports" subtitle="Export timetable, utilisation, workload and reference data">
    <div className="mb-6 enterprise-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-bold text-navy">Data snapshot</h3>
          <p className="mt-1 text-sm text-slate-500">Exports use the current shared timetable data and include changes made in the platform.</p>
        </div>
        <button onClick={() => downloadJson("campus-timetable-data.json", data)} className="btn-primary"><Database size={16}/>Export full data</button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Sessions" value={data.sessions.length}/>
        <Metric label="Rooms" value={data.rooms.length}/>
        <Metric label="Lecturers" value={data.lecturers.length}/>
        <Metric label="Open conflicts" value={data.conflicts.filter(conflict => !conflict.resolved).length}/>
      </div>
    </div>

    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {reports.map(report => {
        const Icon = report.icon;
        return <div key={report.title} className="enterprise-card flex flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Icon size={20}/></div>
            <span className="badge bg-slate-100 text-slate-600">{report.count} records</span>
          </div>
          <h3 className="mt-4 font-bold text-navy">{report.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{report.description}</p>
          <button onClick={report.action} className="btn-secondary mt-5 w-full"><Download size={16}/>Download CSV</button>
        </div>;
      })}
    </div>
  </AppShell>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-2xl font-bold text-navy">{value}</p></div>;
}
