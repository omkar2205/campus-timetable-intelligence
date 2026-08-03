"use client";

import { AppShell } from "@/components/app-shell";
import { useCampusData } from "@/components/data-context";
import { useWorkflow } from "@/components/workflow-context";
import { conflictReportRows, downloadCsv, downloadJson, lecturerReportRows, roomReportRows, timetableRows } from "@/lib/export";
import { formatWeekPattern } from "@/lib/workflow";
import { AlertTriangle, BookOpen, Building2, CalendarClock, CalendarDays, ClipboardList, Database, Download, GraduationCap, UserRoundCog } from "lucide-react";

export default function ReportsPage() {
  const { data } = useCampusData();
  const { templates, exceptions, publication } = useWorkflow();

  const reports = [
    {
      title: "Complete timetable",
      description: "All scheduled sessions with module, lecturer, room, campus, cohort and capacity details.",
      icon: CalendarDays,
      count: data.sessions.length,
      action: () => downloadCsv("complete-timetable.csv", timetableRows(data.sessions))
    },
    {
      title: "Activity templates",
      description: "Guide-aligned teaching requirements, teaching weeks, planned sizes and resource suitabilities.",
      icon: ClipboardList,
      count: templates.length,
      action: () => downloadCsv("activity-templates.csv", templates.map(template => ({
        TemplateID: template.id,
        TemplateName: template.name,
        Campus: template.campus,
        Programme: template.programme,
        ModuleCode: template.moduleCode,
        ModuleName: template.moduleName,
        ActivityType: template.activityType,
        PlannedSize: template.plannedSize,
        DurationHours: template.durationHours,
        WeeklySessions: template.weeklySessions,
        TeachingWeeks: formatWeekPattern(template.teachingWeeks),
        StudentGroup: template.studentGroup,
        LecturerSuitability: template.lecturerSuitability,
        RoomSuitability: template.roomSuitability,
        PreferredDays: template.preferredDays,
        PreferredTime: template.preferredTime,
        PublicationRule: template.publicationRule,
        Status: template.status
      })))
    },
    {
      title: "Availability exceptions",
      description: "Date-specific lecturer, room and student-group availability adjustments.",
      icon: CalendarClock,
      count: exceptions.length,
      action: () => downloadCsv("availability-exceptions.csv", exceptions.map(exception => ({
        ExceptionID: exception.id,
        ResourceType: exception.resourceType,
        ResourceID: exception.resourceId,
        ResourceName: exception.resourceName,
        StartDate: exception.startDate,
        EndDate: exception.endDate,
        StartTime: exception.startTime,
        EndTime: exception.endTime,
        AvailabilityType: exception.availabilityType,
        Reason: exception.reason,
        Notes: exception.notes,
        CreatedAt: exception.createdAt
      })))
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
      description: "Cohort, programme, campus and student-count reference report.",
      icon: GraduationCap,
      count: data.studentGroups.length,
      action: () => downloadCsv("student-groups.csv", data.studentGroups.map(group => ({ GroupID: group.id || "", StudentGroup: group.name, Programme: group.course, StudentCount: group.studentCount, Campus: group.campus, ScheduledSessions: data.sessions.filter(session => session.group === group.name).length })))
    },
    {
      title: "Modules",
      description: "Module ownership, teaching demand, room requirements and assigned groups.",
      icon: BookOpen,
      count: data.modules.length,
      action: () => downloadCsv("modules.csv", data.modules.map(module => ({ ModuleID: module.id || "", ModuleCode: module.code, ModuleName: module.name, Programme: module.course, Lecturer: module.lecturerName || data.lecturers.find(lecturer => lecturer.id === module.lecturerId)?.name || "", StudentGroup: module.studentGroup || "", WeeklySessions: module.weeklySessions || 0, HoursPerSession: module.hoursPerSession || 0, RoomTypeRequired: module.roomTypeRequired || "" })))
    },
    {
      title: "Conflict register",
      description: "Open and resolved conflicts with descriptions and suggested corrective action.",
      icon: AlertTriangle,
      count: data.conflicts.length,
      action: () => downloadCsv("conflict-register.csv", conflictReportRows(data))
    }
  ];

  return <AppShell title="Reports" subtitle="Export planning, scheduling, utilisation and review data">
    <div className="mb-6 enterprise-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h3 className="font-bold text-navy">Current data snapshot</h3><p className="mt-1 text-sm text-slate-500">Exports use the current timetable, activity-planning and availability state, including changes made during pilot testing.</p></div><button onClick={() => downloadJson("campus-timetable-data.json", { timetable: data, activityTemplates: templates, availabilityExceptions: exceptions, publication })} className="btn-primary"><Database size={16}/>Export full data</button></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Metric label="Sessions" value={data.sessions.length}/><Metric label="Templates" value={templates.length}/><Metric label="Exceptions" value={exceptions.length}/><Metric label="Rooms" value={data.rooms.length}/><Metric label="Open conflicts" value={data.conflicts.filter(conflict => !conflict.resolved).length}/></div>
    </div>

    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{reports.map(report => {
      const Icon = report.icon;
      return <div key={report.title} className="enterprise-card flex flex-col p-5"><div className="flex items-start justify-between gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Icon size={20}/></div><span className="badge bg-slate-100 text-slate-600">{report.count} records</span></div><h3 className="mt-4 font-bold text-navy">{report.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{report.description}</p><button onClick={report.action} className="btn-secondary mt-5 w-full"><Download size={16}/>Download CSV</button></div>;
    })}</div>
  </AppShell>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-2xl font-bold text-navy">{value}</p></div>;
}
