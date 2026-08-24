import { AppShell } from "@/components/app-shell";
import { RoomTable } from "@/components/room-table";

export default function RoomsPage() {
  return <AppShell title="Locations" subtitle="Maintain campus locations, review availability and create room bookings"><RoomTable/></AppShell>;
}
