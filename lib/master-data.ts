import type { AppData, Lecturer, Module, Programme, Room, Student } from "@/types";

const programmeNames: Record<string, string> = {
  BPC: "Bar Practice Course",
  LLB: "Bachelor of Laws",
  LLM: "Master of Laws",
  PGDL: "Postgraduate Diploma in Law",
  SQE1: "Solicitors Qualifying Examination 1"
};

const pilotCapacityOverrides: Record<string, number> = {
  "BHM-109-LG": 60,
  "BHM-201-WS": 60,
  "BHM-202-WS": 60,
  "BHM-210-LG": 90,
  "BHM-230-IT": 60,
  "MAN-102-WS": 60,
  "MAN-110-LG": 80,
  "MAN-150-MC": 42
};

export function normaliseCampusData(input: AppData): AppData {
  const rooms = input.rooms.map(room => ({
    ...room,
    capacity: room.id && pilotCapacityOverrides[room.id] ? pilotCapacityOverrides[room.id] : room.capacity
  }));

  const modules = input.modules.map(module => ({
    ...module,
    campus: module.campus || campusFromModule(module, input),
    programmeId: module.programmeId || programmeId(module.campus || campusFromModule(module, input), module.course)
  }));

  const programmes = input.programmes?.length
    ? input.programmes
    : deriveProgrammes({ ...input, rooms, modules });

  const lecturers = input.lecturers.map(lecturer => normaliseLecturer(lecturer, modules));
  const students = input.students?.length
    ? input.students.map(student => ({ ...student, moduleCodes: student.moduleCodes || [] }))
    : derivePilotStudents({ ...input, rooms, modules, programmes });

  const sessions = input.sessions.map(session => {
    const module = modules.find(item => item.code === session.moduleCode);
    const targetCampus = module?.campus || session.campus;
    const currentRoom = rooms.find(room => room.room === session.room && room.campus === targetCampus);
    const suitableRoom = currentRoom || findSuitableCampusRoom(rooms, targetCampus, module?.roomTypeRequired, session.enrolled);
    const currentGroup = input.studentGroups.find(group => group.name === session.group && group.campus === targetCampus);
    const suitableGroup = currentGroup || input.studentGroups.find(group => group.campus === targetCampus && group.course === (module?.course || session.course));
    const allocated = session.studentIds?.length
      ? session.studentIds
      : students.filter(student => student.campus === targetCampus && student.moduleCodes.includes(session.moduleCode)).map(student => student.id);

    return {
      ...session,
      campus: targetCampus,
      room: suitableRoom?.room || session.room,
      capacity: suitableRoom?.capacity || session.capacity,
      group: suitableGroup?.name || session.group,
      enrolled: suitableGroup?.studentCount || session.enrolled,
      studentIds: allocated
    };
  });

  return { ...input, rooms, modules, lecturers, programmes, students, sessions };
}

export function campusFromModule(module: Module, data: AppData) {
  if (module.campus) return module.campus;
  if (module.code.toUpperCase().startsWith("BHM-")) return "Birmingham";
  if (module.code.toUpperCase().startsWith("MAN-")) return "Manchester";
  const group = data.studentGroups.find(item => item.name === module.studentGroup);
  if (group?.campus) return group.campus;
  const lecturer = data.lecturers.find(item => item.id === module.lecturerId || item.name === module.lecturerName);
  return lecturer?.primaryCampus || lecturer?.preferredCampus || "Birmingham";
}

export function programmeId(campus: string, programme: string) {
  const campusCode = campus.toLowerCase().startsWith("man") ? "MAN" : campus.toLowerCase().startsWith("bir") ? "BHM" : slug(campus).slice(0, 3).toUpperCase();
  return `${campusCode}-${slug(programme).toUpperCase()}`;
}

export function staffCanTeachAtCampus(lecturer: Lecturer, campus: string) {
  const primary = lecturer.primaryCampus || lecturer.preferredCampus || "";
  return primary === campus || (lecturer.additionalCampuses || []).includes(campus);
}

export function campusesFromData(data: AppData) {
  return Array.from(new Set([
    ...data.rooms.map(room => room.campus),
    ...data.studentGroups.map(group => group.campus),
    ...(data.programmes || []).map(programme => programme.campus),
    ...data.modules.map(module => module.campus || campusFromModule(module, data))
  ].filter(Boolean))).sort();
}

function findSuitableCampusRoom(rooms: Room[], campus: string, requiredType?: string, enrolled = 0) {
  const campusRooms = rooms.filter(room => room.campus === campus && room.status !== "Maintenance");
  const type = normaliseRoomType(requiredType);
  const typeMatches = campusRooms.filter(room => {
    const roomType = normaliseRoomType(room.type);
    return !type || roomType.includes(type) || type.includes(roomType);
  });
  const candidates = typeMatches.length ? typeMatches : campusRooms;
  return [...candidates].sort((a, b) => {
    const fitA = a.capacity >= enrolled ? 0 : 1;
    const fitB = b.capacity >= enrolled ? 0 : 1;
    return fitA - fitB || Math.abs(a.capacity - enrolled) - Math.abs(b.capacity - enrolled);
  })[0];
}

function normaliseLecturer(lecturer: Lecturer, modules: Module[]): Lecturer {
  const assignedCampuses = Array.from(new Set(modules
    .filter(module => module.lecturerId === lecturer.id || module.lecturerName === lecturer.name || lecturer.modules.includes(module.code))
    .map(module => module.campus)
    .filter(Boolean) as string[]));
  const primaryCampus = lecturer.primaryCampus || lecturer.preferredCampus || assignedCampuses[0] || "Birmingham";
  const additionalCampuses = lecturer.additionalCampuses?.length
    ? Array.from(new Set(lecturer.additionalCampuses.filter(campus => campus !== primaryCampus)))
    : assignedCampuses.filter(campus => campus !== primaryCampus);
  return { ...lecturer, primaryCampus, preferredCampus: lecturer.preferredCampus || primaryCampus, additionalCampuses };
}

function deriveProgrammes(data: AppData): Programme[] {
  const keys = new Map<string, Programme>();
  const add = (campus: string, course: string) => {
    if (!campus || !course) return;
    const id = programmeId(campus, course);
    if (!keys.has(id)) keys.set(id, {
      id,
      code: course,
      name: programmeNames[course] || course,
      campus,
      academicYear: "2026/27",
      status: "Active"
    });
  };
  data.studentGroups.forEach(group => add(group.campus, group.course));
  data.modules.forEach(module => add(module.campus || campusFromModule(module, data), module.course));
  return Array.from(keys.values()).sort((a, b) => `${a.campus}-${a.code}`.localeCompare(`${b.campus}-${b.code}`));
}

function derivePilotStudents(data: AppData): Student[] {
  const students: Student[] = [];
  let counter = 1;
  data.studentGroups.forEach(group => {
    const groupModules = data.modules.filter(module => module.studentGroup === group.name || (module.course === group.course && module.campus === group.campus));
    const programme = data.programmes?.find(item => item.campus === group.campus && item.code === group.course);
    const sampleSize = Math.min(5, Math.max(1, group.studentCount));
    for (let index = 0; index < sampleSize; index += 1) {
      const id = `STU-${group.campus === "Manchester" ? "MAN" : "BHM"}-${String(counter).padStart(3, "0")}`;
      students.push({
        id,
        name: `Student ${String(counter).padStart(3, "0")}`,
        email: `student${String(counter).padStart(3, "0")}@example.edu`,
        campus: group.campus,
        programmeId: programme?.id || programmeId(group.campus, group.course),
        programme: group.course,
        cohort: group.name,
        moduleCodes: groupModules.map(module => module.code),
        status: "Active"
      });
      counter += 1;
    }
  });
  return students;
}

function normaliseRoomType(value?: string) {
  return String(value || "").toLowerCase().replace(/room|classroom|teaching/g, "").replace(/[^a-z0-9]/g, "").trim();
}

function slug(value: string) {
  return String(value || "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
}
