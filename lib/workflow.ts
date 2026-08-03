import type { AppData, Module } from "@/types";
import type { ActivityTemplate, TemplateValidationItem } from "@/types/workflow";

export function createTemplatesFromData(data: AppData): ActivityTemplate[] {
  return data.modules.map((module, index) => createTemplate(module, data, index));
}

export function validateTemplate(template: ActivityTemplate): TemplateValidationItem[] {
  const durationInQuarterHours = template.durationHours * 4;
  return [
    {
      label: "Module linked",
      passed: Boolean(template.moduleCode && template.moduleName),
      message: "A module must be linked to the activity template."
    },
    {
      label: "Student group assigned",
      passed: Boolean(template.studentGroup),
      message: "Select the student set or cohort attending the activity."
    },
    {
      label: "Activity description",
      passed: Boolean(template.name && template.activityType),
      message: "A clear description and activity type are required for timetable display."
    },
    {
      label: "Planned size",
      passed: template.plannedSize > 0,
      message: "Enter the expected number of students for room-capacity checks."
    },
    {
      label: "Duration",
      passed: template.durationHours > 0 && Number.isInteger(durationInQuarterHours),
      message: "Duration must be entered in 15-minute increments."
    },
    {
      label: "Teaching pattern",
      passed: template.weeklySessions > 0 && template.teachingWeeks.length > 0,
      message: "Select the number of weekly sessions and the teaching weeks."
    },
    {
      label: "Tutor suitability",
      passed: Boolean(template.lecturerSuitability),
      message: "Choose the tutor team or suitability required to deliver this activity."
    },
    {
      label: "Room suitability",
      passed: Boolean(template.roomSuitability),
      message: "Choose the type of room suitable for this activity."
    }
  ];
}

export function templateStatus(template: ActivityTemplate): ActivityTemplate["status"] {
  return validateTemplate(template).every(item => item.passed) ? "Ready" : "Blocked";
}

export function readinessSummary(data: AppData, templates: ActivityTemplate[]) {
  const blockedTemplates = templates.filter(template => templateStatus(template) === "Blocked").length;
  const openConflicts = data.conflicts.filter(conflict => !conflict.resolved).length;
  const checks = [
    { label: "Activity templates validated", passed: blockedTemplates === 0, detail: blockedTemplates ? `${blockedTemplates} template${blockedTemplates === 1 ? "" : "s"} require attention` : `${templates.length} templates ready` },
    { label: "Scheduled activities available", passed: data.sessions.length > 0, detail: `${data.sessions.length} scheduled sessions` },
    { label: "No unresolved timetable conflicts", passed: openConflicts === 0, detail: openConflicts ? `${openConflicts} conflict${openConflicts === 1 ? "" : "s"} require review` : "No open conflicts" },
    { label: "Rooms and lecturers loaded", passed: data.rooms.length > 0 && data.lecturers.length > 0, detail: `${data.rooms.length} rooms and ${data.lecturers.length} lecturers` },
    { label: "Student groups linked", passed: data.studentGroups.length > 0 && templates.every(template => Boolean(template.studentGroup)), detail: `${data.studentGroups.length} student groups` }
  ];
  return {
    checks,
    ready: checks.every(check => check.passed),
    blockedTemplates,
    openConflicts
  };
}

export function parseWeekPattern(value: string): number[] {
  const result = new Set<number>();
  value.split(",").map(item => item.trim()).filter(Boolean).forEach(item => {
    const range = item.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/);
    if (range) {
      const start = Math.max(1, Number(range[1]));
      const end = Math.min(52, Number(range[2]));
      for (let week = Math.min(start, end); week <= Math.max(start, end); week += 1) result.add(week);
      return;
    }
    const week = Number(item);
    if (week >= 1 && week <= 52) result.add(week);
  });
  return Array.from(result).sort((a, b) => a - b);
}

export function formatWeekPattern(weeks: number[]) {
  if (!weeks.length) return "None selected";
  const sorted = Array.from(new Set(weeks)).sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let previous = sorted[0];
  for (let index = 1; index <= sorted.length; index += 1) {
    const current = sorted[index];
    if (current === previous + 1) {
      previous = current;
      continue;
    }
    parts.push(start === previous ? String(start) : `${start}-${previous}`);
    start = current;
    previous = current;
  }
  return parts.join(", ");
}

function createTemplate(module: Module, data: AppData, index: number): ActivityTemplate {
  const requirement = data.requirements.find(item => item.moduleCode === module.code);
  const group = data.studentGroups.find(item => item.name === (module.studentGroup || requirement?.studentGroup))
    || data.studentGroups.find(item => item.course === module.course);
  const lecturer = data.lecturers.find(item => item.id === module.lecturerId || item.name === module.lecturerName || item.modules.includes(module.code));
  const activityType = activityTypeFromRoom(module.roomTypeRequired || requirement?.requiredRoomType || "Teaching room");
  const template: ActivityTemplate = {
    id: `AT-${module.id || String(index + 1).padStart(3, "0")}`,
    name: `${group?.campus || "Campus"} – ${module.course} – ${module.name} ${activityType}`,
    campus: group?.campus || lecturer?.preferredCampus || "Main Campus",
    programme: module.course,
    moduleCode: module.code,
    moduleName: module.name,
    activityType,
    plannedSize: group?.studentCount || 0,
    durationHours: module.hoursPerSession || 2,
    weeklySessions: module.weeklySessions || 1,
    teachingWeeks: Array.from({ length: 12 }, (_, week) => week + 1),
    studentGroup: group?.name || module.studentGroup || requirement?.studentGroup || "",
    lecturerSuitability: lecturer ? `TR-${slug(module.course)}-${slug(module.name)}` : "",
    roomSuitability: `RM-${activityType}`,
    preferredDays: requirement?.preferredDays || "",
    preferredTime: requirement?.preferredTime || "",
    publicationRule: "Standard",
    status: "Draft",
    updatedAt: new Date().toISOString()
  };
  return { ...template, status: templateStatus(template) };
}

function activityTypeFromRoom(value: string) {
  const text = value.toLowerCase();
  if (text.includes("moot") || text.includes("advoc")) return "Advocacy";
  if (text.includes("large") || text.includes("lecture")) return "Large Group";
  if (text.includes("oral")) return "Oral Skills";
  if (text.includes("meeting")) return "Meeting";
  return "Workshop";
}

function slug(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
}
