import { AppShell } from "@/components/app-shell";
import { Bell, Building2, Moon, ShieldCheck, UserRoundCog } from "lucide-react";

export default function SettingsPage() {
  const items = [
    { icon: Building2, title: "Institution Profile", text: "Campuses, buildings, academic calendar and room inventory." },
    { icon: UserRoundCog, title: "Roles & Permissions", text: "Admin, lecturer and student demo access controls." },
    { icon: Bell, title: "Notification Rules", text: "Conflict alerts, booking updates and weekly schedule digest." },
    { icon: Moon, title: "Appearance", text: "Dark mode toggle placeholder and enterprise theme settings." },
    { icon: ShieldCheck, title: "Audit & Compliance", text: "Mock audit trail for timetable changes and approvals." }
  ];
  return <AppShell title="Settings" subtitle="Demo configuration centre"><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map(({icon:Icon,title,text})=><div key={title} className="enterprise-card p-6"><div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Icon size={20}/></div><h3 className="font-bold text-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p><button className="btn-secondary mt-5">Configure</button></div>)}</div></AppShell>;
}
