import { AppShell } from "@/components/app-shell";
import { RoomTable } from "@/components/room-table";

export default function RoomsPage() {
  return <AppShell title="Room Booking" subtitle="Search availability and simulate room reservations"><RoomTable/></AppShell>;
}
