import type { AppData, Session } from "@/types";

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [headers.join(","), ...rows.map(row => headers.map(header => escape(row[header])).join(","))].join("\n");
  downloadBlob(filename, csv, "text/csv;charset=utf-8");
}

export function downloadJson(filename: string, value: unknown) {
  downloadBlob(filename, JSON.stringify(value, null, 2), "application/json;charset=utf-8");
}

export function timetableRows(sessions: Session[], weekDates?: Record<string, string>) {
  return sessions.map(session => ({
    Date: session.date || weekDates?.[session.day] || "Recurring",
    Day: session.day,
    Start: session.start,
    End: session.end,
    Module: session.moduleCode,
    ModuleName: session.moduleName,
    Course: session.course,
    Lecturer: session.lecturer,
    Room: session.room,
    Campus: session.campus,
    StudentGroup: session.group,
    Enrolled: session.enrolled,
    Capacity: session.capacity,
    Status: session.status || "Scheduled",
    Conflict: session.conflict || ""
  }));
}

export function roomReportRows(data: AppData) {
  return data.rooms.map(room => {
    const sessions = data.sessions.filter(session => session.room === room.room);
    return {
      Room: room.room,
      Building: room.building,
      Campus: room.campus,
      Type: room.type,
      Capacity: room.capacity,
      Status: room.status,
      ScheduledSessions: sessions.length,
      AssignedStudents: sessions.reduce((total, session) => total + session.enrolled, 0)
    };
  });
}

export function lecturerReportRows(data: AppData) {
  return data.lecturers.map(lecturer => {
    const sessions = data.sessions.filter(session => session.lecturer === lecturer.name);
    const hours = sessions.reduce((total, session) => total + durationHours(session.start, session.end), 0);
    return {
      Lecturer: lecturer.name,
      Department: lecturer.department,
      Availability: lecturer.availability,
      PreferredCampus: lecturer.preferredCampus || "",
      ScheduledSessions: sessions.length,
      ScheduledHours: hours,
      MaximumWeeklyHours: lecturer.maxWeeklyHours || 18,
      WorkloadStatus: hours > (lecturer.maxWeeklyHours || 18) ? "Overloaded" : "Within limit"
    };
  });
}

export function conflictReportRows(data: AppData) {
  return data.conflicts.map(conflict => ({
    Severity: conflict.severity,
    Type: conflict.type,
    Module: conflict.module,
    Lecturer: conflict.lecturer,
    Room: conflict.room,
    Time: conflict.time,
    Description: conflict.description,
    SuggestedFix: conflict.fix,
    Status: conflict.resolved ? "Resolved" : "Open"
  }));
}

function durationHours(start: string, end: string) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return Math.max(0, (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60);
}

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
