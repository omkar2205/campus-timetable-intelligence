"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, Download, Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { useCampusData } from "@/components/data-context";
import { addDuration, isoDate } from "@/lib/calendar";
import { downloadCsv, roomReportRows } from "@/lib/export";
import type { Room, Session } from "@/types";

export function RoomTable() {
  const { data, addManualSession } = useCampusData();
  const [query, setQuery] = useState("");
  const [campus, setCampus] = useState("");
  const [type, setType] = useState("");
  const [minimumCapacity, setMinimumCapacity] = useState("");
  const [bookedRoom, setBookedRoom] = useState<Room | null>(null);
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState({ moduleCode: "", group: "", lecturer: "", date: isoDate(new Date()), start: "09:00", duration: "2" });

  const campuses = unique(data.rooms.map(room => room.campus));
  const types = unique(data.rooms.map(room => room.type));
  const list = useMemo(() => data.rooms.filter(room => {
    const text = `${room.room} ${room.building} ${room.campus} ${room.type}`.toLowerCase();
    if (query && !text.includes(query.toLowerCase())) return false;
    if (campus && room.campus !== campus) return false;
    if (type && room.type !== type) return false;
    if (minimumCapacity && room.capacity < Number(minimumCapacity)) return false;
    return true;
  }), [data.rooms, query, campus, type, minimumCapacity]);

  function openBooking(room: Room) {
    setBookedRoom(room);
    setMessage("");
    setBooking(current => ({ ...current, moduleCode: current.moduleCode || data.modules[0]?.code || "", group: current.group || data.studentGroups[0]?.name || "", lecturer: current.lecturer || data.lecturers[0]?.name || "" }));
  }

  function confirmBooking() {
    if (!bookedRoom) return;
    const date = new Date(`${booking.date}T12:00:00`);
    const day = date.toLocaleDateString("en-GB", { weekday: "long" });
    if (["Saturday", "Sunday"].includes(day)) {
      setMessage("Select a weekday for this teaching booking.");
      return;
    }

    const module = data.modules.find(item => item.code === booking.moduleCode) || data.modules[0];
    const group = data.studentGroups.find(item => item.name === booking.group) || data.studentGroups[0];
    const session: Session = {
      id: `room-booking-${Date.now()}`,
      day,
      date: booking.date,
      recurring: false,
      start: booking.start,
      end: addDuration(booking.start, Number(booking.duration || 2)),
      moduleCode: module?.code || "BOOKING",
      moduleName: module?.name || "Room booking",
      lecturer: booking.lecturer || module?.lecturerName || "Unassigned",
      room: bookedRoom.room,
      campus: bookedRoom.campus,
      group: group?.name || "Unassigned",
      course: module?.course || group?.course || "General",
      capacity: bookedRoom.capacity,
      enrolled: group?.studentCount || 0,
      status: "Scheduled"
    };
    addManualSession(session);
    setBookedRoom(null);
  }

  return <div className="enterprise-card p-5">
    <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="relative xl:w-80"><Search className="absolute left-3 top-2.5 text-slate-400" size={17}/><input className="input w-full pl-9" placeholder="Search room, building or campus" value={query} onChange={event => setQuery(event.target.value)}/></div>
      <div className="flex flex-wrap gap-2">
        <select className="input" value={minimumCapacity} onChange={event => setMinimumCapacity(event.target.value)}><option value="">Any capacity</option><option value="25">25+</option><option value="50">50+</option><option value="75">75+</option><option value="100">100+</option></select>
        <select className="input" value={campus} onChange={event => setCampus(event.target.value)}><option value="">All campuses</option>{campuses.map(item => <option key={item}>{item}</option>)}</select>
        <select className="input" value={type} onChange={event => setType(event.target.value)}><option value="">All room types</option>{types.map(item => <option key={item}>{item}</option>)}</select>
        <button onClick={() => downloadCsv("room-utilisation.csv", roomReportRows(data))} className="btn-secondary"><Download size={16}/>Export</button>
      </div>
    </div>

    <div className="mb-4 flex items-center justify-between text-sm text-slate-500"><span>{list.length} rooms found</span><span>{data.sessions.length} sessions currently scheduled</span></div>
    <div className="overflow-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500"><th className="p-3">Room</th><th>Building</th><th>Campus</th><th>Type</th><th>Capacity</th><th>Sessions</th><th>Status</th><th></th></tr></thead><tbody>{list.map(room => {
      const sessionCount = data.sessions.filter(session => session.room === room.room && session.status !== "Cancelled").length;
      return <tr key={room.id || room.room} className="border-b last:border-0"><td className="p-3 font-semibold text-navy">{room.room}</td><td>{room.building}</td><td>{room.campus}</td><td>{room.type}</td><td>{room.capacity}</td><td>{sessionCount}</td><td><StatusBadge value={room.status}/></td><td><button disabled={room.status === "Maintenance"} onClick={() => openBooking(room)} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"><CalendarPlus size={15}/>Book</button></td></tr>;
    })}</tbody></table></div>
    {!list.length && <p className="py-10 text-center text-sm text-slate-500">No rooms match the selected filters.</p>}

    {bookedRoom && <div className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-executive">
        <h3 className="text-xl font-bold text-navy">Book {bookedRoom.room}</h3>
        <p className="mt-1 text-sm text-slate-500">{bookedRoom.campus} · {bookedRoom.type} · capacity {bookedRoom.capacity}</p>
        {message && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</div>}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select className="input" value={booking.moduleCode} onChange={event => {
            const module = data.modules.find(item => item.code === event.target.value);
            setBooking(current => ({ ...current, moduleCode: event.target.value, lecturer: module?.lecturerName || current.lecturer, group: module?.studentGroup || current.group }));
          }}><option value="">Select module</option>{data.modules.map(module => <option key={module.code} value={module.code}>{module.code} · {module.name}</option>)}</select>
          <select className="input" value={booking.group} onChange={event => setBooking(current => ({ ...current, group: event.target.value }))}><option value="">Select student group</option>{data.studentGroups.map(group => <option key={group.name}>{group.name}</option>)}</select>
          <select className="input" value={booking.lecturer} onChange={event => setBooking(current => ({ ...current, lecturer: event.target.value }))}><option value="">Select lecturer</option>{data.lecturers.map(lecturer => <option key={lecturer.name}>{lecturer.name}</option>)}</select>
          <input className="input" type="date" value={booking.date} onChange={event => setBooking(current => ({ ...current, date: event.target.value }))}/>
          <input className="input" type="time" value={booking.start} onChange={event => setBooking(current => ({ ...current, start: event.target.value }))}/>
          <select className="input" value={booking.duration} onChange={event => setBooking(current => ({ ...current, duration: event.target.value }))}><option value="1">1 hour</option><option value="1.5">1.5 hours</option><option value="2">2 hours</option><option value="2.5">2.5 hours</option><option value="3">3 hours</option></select>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button onClick={() => setBookedRoom(null)} className="btn-secondary">Cancel</button><button onClick={confirmBooking} className="btn-primary">Confirm booking</button></div>
      </div>
    </div>}
  </div>;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}
