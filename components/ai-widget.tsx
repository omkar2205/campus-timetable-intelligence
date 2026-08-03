"use client";

import { FormEvent, useState } from "react";
import { Loader2, MessageCircleQuestion, Sparkles, Wand2 } from "lucide-react";
import { useCampusData } from "@/components/data-context";
import { askGemini } from "@/lib/backend";

export function AiWidget() {
  const { data, generateSchedule, backendConfig, backendStatus } = useCampusData();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const active = data.conflicts.filter(c => !c.resolved);
  const suggestions = active.length ? active.slice(0, 5).map(c => c.fix) : [
    "No active conflicts detected in the current timetable.",
    "Room utilisation can be improved by clustering modules by campus.",
    "Optimised timetable scenario is ready for review.",
    "Import latest room and cohort data before final publication.",
    "Export the generated timetable for academic team review."
  ];

  async function handleQuestion(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    try {
      const response = await askGemini(backendConfig, question.trim(), data);
      setAnswer(response || "Gemini is not enabled yet. Deploy the Apps Script backend and update runtime-config.json to activate live assistance.");
    } catch (error) {
      console.error(error);
      setAnswer("The assistant could not connect to the Apps Script backend. The timetable demo remains available in local mode.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="enterprise-card overflow-hidden">
    <div className="bg-gradient-to-br from-navy to-slateBrand p-5 text-white">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Sparkles className="text-teal-300"/><h3 className="font-semibold">AI Scheduling Assistant</h3></div>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-200">{backendStatus}</span>
      </div>
      <p className="mt-2 text-sm text-slate-300">Scheduling recommendations, FAQs and help powered through the Apps Script backend.</p>
    </div>
    <div className="space-y-3 p-5">
      {suggestions.map((suggestion, index) => <div key={suggestion + index} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><span className="mr-2 font-bold text-teal-600">0{index + 1}</span>{suggestion}</div>)}

      <form onSubmit={handleQuestion} className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy"><MessageCircleQuestion size={16}/>Ask about the timetable or tool</div>
        <textarea value={question} onChange={event => setQuestion(event.target.value)} className="input min-h-20 w-full py-2" placeholder="For example: Why is this room showing a capacity conflict?"/>
        <button disabled={loading || !question.trim()} className="btn-secondary mt-2 w-full disabled:cursor-not-allowed disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}Ask Assistant</button>
      </form>

      {answer && <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-900">{answer}</div>}
      <button onClick={generateSchedule} className="btn-primary w-full"><Wand2 size={16}/>Generate Optimised Timetable</button>
    </div>
  </div>;
}
