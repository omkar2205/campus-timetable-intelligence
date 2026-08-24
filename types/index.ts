export type Room = {
  id?: string;
  room: string;
  building: string;
  campus: string;
  type: string;
  capacity: number;
  status: "Available" | "Occupied" | "Maintenance" | string;
};

export type Lecturer = {
  id?: string;
  name: string;
  department: string;
  modules: string[];
  weeklyHours: number;
  availability: string;
  workload: "Normal" | "High" | "Overloaded" | string;
  preferredCampus?: string;
  primaryCampus?: string;
  additionalCampuses?: string[];
  maxWeeklyHours?: number;
};

export type StudentGroup = {
  id?: string;
  name: string;
  course: string;
  studentCount: number;
  campus: string;
};

export type Programme = {
  id: string;
  code: string;
  name: string;
  campus: string;
  academicYear: string;
  status: "Active" | "Inactive" | string;
};

export type Student = {
  id: string;
  name: string;
  email?: string;
  campus: string;
  programmeId: string;
  programme: string;
  cohort?: string;
  moduleCodes: string[];
  status: "Active" | "Inactive" | string;
};

export type Module = {
  id?: string;
  code: string;
  name: string;
  course: string;
  campus?: string;
  programmeId?: string;
  lecturerId?: string;
  lecturerName?: string;
  weeklySessions?: number;
  hoursPerSession?: number;
  roomTypeRequired?: string;
  studentGroup?: string;
};

export type Session = {
  id: string;
  day: string;
  date?: string;
  recurring?: boolean;
  start: string;
  end: string;
  moduleCode: string;
  moduleName: string;
  lecturer: string;
  room: string;
  campus: string;
  group: string;
  course: string;
  capacity: number;
  enrolled: number;
  studentIds?: string[];
  conflict?: string;
  status?: "Scheduled" | "Cancelled" | "Draft" | string;
};

export type Conflict = {
  id?: string;
  severity: string;
  type: string;
  module: string;
  lecturer: string;
  room: string;
  time: string;
  description: string;
  fix: string;
  resolved?: boolean;
};

export type SchedulingRequirement = {
  moduleCode: string;
  studentGroup: string;
  preferredDays: string;
  preferredTime: string;
  requiredRoomType: string;
  avoidDays: string;
};

export type AppData = {
  rooms: Room[];
  lecturers: Lecturer[];
  studentGroups: StudentGroup[];
  students?: Student[];
  programmes?: Programme[];
  modules: Module[];
  sessions: Session[];
  conflicts: Conflict[];
  requirements: SchedulingRequirement[];
  generatedAt?: string;
};
