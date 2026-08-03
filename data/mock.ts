import { AppData, Conflict, Lecturer, Module, Room, SchedulingRequirement, Session, StudentGroup } from "@/types";

export const courses = ["MBA", "MSc International Business", "BSc Computer Science", "MSc Data Analytics"];
export const campuses = ["Main Campus", "City Campus", "Business School"];

export const studentGroupsData: StudentGroup[] = [
  { id: "G001", name: "MBA-Jan-2026", course: "MBA", studentCount: 96, campus: "Business School" },
  { id: "G002", name: "MScIB-Sep-2026", course: "MSc International Business", studentCount: 52, campus: "Main Campus" },
  { id: "G003", name: "BScCS-Year3", course: "BSc Computer Science", studentCount: 58, campus: "City Campus" },
  { id: "G004", name: "MScDA-May-2026", course: "MSc Data Analytics", studentCount: 43, campus: "City Campus" }
];

export const studentGroups = studentGroupsData.map(g => g.name);

export const modulesData: Module[] = [
  { id: "M001", code: "BUS401", name: "Strategic Management", course: "MBA", lecturerId: "L001", lecturerName: "Dr. Ahmed Khan", weeklySessions: 2, hoursPerSession: 2, roomTypeRequired: "Lecture Hall", studentGroup: "MBA-Jan-2026" },
  { id: "M002", code: "INT502", name: "Global Business", course: "MSc International Business", lecturerId: "L003", lecturerName: "Prof. James Wilson", weeklySessions: 2, hoursPerSession: 2, roomTypeRequired: "Seminar Room", studentGroup: "MScIB-Sep-2026" },
  { id: "M003", code: "CS301", name: "Software Engineering", course: "BSc Computer Science", lecturerId: "L002", lecturerName: "Dr. Priya Sharma", weeklySessions: 3, hoursPerSession: 2, roomTypeRequired: "Computer Lab", studentGroup: "BScCS-Year3" },
  { id: "M004", code: "DA501", name: "Data Visualisation", course: "MSc Data Analytics", lecturerId: "L004", lecturerName: "Dr. Sarah Thomas", weeklySessions: 2, hoursPerSession: 2, roomTypeRequired: "Computer Lab", studentGroup: "MScDA-May-2026" },
  { id: "M005", code: "BUS515", name: "Leadership in Practice", course: "MBA", lecturerId: "L001", lecturerName: "Dr. Ahmed Khan", weeklySessions: 1, hoursPerSession: 2, roomTypeRequired: "Seminar Room", studentGroup: "MBA-Jan-2026" },
  { id: "M006", code: "INT610", name: "International Market Entry", course: "MSc International Business", lecturerId: "L003", lecturerName: "Prof. James Wilson", weeklySessions: 1, hoursPerSession: 2, roomTypeRequired: "Hybrid", studentGroup: "MScIB-Sep-2026" }
];

export const modules = modulesData.map(({ code, name, course }) => ({ code, name, course }));

export const lecturers: Lecturer[] = [
  { id: "L001", name: "Dr. Ahmed Khan", department: "Business School", modules: ["BUS401", "BUS515"], weeklyHours: 18, availability: "Mon-Fri 09:00-17:00", workload: "High", maxWeeklyHours: 18, preferredCampus: "Business School" },
  { id: "L002", name: "Dr. Priya Sharma", department: "Computing", modules: ["CS301", "DA501"], weeklyHours: 14, availability: "Mon-Thu 10:00-16:00", workload: "Normal", maxWeeklyHours: 20, preferredCampus: "City Campus" },
  { id: "L003", name: "Prof. James Wilson", department: "International Business", modules: ["INT502", "INT610"], weeklyHours: 21, availability: "Tue-Fri 09:00-15:00", workload: "Overloaded", maxWeeklyHours: 16, preferredCampus: "Main Campus" },
  { id: "L004", name: "Dr. Sarah Thomas", department: "Analytics", modules: ["DA501"], weeklyHours: 12, availability: "Mon, Wed, Thu", workload: "Normal", maxWeeklyHours: 18, preferredCampus: "City Campus" }
];

export const rooms: Room[] = [
  { id: "R001", room: "A101 Lecture Hall", building: "A Block", campus: "Main Campus", type: "Lecture Hall", capacity: 120, status: "Available" },
  { id: "R002", room: "B204 Seminar Room", building: "B Block", campus: "Business School", type: "Seminar Room", capacity: 45, status: "Occupied" },
  { id: "R003", room: "C305 Computer Lab", building: "C Block", campus: "City Campus", type: "Computer Lab", capacity: 60, status: "Available" },
  { id: "R004", room: "D110 Auditorium", building: "D Block", campus: "Main Campus", type: "Auditorium", capacity: 250, status: "Maintenance" },
  { id: "R005", room: "B310 Executive Suite", building: "B Block", campus: "Business School", type: "Hybrid", capacity: 80, status: "Available" }
];

export const sessions: Session[] = [
  { id: "s1", day: "Monday", start: "09:00", end: "10:30", moduleCode: "BUS401", moduleName: "Strategic Management", lecturer: "Dr. Ahmed Khan", room: "A101 Lecture Hall", campus: "Main Campus", group: "MBA-Jan-2026", course: "MBA", capacity: 120, enrolled: 96 },
  { id: "s2", day: "Monday", start: "11:00", end: "12:30", moduleCode: "CS301", moduleName: "Software Engineering", lecturer: "Dr. Priya Sharma", room: "C305 Computer Lab", campus: "City Campus", group: "BScCS-Year3", course: "BSc Computer Science", capacity: 60, enrolled: 58 },
  { id: "s3", day: "Tuesday", start: "11:00", end: "12:30", moduleCode: "INT502", moduleName: "Global Business", lecturer: "Prof. James Wilson", room: "B204 Seminar Room", campus: "Business School", group: "MScIB-Sep-2026", course: "MSc International Business", capacity: 45, enrolled: 52, conflict: "Capacity mismatch" },
  { id: "s4", day: "Tuesday", start: "11:00", end: "12:30", moduleCode: "BUS515", moduleName: "Leadership in Practice", lecturer: "Dr. Ahmed Khan", room: "B204 Seminar Room", campus: "Business School", group: "MBA-Jan-2026", course: "MBA", capacity: 45, enrolled: 39, conflict: "Room double booking" },
  { id: "s5", day: "Wednesday", start: "14:00", end: "15:30", moduleCode: "DA501", moduleName: "Data Visualisation", lecturer: "Dr. Sarah Thomas", room: "C305 Computer Lab", campus: "City Campus", group: "MScDA-May-2026", course: "MSc Data Analytics", capacity: 60, enrolled: 43 },
  { id: "s6", day: "Thursday", start: "15:00", end: "16:30", moduleCode: "INT610", moduleName: "International Market Entry", lecturer: "Prof. James Wilson", room: "B310 Executive Suite", campus: "Business School", group: "MScIB-Sep-2026", course: "MSc International Business", capacity: 80, enrolled: 52 }
];

export const conflicts: Conflict[] = [
  { id: "c1", severity: "Critical", type: "Room double booking", module: "BUS515", lecturer: "Dr. Ahmed Khan", room: "B204 Seminar Room", time: "Tuesday 11:00", description: "B204 is assigned to two sessions at the same time.", fix: "Move BUS515 to B310 Executive Suite." },
  { id: "c2", severity: "High", type: "Capacity mismatch", module: "INT502", lecturer: "Prof. James Wilson", room: "B204 Seminar Room", time: "Tuesday 11:00", description: "52 students enrolled but room capacity is 45.", fix: "Move INT502 to A101 Lecture Hall." },
  { id: "c3", severity: "Medium", type: "Lecturer double booking", module: "BUS401", lecturer: "Dr. Ahmed Khan", room: "A101 Lecture Hall", time: "Thursday 15:00", description: "Lecturer has preparation block overlapping with class.", fix: "Shift class to Thursday 16:30." },
  { id: "c4", severity: "Low", type: "Wrong room type", module: "DA501", lecturer: "Dr. Sarah Thomas", room: "B204 Seminar Room", time: "Wednesday 14:00", description: "Data Visualisation requires lab computers.", fix: "Assign C305 Computer Lab." }
];

export const requirements: SchedulingRequirement[] = [
  { moduleCode: "BUS401", studentGroup: "MBA-Jan-2026", preferredDays: "Mon/Wed", preferredTime: "Morning", requiredRoomType: "Lecture Hall", avoidDays: "Fri" },
  { moduleCode: "INT502", studentGroup: "MScIB-Sep-2026", preferredDays: "Tue/Thu", preferredTime: "Afternoon", requiredRoomType: "Seminar Room", avoidDays: "Mon" },
  { moduleCode: "CS301", studentGroup: "BScCS-Year3", preferredDays: "Mon/Wed/Fri", preferredTime: "Morning", requiredRoomType: "Computer Lab", avoidDays: "Tue" }
];

export const initialData: AppData = { rooms: [], lecturers: [], studentGroups: [], modules: [], sessions: [], conflicts: [], requirements: [] };

export const kpis = [
  { label: "Total Scheduled Classes", value: "146", change: "+12%" },
  { label: "Active Rooms", value: "42", change: "+4" },
  { label: "Lecturer Utilisation", value: "78%", change: "+6%" },
  { label: "Student Groups", value: "28", change: "+3" },
  { label: "Active Conflicts", value: "7", change: "-2" },
  { label: "Room Utilisation", value: "84%", change: "+18%" }
];

export const roomUsageData = [
  { name: "A101", usage: 84 }, { name: "B204", usage: 91 }, { name: "C305", usage: 76 }, { name: "D110", usage: 42 }, { name: "B310", usage: 68 }
];
export const lecturerWorkloadData = [
  { name: "Ahmed", hours: 18 }, { name: "Priya", hours: 14 }, { name: "James", hours: 21 }, { name: "Sarah", hours: 12 }
];
export const conflictTrendData = [
  { week: "W1", conflicts: 15 }, { week: "W2", conflicts: 12 }, { week: "W3", conflicts: 9 }, { week: "W4", conflicts: 7 }
];
export const peakHoursData = [
  { hour: "9 AM", sessions: 18 }, { hour: "11 AM", sessions: 29 }, { hour: "1 PM", sessions: 21 }, { hour: "3 PM", sessions: 26 }, { hour: "5 PM", sessions: 11 }
];

export const aiSuggestions = [
  "Move BUS401 to Room B204 to resolve capacity issue.",
  "Dr. Ahmed has overlapping sessions Tuesday 11:00.",
  "Room utilisation can improve by 18%.",
  "Optimised timetable available for MBA-Jan-2026.",
  "MBA-Jan has overlapping sessions in the Tuesday teaching block."
];
