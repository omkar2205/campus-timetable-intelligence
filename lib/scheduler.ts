import { AppData, Conflict, Session } from "@/types";

const dayMap: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday" };
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const morningSlots = ["09:00", "11:00"];
const afternoonSlots = ["13:00", "14:00", "15:00", "16:30"];
const allSlots = ["09:00", "11:00", "13:00", "14:00", "15:00", "16:30"];

function addHours(start: string, hours = 2) {
  const [h, m] = start.split(":").map(Number);
  const endHour = h + hours;
  return `${String(endHour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function expandDays(value?: string) {
  if (!value) return days;
  const parts = value.split(/[\/,; ]+/).filter(Boolean);
  const expanded = parts.map(p => dayMap[p.slice(0,3)] || p).filter(d => days.includes(d));
  return expanded.length ? expanded : days;
}

function slotSet(preferredTime?: string) {
  const value = (preferredTime || "").toLowerCase();
  if (value.includes("morning")) return morningSlots;
  if (value.includes("afternoon")) return afternoonSlots;
  return allSlots;
}

export function generateTimetable(input: AppData): AppData {
  const sessions: Session[] = [];
  const conflicts: Conflict[] = [];
  const used = new Set<string>();
  let counter = 1;

  for (const mod of input.modules) {
    const requirement = input.requirements.find(r => r.moduleCode === mod.code || r.moduleCode === mod.code.toUpperCase());
    const lecturer = input.lecturers.find(l => l.id === mod.lecturerId || l.name === mod.lecturerName || l.modules.includes(mod.code));
    const group = input.studentGroups.find(g => g.name === (mod.studentGroup || requirement?.studentGroup) || g.course === mod.course);
    const requiredType = requirement?.requiredRoomType || mod.roomTypeRequired || "Lecture Hall";
    const preferredDays = expandDays(requirement?.preferredDays);
    const avoidDays = expandDays(requirement?.avoidDays || "").filter(d => d !== "Monday" || requirement?.avoidDays);
    const candidateDays = preferredDays.filter(d => !avoidDays.includes(d));
    const candidateSlots = slotSet(requirement?.preferredTime);
    const repeats = Math.max(1, Number(mod.weeklySessions || 1));

    for (let i = 0; i < repeats; i++) {
      const rooms = input.rooms
        .filter(r => r.status !== "Maintenance")
        .filter(r => r.type.toLowerCase().includes(requiredType.toLowerCase()) || requiredType.toLowerCase().includes(r.type.toLowerCase()))
        .sort((a, b) => Math.abs(a.capacity - (group?.studentCount || 0)) - Math.abs(b.capacity - (group?.studentCount || 0)));
      const suitableRooms = rooms.length ? rooms : input.rooms.filter(r => r.status !== "Maintenance");

      let placed: Session | null = null;
      for (const day of [...candidateDays, ...days]) {
        for (const start of candidateSlots) {
          for (const room of suitableRooms) {
            const keyRoom = `${day}-${start}-${room.room}`;
            const keyLecturer = `${day}-${start}-${lecturer?.name || mod.lecturerName || "Unassigned"}`;
            const keyGroup = `${day}-${start}-${group?.name || mod.studentGroup || "Unassigned"}`;
            if (!used.has(keyRoom) && !used.has(keyLecturer) && !used.has(keyGroup)) {
              placed = {
                id: `gen-${counter++}`,
                day,
                start,
                end: addHours(start, Number(mod.hoursPerSession || 2)),
                moduleCode: mod.code,
                moduleName: mod.name,
                lecturer: lecturer?.name || mod.lecturerName || "Unassigned lecturer",
                room: room.room,
                campus: room.campus,
                group: group?.name || mod.studentGroup || "Unassigned group",
                course: mod.course,
                capacity: room.capacity,
                enrolled: group?.studentCount || 0
              };
              if (placed.enrolled > placed.capacity) placed.conflict = "Capacity mismatch";
              if (!room.type.toLowerCase().includes(requiredType.toLowerCase()) && !requiredType.toLowerCase().includes(room.type.toLowerCase())) placed.conflict = "Wrong room type";
              used.add(keyRoom); used.add(keyLecturer); used.add(keyGroup);
              break;
            }
          }
          if (placed) break;
        }
        if (placed) break;
      }

      if (placed) {
        sessions.push(placed);
        if (placed.conflict) {
          conflicts.push({
            id: `conf-${counter}`,
            severity: placed.conflict === "Capacity mismatch" ? "High" : "Medium",
            type: placed.conflict,
            module: placed.moduleCode,
            lecturer: placed.lecturer,
            room: placed.room,
            time: `${placed.day} ${placed.start}`,
            description: placed.conflict === "Capacity mismatch" ? `${placed.enrolled} students require a larger room than ${placed.room}.` : `${placed.moduleCode} requires ${requiredType}.`,
            fix: placed.conflict === "Capacity mismatch" ? "Assign a larger available room or split the cohort." : `Assign a ${requiredType} room.`
          });
        }
      } else {
        conflicts.push({
          id: `unplaced-${counter++}`,
          severity: "Critical",
          type: "Unscheduled session",
          module: mod.code,
          lecturer: lecturer?.name || mod.lecturerName || "Unassigned lecturer",
          room: "No room found",
          time: "No available slot",
          description: "The scheduler could not find a clash-free time and room using the imported constraints.",
          fix: "Relax availability, add rooms, or reduce constraints and re-run optimisation."
        });
      }
    }
  }

  return { ...input, sessions, conflicts, generatedAt: new Date().toISOString() };
}

export function detectConflicts(data: AppData): Conflict[] {
  const conflicts: Conflict[] = [...data.conflicts.filter(c => c.type === "Unscheduled session")];
  const roomMap = new Map<string, Session[]>();
  const lecturerMap = new Map<string, Session[]>();
  const groupMap = new Map<string, Session[]>();
  for (const s of data.sessions) {
    const keys = [
      [roomMap, `${s.day}-${s.start}-${s.room}`],
      [lecturerMap, `${s.day}-${s.start}-${s.lecturer}`],
      [groupMap, `${s.day}-${s.start}-${s.group}`]
    ] as const;
    keys.forEach(([map, key]) => map.set(key, [...(map.get(key) || []), s]));
    if (s.enrolled > s.capacity) conflicts.push({ id: `cap-${s.id}`, severity: "High", type: "Capacity mismatch", module: s.moduleCode, lecturer: s.lecturer, room: s.room, time: `${s.day} ${s.start}`, description: `${s.enrolled} students are assigned to a room with capacity ${s.capacity}.`, fix: "Move to a larger room or split the cohort." });
  }
  roomMap.forEach(items => { if (items.length > 1) conflicts.push({ id: `room-${items[0].id}`, severity: "Critical", type: "Room double booking", module: items.map(i => i.moduleCode).join(" / "), lecturer: items.map(i => i.lecturer).join(" / "), room: items[0].room, time: `${items[0].day} ${items[0].start}`, description: "Multiple sessions are using the same room and time.", fix: "Move one session to another room or time." }); });
  lecturerMap.forEach(items => { if (items.length > 1) conflicts.push({ id: `lec-${items[0].id}`, severity: "Critical", type: "Lecturer double booking", module: items.map(i => i.moduleCode).join(" / "), lecturer: items[0].lecturer, room: items.map(i => i.room).join(" / "), time: `${items[0].day} ${items[0].start}`, description: "The same lecturer has overlapping sessions.", fix: "Move one class to a free teaching block." }); });
  groupMap.forEach(items => { if (items.length > 1) conflicts.push({ id: `grp-${items[0].id}`, severity: "High", type: "Student group clash", module: items.map(i => i.moduleCode).join(" / "), lecturer: items.map(i => i.lecturer).join(" / "), room: items.map(i => i.room).join(" / "), time: `${items[0].day} ${items[0].start}`, description: "The same cohort has two sessions at the same time.", fix: "Move one module to another slot." }); });
  return conflicts;
}
