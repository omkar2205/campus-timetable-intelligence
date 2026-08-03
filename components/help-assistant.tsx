"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, ChevronDown, Loader2, Send, Sparkles, X } from "lucide-react";
import { useCampusData } from "@/components/data-context";
import { useWorkflow } from "@/components/workflow-context";
import { askGemini } from "@/lib/backend";

 type Message = { role: "assistant" | "user"; text: string };

const starterQuestions = [
  "What is an activity template?",
  "How do I move a class?",
  "How do I record availability?",
  "How do I publish a timetable?"
];

export function HelpAssistant() {
  const { data, backendConfig, backendStatus } = useCampusData();
  const { templates, publication } = useWorkflow();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hello. I can explain activity planning, availability, scheduling, room booking, conflicts, publication, imports, reports and pilot feedback." }
  ]);

  const summary = useMemo(() => ({
    sessions: data.sessions.length,
    rooms: data.rooms.length,
    lecturers: data.lecturers.length,
    groups: data.studentGroups.length,
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
      setMessages(current => [...current, {
        role: "assistant",
        text: remoteAnswer || "I could not find a specific answer. Use Activity Planning before scheduling, Availability for exceptions, Timetable for changes, Review & Publication for release decisions, and Suggestions for pilot feedback."
      }]);
    } catch (error) {
      console.error(error);
      setMessages(current => [...current, {
        role: "assistant",
        text: "The online assistant is unavailable at the moment. Built-in guidance is still available for activity templates, filters, availability, room booking, timetable movement, publication, imports and exports."
      }]);
    } finally {
      setLoading(false);
    }
  }

  return <>
    <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-40 inline-flex h-14 items-center gap-2 rounded-2xl bg-navy px-5 font-semibold text-white shadow-executive transition hover:-translate-y-0.5" aria-label="Open help assistant"><Sparkles size={19}/>Help</button>
    {open && <div className="fixed inset-0 z-50 flex items-end justify-end bg-navy/20 p-4 sm:p-6">
      <div className="flex h-[min(720px,90vh)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-executive">
        <div className="bg-gradient-to-br from-navy to-slateBrand p-5 text-white"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10"><Bot size={21}/></div><div><h3 className="font-bold">Timetable Assistant</h3><p className="text-xs text-slate-300">{backendStatus === "Connected" ? "Connected" : "Built-in guidance"}</p></div></div><button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-white/10"><X size={18}/></button></div></div>
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={message.role === "user" ? "ml-10 rounded-2xl rounded-br-md bg-navy p-3 text-sm leading-6 text-white" : "mr-8 rounded-2xl rounded-bl-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700"}>{message.text}</div>)}{loading && <div className="mr-8 flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white p-3 text-sm text-slate-500"><Loader2 className="animate-spin" size={16}/>Checking the timetable information…</div>}</div>
        <div className="border-t border-slate-200 bg-white p-4"><div className="mb-3 flex gap-2 overflow-x-auto pb-1">{starterQuestions.map(item => <button key={item} onClick={() => void submit(undefined, item)} className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">{item}</button>)}</div><form onSubmit={event => void submit(event)} className="flex gap-2"><input value={question} onChange={event => setQuestion(event.target.value)} className="input flex-1" placeholder="Ask how the platform works"/><button disabled={!question.trim() || loading} className="btn-primary w-11 px-0 disabled:opacity-50" aria-label="Send question"><Send size={17}/></button></form><button onClick={() => setOpen(false)} className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-semibold text-slate-400"><ChevronDown size={14}/>Minimise</button></div>
      </div>
    </div>}
  </>;
}

function localHelpAnswer(question: string, summary: { sessions: number; rooms: number; lecturers: number; groups: number; conflicts: number; templates: number; blockedTemplates: number; publicationStatus: string }) {
  const text = question.toLowerCase();
  if (/activity template|teaching requirement|pre.?schedul/.test(text)) return `Activity templates describe how teaching should be delivered before individual sessions are scheduled. Open Activity Planning to review module, cohort, size, duration, teaching weeks, tutor suitability and room suitability. There are ${summary.templates} templates and ${summary.blockedTemplates} currently need attention.`;
  if (/move|drag|reschedule|change.*time|change.*day/.test(text)) return "Open Timetable, choose the required week, and drag the session card to another day or time. You can also select it and change the lecturer, room, day or start time in Session Details. Conflicts are recalculated after the change.";
  if (/availability|annual leave|holiday|maintenance|conference|unavailable/.test(text)) return "Open Availability. Normal weekly patterns are shown from resource records, while date-specific exceptions can be added for lecturers, rooms or student groups. Unavailable periods act as hard restrictions; preferred periods act as guidance.";
  if (/publish|approval|review.*timetable|release/.test(text)) return `Open Review & Publication. The platform checks templates, sessions, resources, student groups and conflicts before enabling publication. The current status is ${summary.publicationStatus}. The pilot records the publication snapshot but does not send live calendar notifications.`;
  if (/filter|lecturer|course|module|campus|group/.test(text) && /how|where|show|find|filter/.test(text)) return "Open Timetable and use the Filters section. You can filter by course, module, lecturer, room, campus or student group. The search box checks all fields together. Select Clear to remove every filter.";
  if (/export|report|download/.test(text)) return "Open Reports to download timetable, activity-template, availability, room-utilisation, lecturer-workload, student-group, module and conflict data. Timetable can also export only the selected week and filters.";
  if (/import|csv|upload|replace.*data/.test(text)) return "Open Data Import, upload the CSV files and review the preview. Records remain staged until Generate replacement timetable is selected, so the published workspace is not replaced accidentally.";
  if (/conflict|clash|double booking|capacity/.test(text)) return `There are currently ${summary.conflicts} open conflicts. Open Conflict Alerts to review the cause and suggested action. Conflicts are generated from actual room, lecturer, student-group and capacity conditions.`;
  if (/room booking|book.*room|reserve.*room/.test(text)) return "Open Room Booking, filter the available rooms, select Book, and enter the module, group, date and time. Confirming adds a dated timetable session and runs conflict checks.";
  if (/suggest|feedback|pilot feedback/.test(text)) return "Open Suggestions to submit a rating, platform area, feedback type and detailed comment. The submission is written to the Suggestions tab in the shared Google Sheet.";
  if (/what.*site|how.*work|overview|what can/.test(text)) return `The platform contains ${summary.sessions} sessions, ${summary.rooms} rooms, ${summary.lecturers} lecturers and ${summary.groups} student groups. The workflow is Activity Planning, Availability, Timetable Scheduling, Conflict Review, Review & Publication, Reporting and Suggestions.`;
  return null;
}
