"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Download, History, Send, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useCampusData } from "@/components/data-context";
import { useWorkflow } from "@/components/workflow-context";
import { downloadCsv, timetableRows } from "@/lib/export";
import { readinessSummary } from "@/lib/workflow";

export default function PublicationPage() {
  const { data } = useCampusData();
  const { templates, publication, updatePublication, publishTimetable } = useWorkflow();
  const readiness = useMemo(() => readinessSummary(data, templates), [data, templates]);
  const [publishedBy, setPublishedBy] = useState("Timetabling team");
  const [notes, setNotes] = useState(publication.notes);
  const [message, setMessage] = useState("");

  function markReady() {
    if (!readiness.ready) {
      setMessage("The timetable cannot be marked ready until every blocking validation check is resolved.");
      return;
    }
    updatePublication({ status: "Ready for Review", notes });
    setMessage("The timetable has been marked Ready for Review.");
  }

  function publish() {
    if (!readiness.ready) {
      setMessage("Resolve the blocking checks before publishing the timetable.");
      return;
    }
    publishTimetable(publishedBy, notes);
    setMessage("The publication snapshot has been recorded. Calendar and email delivery are represented for evaluation and are not connected to live institutional systems.");
  }

  return <AppShell title="Review & Publication" subtitle="Validate, approve and record timetable publication decisions">
    {message && <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800">{message}</div>}

    <div className="grid gap-5 md:grid-cols-4">
      <Metric label="Publication status" value={publication.status} detail={`Version ${publication.version}`}/>
      <Metric label="Scheduled sessions" value={String(data.sessions.length)} detail="Included in the current scope"/>
      <Metric label="Templates blocked" value={String(readiness.blockedTemplates)} detail="Must be resolved before publication" tone={readiness.blockedTemplates ? "bad" : "good"}/>
      <Metric label="Open conflicts" value={String(readiness.openConflicts)} detail="Hard timetable issues" tone={readiness.openConflicts ? "bad" : "good"}/>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        <div className="enterprise-card p-5">
          <div className="flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700"><ShieldCheck size={21}/></div><div><h3 className="font-bold text-navy">Publication readiness</h3><p className="mt-1 text-sm text-slate-500">The checks below combine activity-template validation with the current scheduled timetable.</p></div></div>
          <div className="mt-5 space-y-3">{readiness.checks.map(check => <div key={check.label} className={check.passed ? "flex items-start gap-3 rounded-2xl bg-emerald-50 p-4" : "flex items-start gap-3 rounded-2xl bg-red-50 p-4"}>{check.passed ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={19}/> : <CircleAlert className="mt-0.5 shrink-0 text-red-600" size={19}/>}<div><p className={check.passed ? "font-semibold text-emerald-800" : "font-semibold text-red-800"}>{check.label}</p><p className={check.passed ? "mt-1 text-sm text-emerald-700" : "mt-1 text-sm text-red-700"}>{check.detail}</p></div></div>)}</div>
        </div>

        <div className="enterprise-card p-5">
          <div className="flex items-center justify-between gap-3"><div><h3 className="font-bold text-navy">Publication scope</h3><p className="mt-1 text-sm text-slate-500">Review what will be represented in the published timetable snapshot.</p></div><button onClick={() => downloadCsv(`timetable-publication-v${publication.version}.csv`, timetableRows(data.sessions))} className="btn-secondary"><Download size={16}/>Export snapshot</button></div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Scope label="Campuses" value={new Set(data.sessions.map(session => session.campus)).size}/><Scope label="Programmes" value={new Set(data.sessions.map(session => session.course)).size}/><Scope label="Student groups" value={new Set(data.sessions.map(session => session.group)).size}/><Scope label="Lecturers" value={new Set(data.sessions.map(session => session.lecturer)).size}/><Scope label="Rooms" value={new Set(data.sessions.map(session => session.room)).size}/><Scope label="One-off sessions" value={data.sessions.filter(session => Boolean(session.date)).length}/></div>
        </div>

        <div className="enterprise-card p-5">
          <div className="flex items-center gap-2"><History size={18}/><h3 className="font-bold text-navy">Current publication record</h3></div>
          <dl className="mt-4 grid gap-3 md:grid-cols-2"><Record label="Version" value={String(publication.version)}/><Record label="Scope" value={publication.scope}/><Record label="Published by" value={publication.publishedBy || "Not published"}/><Record label="Published at" value={publication.lastPublishedAt ? new Date(publication.lastPublishedAt).toLocaleString("en-GB") : "Not published"}/></dl>
        </div>
      </div>

      <aside className="enterprise-card h-fit p-5 xl:sticky xl:top-28">
        <h3 className="font-bold text-navy">Review decision</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">Use this section to record the review state and publication snapshot during pilot testing.</p>
        <label className="mt-5 block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Reviewed or published by</span><input className="input w-full" value={publishedBy} onChange={event => setPublishedBy(event.target.value)}/></label>
        <label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Review notes</span><textarea className="min-h-32 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none ring-tealBrand/20 focus:ring-4" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Record approvals, exceptions or changes required before release."/></label>
        <div className="mt-5 space-y-2"><button onClick={markReady} disabled={!readiness.ready} className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-50"><ShieldCheck size={16}/>Mark Ready for Review</button><button onClick={publish} disabled={!readiness.ready} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"><Send size={16}/>Publish snapshot</button></div>
        <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">This pilot records the publication decision and timetable version. It does not send live student or staff calendar updates.</div>
      </aside>
    </div>
  </AppShell>;
}

function Metric({ label, value, detail, tone = "normal" }: { label: string; value: string; detail: string; tone?: "normal" | "good" | "bad" }) {
  const style = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-red-700" : "text-navy";
  return <div className="enterprise-card p-5"><p className="text-sm text-slate-500">{label}</p><p className={`mt-3 text-2xl font-bold ${style}`}>{value}</p><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></div>;
}

function Scope({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-navy">{value}</p></div>;
}

function Record({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-xs font-bold uppercase text-slate-400">{label}</dt><dd className="mt-1 font-semibold text-slate-700">{value}</dd></div>;
}
