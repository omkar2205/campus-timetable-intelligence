"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, Download, Plus, Search, X } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { useCampusData } from "@/components/data-context";
import { addDuration, isoDate } from "@/lib/calendar";
import { downloadCsv, roomReportRows } from "@/lib/export";
import { campusesFromData, staffCanTeachAtCampus } from "@/lib/master-data";
import type { Room, Session } from "@/types";

export function RoomTable() {
  const { data, addManualSession, addRoom } = useCampusData();
  const [query, setQuery] = useState("");
  const [campus, setCampus] = useState(campusesFromData(data)[0] || "Birmingham");
  const [type, setType] = useState("");
  const [minimumCapacity, setMinimumCapacity] = useState("");
  const [bookedRoom, setBookedRoom] = useState<Room | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState({ moduleCode: "", group: "", lecturer: "", date: isoDate(new Date()), start: "09:00", duration: "2" });

  const campuses = campusesFromData(data);
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
    const campusModules = data.modules.filter(module => module.campus === room.campus);
    const campusGroups = data.studentGroups.filter(group => group.campus === room.campus);
    const campusStaff = data.lecturers.filter(item => staffCanTeachAtCampus(item, room.campus));
    const module = campusModules[0];
    setBookedRoom(room);
    setMessage("");
    setBooking(current => ({
      ...current,
      moduleCode: module?.code || "",
      group: module?.studentGroup || campusGroups[0]?.name || "",
      lecturer: module?.lecturerName || campusStaff[0]?.name || ""
    }));
  }

  function confirmBooking() {
    if (!bookedRoom) return;
    const date = new Date(`${booking.date}T12:00:00`);
    const day = date.toLocaleDateString("en-GB", { weekday: "long" });
    if (["Saturday", "Sunday"].includes(day)) {
      setMessage("Select a weekday for this teaching booking.");
      return;
    }

    const module = data.modules.find(item => item.code === booking.moduleCode);
    const group = data.studentGroups.find(item => item.name === booking.group);
    if (module?.campus && module.campus !== bookedRoom.campus) {
      setMessage(`This module belongs to ${module.campus}. Select a ${bookedRoom.campus} module.`);
      return;
    }
    const lecturer = data.lecturers.find(item => item.name === booking.lecturer);
    if (lecturer && !staffCanTeachAtCampus(lecturer, bookedRoom.campus)) {
      setMessage(`${lecturer.name} is not configured to teach at ${bookedRoom.campus}.`);
      return;
    }
    const studentIds = (data.students || []).filter(student => student.campus === bookedRoom.campus && student.moduleCodes.includes(module?.code || "")).map(student => student.id);
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
      group: group?.name || module?.studentGroup || module?.course || "Individual allocation",
      course: module?.course || group?.course || "General",
      capacity: bookedRoom.capacity,
      enrolled: group?.studentCount || studentIds.length,
      studentIds,
      status: "Scheduled"
    };
    addManualSession(session);
    setBookedRoom(null);
  }

  return <div className="enterprise-card p-5">
    <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="relative xl:w-80"><Search className="absolute left-3 top-2.5 text-slate-400" size={17}/><input className="input w-full pl-9" placeholder="Search location or building" value={query} onChange={event => setQuery(event.target.value)}/></div>
      <div className="flex flex-wrap gap-2">
        <select className="input" value={campus} onChange={event => setCampus(event.target.value)}>{campuses.map(item => <option key={item}>{item}</option>)}</select>
        <select className="input" value={minimumCapacity} onChange={event => setMinimumCapacity(event.target.value)}><option value="">Any capacity</option><option value="25">25+</option><option value="50">50+</option><option value="75">75+</option><option value="100">100+</option></select>
        <select className="input" value={type} onChange={event => setType(event.target.value)}><option value="">All location types</option>{types.map(item => <option key={item}>{item}</option>)}</select>
        <button onClick={() => downloadCsv("location-utilisation.csv", roomReportRows(data))} className="btn-secondary"><Download size={16}/>Export</button>
        <button onClick={() => setCreateOpen(true)} className="btn-primary"><Plus size={16}/>Create Location</button>
      </div>
    </div>

    <div className="mb-4 flex items-center justify-between text-sm text-slate-500"><span>{list.length} locations at {campus}</span><span>{data.sessions.filter(session => session.campus === campus).length} sessions currently scheduled</span></div>
    <div className="overflow-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500"><th className="p-3">Location</th><th>Building</th><th>Campus</th><th>Type</th><th>Capacity</th><th>Sessions</th><th>Status</th><th></th></tr></thead><tbody>{list.map(room => {
      const sessionCount = data.sessions.filter(session => session.room === room.room && session.campus === room.campus && session.status !== "Cancelled").length;
      return <tr key={room.id || `${room.campus}-${room.room}`} className="border-b last:border-0"><td className="p-3 font-semibold text-navy">{room.room}</td><td>{room.building}</td><td>{room.campus}</td><td>{room.type}</td><td>{room.capacity}</td><td>{sessionCount}</td><td><StatusBadge value={room.status}/></td><td><button disabled={room.status === "Maintenance"} onClick={() => openBooking(room)} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"><CalendarPlus size={15}/>Book</button></td></tr>;
    })}</tbody></table></div>
    {!list.length && <p className="py-10 text-center text-sm text-slate-500">No locations match the selected campus and filters.</p>}

    {bookedRoom && <div className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4"><div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-executive"><div className="flex items-start justify-between"><div><h3 className="text-xl font-bold text-navy">Book {bookedRoom.room}</h3><p className="mt-1 text-sm text-slate-500">{bookedRoom.campus} · {bookedRoom.type} · capacity {bookedRoom.capacity}</p></div><button onClick={() => setBookedRoom(null)} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><X size={18}/></button></div>{message && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</div>}<div className="mt-4 grid gap-3 md:grid-cols-2"><select className="input" value={booking.moduleCode} onChange={event => { const module = data.modules.find(item => item.code === event.target.value); setBooking(current => ({ ...current, moduleCode: event.target.value, lecturer: module?.lecturerName || current.lecturer, group: module?.studentGroup || current.group })); }}><option value="">Select module</option>{data.modules.filter(module => module.campus === bookedRoom.campus).map(module => <option key={module.code} value={module.code}>{module.code} · {module.name}</option>)}</select><select className="input" value={booking.group} onChange={event => setBooking(current => ({ ...current, group: event.target.value }))}><option value="">Individual allocation</option>{data.studentGroups.filter(group => group.campus === bookedRoom.campus).map(group => <option key={group.name}>{group.name}</option>)}</select><select className="input" value={booking.lecturer} onChange={event => setBooking(current => ({ ...current, lecturer: event.target.value }))}><option value="">Select staff member</option>{data.lecturers.filter(item => staffCanTeachAtCampus(item, bookedRoom.campus)).map(lecturer => <option key={lecturer.id || lecturer.name}>{lecturer.name}</option>)}</select><input className="input" type="date" value={booking.date} onChange={event => setBooking(current => ({ ...current, date: event.target.value }))}/><input className="input" type="time" value={booking.start} onChange={event => setBooking(current => ({ ...current, start: event.target.value }))}/><select className="input" value={booking.duration} onChange={event => setBooking(current => ({ ...current, duration: event.target.value }))}><option value="1">1 hour</option><option value="1.5">1.5 hours</option><option value="2">2 hours</option><option value="2.5">2.5 hours</option><option value="3">3 hours</option></select></div><div className="mt-5 flex justify-end gap-2"><button onClick={() => setBookedRoom(null)} className="btn-secondary">Cancel</button><button onClick={confirmBooking} className="btn-primary">Confirm booking</button></div></div></div>}

    {createOpen && <CreateLocation campus={campus} campuses={campuses} onClose={() => setCreateOpen(false)} onCreate={room => { addRoom(room); setCampus(room.campus); setCreateOpen(false); }}/>} 
  </div>;
}

function CreateLocation({ campus, campuses, onClose, onCreate }: { campus: string; campuses: string[]; onClose: () => void; onCreate: (room: Room) => void }) {
  const [form, setForm] = useState({ room: "", building: "", campus, type: "Workshop room", capacity: "30", status: "Available" });
  function submit() { if (!form.room.trim() || !form.building.trim()) return; onCreate({ id: `R-${Date.now()}`, room: form.room.trim(), building: form.building.trim(), campus: form.campus, type: form.type.trim() || "Teaching room", capacity: Number(form.capacity || 0), status: form.status }); }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4"><div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-executive"><div className="flex items-start justify-between"><div><h3 className="text-xl font-bold text-navy">Create Location</h3><p className="mt-1 text-sm text-slate-500">Locations are maintained separately under their campus.</p></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><X size={18}/></button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Location name"><input className="input w-full" value={form.room} onChange={event => setForm({ ...form, room: event.target.value })}/></Field><Field label="Building"><input className="input w-full" value={form.building} onChange={event => setForm({ ...form, building: event.target.value })}/></Field><Field label="Campus"><select className="input w-full" value={form.campus} onChange={event => setForm({ ...form, campus: event.target.value })}>{campuses.map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Location type"><input className="input w-full" value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}/></Field><Field label="Capacity"><input className="input w-full" type="number" min="1" value={form.capacity} onChange={event => setForm({ ...form, capacity: event.target.value })}/></Field><Field label="Status"><select className="input w-full" value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}><option>Available</option><option>Maintenance</option><option>Occupied</option></select></Field></div><div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit} disabled={!form.room.trim() || !form.building.trim()}>Create location</button></div></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>; }
function unique(values: string[]) { return Array.from(new Set(values.filter(Boolean))).sort(); }
