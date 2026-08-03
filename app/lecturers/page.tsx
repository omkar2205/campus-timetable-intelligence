import { AppShell } from "@/components/app-shell";
import { LecturerCards } from "@/components/lecturer-cards";
import { TimetableGrid } from "@/components/timetable-grid";
import { LecturerWorkloadChart } from "@/components/charts";

export default function LecturersPage() {
  return <AppShell title="Lecturer Schedules" subtitle="Monitor availability, workload, and assigned teaching"><LecturerCards/><div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]"><TimetableGrid/><LecturerWorkloadChart/></div></AppShell>;
}
