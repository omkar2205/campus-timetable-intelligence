"use client";
import { Bell, Moon, Search, Sparkles } from "lucide-react";
import { useState } from "react";

export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-soft/85 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between gap-4 px-6 lg:px-8">
        <div><h2 className="text-2xl font-bold tracking-tight text-navy">{title}</h2><p className="text-sm text-slate-500">{subtitle}</p></div>
        <div className="hidden flex-1 justify-center md:flex"><div className="relative w-full max-w-md"><Search className="absolute left-3 top-2.5 text-slate-400" size={18}/><input className="input w-full pl-10" placeholder="Search modules, rooms, lecturers..." /></div></div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary hidden sm:inline-flex"><Sparkles size={16}/>Optimise</button>
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white"><Moon size={17}/></button>
          <button onClick={() => setOpen(!open)} className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white"><Bell size={17}/><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"/></button>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-sm font-bold text-white">OR</div>
        </div>
      </div>
      {open && <div className="absolute right-8 top-16 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-executive"><p className="font-semibold">Notifications</p><p className="mt-2 text-sm text-slate-600">B204 double booking detected. AI recommends moving BUS515 to B310.</p></div>}
    </header>
  );
}
