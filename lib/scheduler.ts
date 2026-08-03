import { AppData, Conflict, Lecturer, Session } from "@/types";

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

function lecturerAvailable(lecturer: Lecturer | undefined, day: string, start: string, end: string) {
  if (!lecturer?.availability) return true;
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
    return session.room === candidate.room || session.lecturer === candidate.lecturer || session.group === candidate.group;
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
      || input.studentGroups.find(item => item.course === module.course);
    const requiredType = requirement?.requiredRoomType || module.roomTypeRequired || "Lecture Hall";
    const avoidedDays = parseDays(requirement?.avoidDays);
    const requestedDays = preferredDays(requirement?.preferredDays).filter(day => !avoidedDays.includes(day));
    const candidateDays = [...requestedDays, ...teachingDays.filter(day => !requestedDays.includes(day) && !avoidedDays.includes(day))];
    const candidateSlots = preferredSlots(requirement?.preferredTime);
    const repeats = Math.max(1, Number(module.weeklySessions || 1));
    const duration = Math.max(0.5, Number(module.hoursPerSession || 2));

    for (let repeat = 0; repeat < repeats; repeat += 1) {
      const typeMatched = input.rooms.filter(room => room.status !== "Maintenance" && roomTypeMatches(room.type, requiredType));
      const availableRooms = (typeMatched.length ? typeMatched : input.rooms.filter(room => room.status !== "Maintenance"))
        .sort((a, b) => {
          const campusA = group && a.campus === group.campus ? 0 : 1;
          const campusB = group && b.campus === group.campus ? 0 : 1;
          if (campusA !== campusB) return campusA - campusB;
          const capacityA = a.capacity >= (group?.studentCount || 0) ? 0 : 1;
          const capacityB = b.capacity >= (group?.studentCount || 0) ? 0 : 1;
          if (capacityA !== capacityB) return capacityA - capacityB;
          return Math.abs(a.capacity - (group?.studentCount || 0)) - Math.abs(b.capacity - (group?.studentCount || 0));
        });

      let placed: Session | null = null;

      for (const day of candidateDays) {
        for (const start of candidateSlots) {
          const end = addHours(start, duration);
          if (!lecturerAvailable(lecturer, day, start, end)) continue;

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
              campus: room.campus,
              group: group?.name || module.studentGroup || "Unassigned group",
              course: module.course,
              capacity: room.capacity,
              enrolled: group?.studentCount || 0,
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
          room: "No room assigned",
          time: "No available slot",
          description: "No clash-free room and time could be found using the current constraints.",
          fix: "Review lecturer availability, room capacity, room type or preferred teaching times."
        });
      }
    }
  }

  const generated = { ...input, sessions, conflicts, generatedAt: new Date().toISOString() };
  return { ...generated, conflicts: detectConflicts(generated) };
}

export function detectConflicts(data: AppData): Conflict[] {
  const conflicts: Conflict[] = data.conflicts.filter(conflict => conflict.type === "Unscheduled session");
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
        fix: "Move the session to a larger suitable room or split the student group."
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
          description: "Two sessions overlap in the same room.",
          fix: "Move one session to another available room or time."
        });
      }

      if (first.lecturer === second.lecturer) {
        conflicts.push({
          id: `lecturer-${first.id}-${second.id}`,
          severity: "Critical",
          type: "Lecturer double booking",
          module: `${first.moduleCode} / ${second.moduleCode}`,
          lecturer: first.lecturer,
          room: `${first.room} / ${second.room}`,
          time: overlapLabel(first, second),
          description: "The same lecturer is assigned to overlapping sessions.",
          fix: "Move one session to another teaching block or assign another lecturer."
        });
      }

      if (first.group === second.group) {
        conflicts.push({
          id: `group-${first.id}-${second.id}`,
          severity: "High",
          type: "Student group clash",
          module: `${first.moduleCode} / ${second.moduleCode}`,
          lecturer: `${first.lecturer} / ${second.lecturer}`,
          room: `${first.room} / ${second.room}`,
          time: overlapLabel(first, second),
          description: "The same student group is assigned to overlapping sessions.",
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
