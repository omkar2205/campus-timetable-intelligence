import { AppShell } from "@/components/app-shell";
import { RoomTable } from "@/components/room-table";

export default function RoomsPage() {
  return <AppShell title="Room Booking" subtitle="Search room availability, create bookings and review utilisation"><RoomTable/></AppShell>;
}
