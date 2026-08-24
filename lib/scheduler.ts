import { AppData, Conflict, Lecturer, Session } from "@/types";
import { staffCanTeachAtCampus } from "@/lib/master-data";

const dayMap: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday"
};

const teachingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const morningSlots = ["08:00", "09:00", "10:00", "11:00"];
const afternoonSlots = ["12:00", "13:00", "14:00", "15:00"];
const eveningSlots = ["16:00", "17:00", "18:00", "19:00"];
const allSlots = [...morningSlots, ...afternoonSlots, ...eveningSlots];

function addHours(start: string, hours = 2) {
  const [hour, minute] = start.split(":").map(Number);
  const totalMinutes = hour * 60 + minute + Math.round(hours * 60);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

function parseDays(value?: string) {
  if (!value) return [];
  const lower = value.toLowerCase();
  if (/mon\s*[-–]\s*fri/.test(lower)) return [...teachingDays];
  const parts = value.split(/[\/,;| ]+/).filter(Boolean);
  return Array.from(new Set(parts.map(part => dayMap[part.slice(0, 3).toLowerCase()] || part).filter(day => teachingDays.includes(day))));
}

function preferredDays(value?: string) {
  const parsed = parseDays(value);
  return parsed.length ? parsed : [...teachingDays];
}

function preferredSlots(value?: string) {
  const lower = (value || "").toLowerCase();
  if (lower.includes("morning")) return morningSlots;
  if (lower.includes("afternoon")) return afternoonSlots;
  if (lower.includes("evening")) return eveningSlots;
  return allSlots;
}

function normaliseRoomType(value?: string) {
  return (value || "").toLowerCase().replace(/room|classroom|teaching/g, "").replace(/[^a-z0-9]/g, "").trim();
}

function roomTypeMatches(roomType: string, requiredType: string) {
  const room = normaliseRoomType(roomType);
  const required = normaliseRoomType(requiredType);
  return !required || room.includes(required) || required.includes(room);
}

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function overlaps(startA: string, endA: string, startB: string, endB: string) {
  return minutes(startA) < minutes(endB) && minutes(startB) < minutes(endA);
}

function sameScheduleDate(a: Session, b: Session) {
  if (a.date && b.date) return a.date === b.date;
  if (a.date || b.date) return a.day === b.day;
  return a.day === b.day;
}

function lecturerAvailable(lecturer: Lecturer | undefined, campus: string, day: string, start: string, end: string) {
  if (!lecturer) return true;
  if (campus && !staffCanTeachAtCampus(lecturer, campus)) return false;
  if (!lecturer.availability) return true;
  const availability = lecturer.availability;
  const listedDays = parseDays(availability);
  if (listedDays.length && !listedDays.includes(day)) return false;

  const timeMatch = availability.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (!timeMatch) return true;
  return minutes(start) >= minutes(timeMatch[1]) && minutes(end) <= minutes(timeMatch[2]);
}

function isSlotFree(existing: Session[], candidate: Omit<Session, "id">) {
  return !existing.some(session => {
    if (!sameScheduleDate(session, candidate as Session)) return false;
    if (!overlaps(session.start, session.end, candidate.start, candidate.end)) return false;
    if (session.room === candidate.room || session.lecturer === candidate.lecturer || session.group === candidate.group) return true;
    const firstStudents = new Set(session.studentIds || []);
    return (candidate.studentIds || []).some(studentId => firstStudents.has(studentId));
  });
}

export function generateTimetable(input: AppData): AppData {
  const sessions: Session[] = [];
  const conflicts: Conflict[] = [];
  let counter = 1;

  for (const module of input.modules) {
    const requirement = input.requirements.find(item => item.moduleCode.toUpperCase() === module.code.toUpperCase());
    const lecturer = input.lecturers.find(item => item.id === module.lecturerId || item.name === module.lecturerName || item.modules.includes(module.code));
    const group = input.studentGroups.find(item => item.name === (module.studentGroup || requirement?.studentGroup))
      || input.studentGroups.find(item => item.course === module.course && (!module.campus || item.campus === module.campus));
    const targetCampus = module.campus || group?.campus || lecturer?.primaryCampus || lecturer?.preferredCampus || "Birmingham";
    const requiredType = requirement?.requiredRoomType || module.roomTypeRequired || "Lecture Hall";
    const avoidedDays = parseDays(requirement?.avoidDays);
    const requestedDays = preferredDays(requirement?.preferredDays).filter(day => !avoidedDays.includes(day));
    const candidateDays = [...requestedDays, ...teachingDays.filter(day => !requestedDays.includes(day) && !avoidedDays.includes(day))];
    const candidateSlots = preferredSlots(requirement?.preferredTime);
    const repeats = Math.max(1, Number(module.weeklySessions || 1));
    const duration = Math.max(0.5, Number(module.hoursPerSession || 2));
    const allocatedStudents = (input.students || [])
      .filter(student => student.campus === targetCampus && student.moduleCodes.includes(module.code))
      .map(student => student.id);

    if (lecturer && !staffCanTeachAtCampus(lecturer, targetCampus)) {
      conflicts.push({
        id: `campus-staff-${module.code}`,
        severity: "Critical",
        type: "Staff campus restriction",
        module: module.code,
        lecturer: lecturer.name,
        room: "No room assigned",
        time: targetCampus,
        description: `${lecturer.name} is not currently configured to teach at ${targetCampus}.`,
        fix: "Add the campus to the staff member's teaching campuses or assign another suitable staff member."
      });
      continue;
    }

    for (let repeat = 0; repeat < repeats; repeat += 1) {
      const campusRooms = input.rooms.filter(room => room.status !== "Maintenance" && room.campus === targetCampus);
      const typeMatched = campusRooms.filter(room => roomTypeMatches(room.type, requiredType));
      const availableRooms = (typeMatched.length ? typeMatched : campusRooms)
        .sort((a, b) => {
          const capacityA = a.capacity >= (group?.studentCount || allocatedStudents.length) ? 0 : 1;
          const capacityB = b.capacity >= (group?.studentCount || allocatedStudents.length) ? 0 : 1;
          if (capacityA !== capacityB) return capacityA - capacityB;
          return Math.abs(a.capacity - (group?.studentCount || allocatedStudents.length)) - Math.abs(b.capacity - (group?.studentCount || allocatedStudents.length));
        });

      let placed: Session | null = null;

      for (const day of candidateDays) {
        for (const start of candidateSlots) {
          const end = addHours(start, duration);
          if (!lecturerAvailable(lecturer, targetCampus, day, start, end)) continue;

          for (const room of availableRooms) {
            const candidate: Omit<Session, "id"> = {
              day,
              recurring: true,
              start,
              end,
              moduleCode: module.code,
              moduleName: module.name,
              lecturer: lecturer?.name || module.lecturerName || "Unassigned lecturer",
              room: room.room,
              campus: targetCampus,
              group: group?.name || module.studentGroup || module.course,
              course: module.course,
              capacity: room.capacity,
              enrolled: group?.studentCount || allocatedStudents.length,
              studentIds: allocatedStudents,
              status: "Scheduled"
            };

            if (isSlotFree(sessions, candidate)) {
              placed = { id: `gen-${counter++}`, ...candidate };
              if (placed.enrolled > placed.capacity) placed.conflict = "Capacity mismatch";
              if (!roomTypeMatches(room.type, requiredType)) placed.conflict = "Wrong room type";
              break;
            }
          }
          if (placed) break;
        }
        if (placed) break;
      }

      if (placed) {
        sessions.push(placed);
      } else {
        conflicts.push({
          id: `unplaced-${counter++}`,
          severity: "Critical",
          type: "Unscheduled session",
          module: module.code,
          lecturer: lecturer?.name || module.lecturerName || "Unassigned lecturer",
          room: `No suitable ${targetCampus} room assigned`,
          time: "No available slot",
          description: `No clash-free ${targetCampus} room and time could be found using the current campus, availability and suitability constraints.`,
          fix: "Review staff campus access, availability, room capacity, room type or preferred teaching times."
        });
      }
    }
  }

  const generated = { ...input, sessions, conflicts, generatedAt: new Date().toISOString() };
  return { ...generated, conflicts: detectConflicts(generated) };
}

export function detectConflicts(data: AppData): Conflict[] {
  const conflicts: Conflict[] = data.conflicts.filter(conflict => conflict.type === "Unscheduled session" || conflict.type === "Staff campus restriction");
  const activeSessions = data.sessions.filter(session => session.status !== "Cancelled");

  for (const session of activeSessions) {
    if (session.enrolled > session.capacity) {
      conflicts.push({
        id: `cap-${session.id}`,
        severity: "High",
        type: "Capacity mismatch",
        module: session.moduleCode,
        lecturer: session.lecturer,
        room: session.room,
        time: sessionLabel(session),
        description: `${session.enrolled} students are assigned to a room with capacity ${session.capacity}.`,
        fix: "Move the session to a larger suitable room or split the teaching allocation."
      });
    }

    const module = data.modules.find(item => item.code === session.moduleCode);
    if (module?.campus && module.campus !== session.campus) {
      conflicts.push({
        id: `module-campus-${session.id}`,
        severity: "Critical",
        type: "Module campus mismatch",
        module: session.moduleCode,
        lecturer: session.lecturer,
        room: session.room,
        time: sessionLabel(session),
        description: `${module.code} is maintained under ${module.campus}, but this session is scheduled at ${session.campus}.`,
        fix: `Move the session to ${module.campus} or use the campus-specific module record.`
      });
    }

    const lecturer = data.lecturers.find(item => item.name === session.lecturer);
    if (lecturer && !staffCanTeachAtCampus(lecturer, session.campus)) {
      conflicts.push({
        id: `staff-campus-${session.id}`,
        severity: "Critical",
        type: "Staff campus restriction",
        module: session.moduleCode,
        lecturer: session.lecturer,
        room: session.room,
        time: sessionLabel(session),
        description: `${session.lecturer} is not configured to teach at ${session.campus}.`,
        fix: "Update the staff member's additional campuses or assign another staff member."
      });
    }
  }

  for (let firstIndex = 0; firstIndex < activeSessions.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < activeSessions.length; secondIndex += 1) {
      const first = activeSessions[firstIndex];
      const second = activeSessions[secondIndex];
      if (!sameScheduleDate(first, second) || !overlaps(first.start, first.end, second.start, second.end)) continue;

      if (first.room === second.room) {
        conflicts.push({
          id: `room-${first.id}-${second.id}`,
          severity: "Critical",
          type: "Room double booking",
          module: `${first.moduleCode} / ${second.moduleCode}`,
          lecturer: `${first.lecturer} / ${second.lecturer}`,
          room: first.room,
          time: overlapLabel(first, second),
          description: "Two sessions overlap in the same location.",
          fix: "Move one session to another available location or time."
        });
      }

      if (first.lecturer === second.lecturer) {
        conflicts.push({
          id: `lecturer-${first.id}-${second.id}`,
          severity: "Critical",
          type: "Staff double booking",
          module: `${first.moduleCode} / ${second.moduleCode}`,
          lecturer: first.lecturer,
          room: `${first.room} / ${second.room}`,
          time: overlapLabel(first, second),
          description: "The same staff member is assigned to overlapping sessions.",
          fix: "Move one session to another teaching block or assign another staff member."
        });
      }

      const firstStudents = new Set(first.studentIds || []);
      const sharedStudents = (second.studentIds || []).filter(studentId => firstStudents.has(studentId));
      if (sharedStudents.length) {
        conflicts.push({
          id: `students-${first.id}-${second.id}`,
          severity: "High",
          type: "Individual student clash",
          module: `${first.moduleCode} / ${second.moduleCode}`,
          lecturer: `${first.lecturer} / ${second.lecturer}`,
          room: `${first.room} / ${second.room}`,
          time: overlapLabel(first, second),
          description: `${sharedStudents.length} individually allocated student${sharedStudents.length === 1 ? " is" : "s are"} assigned to overlapping sessions.`,
          fix: "Move one session or change the individual student allocation."
        });
      } else if (first.group && second.group && first.group === second.group) {
        conflicts.push({
          id: `group-${first.id}-${second.id}`,
          severity: "High",
          type: "Cohort clash",
          module: `${first.moduleCode} / ${second.moduleCode}`,
          lecturer: `${first.lecturer} / ${second.lecturer}`,
          room: `${first.room} / ${second.room}`,
          time: overlapLabel(first, second),
          description: "The same cohort is assigned to overlapping sessions.",
          fix: "Move one session to another available teaching block."
        });
      }
    }
  }

  return deduplicate(conflicts);
}

function sessionLabel(session: Session) {
  return `${session.date || session.day} ${session.start}–${session.end}`;
}

function overlapLabel(first: Session, second: Session) {
  return `${first.date || first.day} ${first.start}–${first.end} / ${second.start}–${second.end}`;
}

function deduplicate(conflicts: Conflict[]) {
  const map = new Map<string, Conflict>();
  conflicts.forEach(conflict => map.set(conflict.id || `${conflict.type}-${conflict.module}-${conflict.time}`, conflict));
  return Array.from(map.values());
}
