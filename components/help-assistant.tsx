"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, ChevronDown, Loader2, Send, Sparkles, X } from "lucide-react";
import { useCampusData } from "@/components/data-context";
import { useWorkflow } from "@/components/workflow-context";
import { askGemini } from "@/lib/backend";

type Message = { role: "assistant" | "user"; text: string };

const starterQuestions = [
  "How does campus segregation work?",
  "How do I create staff?",
  "How do I allocate individual students?",
  "How do I create an activity template?"
];

export function HelpAssistant() {
  const { data, backendConfig, backendStatus } = useCampusData();
  const { templates, publication } = useWorkflow();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hello. I can explain campus master data, staff, students, locations, activity planning, availability, scheduling, conflicts, publication and reports." }
  ]);

  const summary = useMemo(() => ({
    sessions: data.sessions.length,
    locations: data.rooms.length,
    staff: data.lecturers.length,
    students: (data.students || []).length,
    programmes: (data.programmes || []).length,
    conflicts: data.conflicts.filter(conflict => !conflict.resolved).length,
    templates: templates.length,
    blockedTemplates: templates.filter(template => template.status === "Blocked").length,
    publicationStatus: publication.status
  }), [data, publication.status, templates]);

  async function submit(event?: FormEvent, suggestedQuestion?: string) {
    event?.preventDefault();
    const text = (suggestedQuestion || question).trim();
    if (!text || loading) return;
    setMessages(current => [...current, { role: "user", text }]);
    setQuestion("");
    setLoading(true);
    try {
      const local = localHelpAnswer(text, summary);
      if (local) {
        setMessages(current => [...current, { role: "assistant", text: local }]);
        return;
      }
      const remoteAnswer = await askGemini(backendConfig, text, data);
      setMessages(current => [...current, { role: "assistant", text: remoteAnswer || "I could not find a specific answer. Use Programmes & Modules for campus master data, Staff, Students and Locations for records, Activity Planning before scheduling, and Suggestions for feedback." }]);
    } catch (error) {
      console.error(error);
      setMessages(current => [...current, { role: "assistant", text: "The online assistant is unavailable at the moment. Built-in guidance is still available for campus segregation, staff, students, locations, activity templates, availability, timetable movement, publication and reports." }]);
    } finally {
      setLoading(false);
    }
  }

  return <>
    <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-40 inline-flex h-14 items-center gap-2 rounded-2xl bg-navy px-5 font-semibold text-white shadow-executive transition hover:-translate-y-0.5" aria-label="Open help assistant"><Sparkles size={19}/>Help</button>
    {open && <div className="fixed inset-0 z-50 flex items-end justify-end bg-navy/20 p-4 sm:p-6"><div className="flex h-[min(720px,90vh)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-executive"><div className="bg-gradient-to-br from-navy to-slateBrand p-5 text-white"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10"><Bot size={21}/></div><div><h3 className="font-bold">Timetable Assistant</h3><p className="text-xs text-slate-300">{backendStatus === "Connected" ? "Connected" : "Built-in guidance"}</p></div></div><button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-white/10"><X size={18}/></button></div></div><div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={message.role === "user" ? "ml-10 rounded-2xl rounded-br-md bg-navy p-3 text-sm leading-6 text-white" : "mr-8 rounded-2xl rounded-bl-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700"}>{message.text}</div>)}{loading && <div className="mr-8 flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white p-3 text-sm text-slate-500"><Loader2 className="animate-spin" size={16}/>Checking the timetable information…</div>}</div><div className="border-t border-slate-200 bg-white p-4"><div className="mb-3 flex gap-2 overflow-x-auto pb-1">{starterQuestions.map(item => <button key={item} onClick={() => void submit(undefined, item)} className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">{item}</button>)}</div><form onSubmit={event => void submit(event)} className="flex gap-2"><input value={question} onChange={event => setQuestion(event.target.value)} className="input flex-1" placeholder="Ask how the platform works"/><button disabled={!question.trim() || loading} className="btn-primary w-11 px-0 disabled:opacity-50" aria-label="Send question"><Send size={17}/></button></form><button onClick={() => setOpen(false)} className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-semibold text-slate-400"><ChevronDown size={14}/>Minimise</button></div></div></div>}
  </>;
}

function localHelpAnswer(question: string, summary: { sessions: number; locations: number; staff: number; students: number; programmes: number; conflicts: number; templates: number; blockedTemplates: number; publicationStatus: string }) {
  const text = question.toLowerCase();
  if (/campus|segregat/.test(text)) return "Programmes, modules, students, locations and activity templates belong to one campus. Staff have one primary campus and can also be enabled for additional campuses. Use the campus selector on each master-data page to work within the required campus.";
  if (/create.*staff|add.*staff|new.*staff/.test(text)) return "Open Staff, select the campus, then choose Create Staff. Set the primary campus and tick any additional campuses where the person can teach.";
  if (/student|allocate/.test(text) && /individual|module|create/.test(text)) return `The platform currently contains ${summary.students} individual student records. Open Students to create a record and allocate modules individually. Activity Templates can then select specific students rather than relying only on a cohort.`;
  if (/programme|module/.test(text) && /create|separate|campus/.test(text)) return `Open Programmes & Modules. Each campus keeps separate Programme of Study and module records, even when the same programme or module is delivered elsewhere. There are currently ${summary.programmes} programme records.`;
  if (/activity template|teaching requirement|pre.?schedul/.test(text)) return `Activity Templates describe teaching before sessions are scheduled. Open Activity Planning, select the campus, then create or edit a template with programme, module, individual students, duration, teaching weeks, staff suitability and location suitability. There are ${summary.templates} templates and ${summary.blockedTemplates} need attention.`;
  if (/location|room booking|book.*room|reserve.*room/.test(text)) return "Open Locations. Choose the campus to see only that campus's locations. You can create a location or book an existing location using campus-specific modules and staff who are allowed to teach there.";
  if (/move|drag|reschedule|change.*time|change.*day/.test(text)) return "Open Timetable, choose the required week, and drag a session to another day or time. Conflict checks run again after the change, including campus restrictions and individual student clashes.";
  if (/availability|annual leave|maintenance|conference|unavailable/.test(text)) return "Open Availability, select the campus, and add exceptions for staff, individual students, locations or legacy student groups. Unavailable periods are hard restrictions; preferred periods are guidance.";
  if (/publish|approval|review.*timetable|release/.test(text)) return `Open Review & Publication. The current publication status is ${summary.publicationStatus}. The platform checks planning and conflicts before release.`;
  if (/export|report|download/.test(text)) return "Open Reports to export timetable, activity templates, availability, locations, staff, individual students, programmes, modules and conflicts.";
  if (/conflict|clash|double booking|capacity/.test(text)) return `There are currently ${summary.conflicts} open conflicts. Conflict checks include location and staff double-booking, capacity, campus mismatches and overlapping individual student allocations.`;
  if (/suggest|feedback/.test(text)) return "Open Suggestions to submit feedback directly to the shared Google Sheet.";
  if (/overview|what can|how.*work/.test(text)) return `The platform currently contains ${summary.sessions} sessions, ${summary.locations} locations, ${summary.staff} staff, ${summary.students} students and ${summary.programmes} campus-specific programmes.`;
  return null;
}
