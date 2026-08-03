import { AppShell } from "@/components/app-shell";
import { ConflictTable } from "@/components/conflict-table";
import { AiWidget } from "@/components/ai-widget";

export default function ConflictsPage() {
  return <AppShell title="Conflict Alerts" subtitle="Detect clashes and apply recommended timetable fixes"><div className="grid gap-6 xl:grid-cols-[1fr_380px]"><div className="overflow-auto"><ConflictTable/></div><AiWidget/></div></AppShell>;
}
