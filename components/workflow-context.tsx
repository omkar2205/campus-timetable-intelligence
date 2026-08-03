"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useCampusData } from "@/components/data-context";
import { createTemplatesFromData, templateStatus } from "@/lib/workflow";
import type { ActivityTemplate, AvailabilityException, PublicationState } from "@/types/workflow";

const STORAGE_KEY = "cti-guide-workflow-v1";

type WorkflowState = {
  templates: ActivityTemplate[];
  exceptions: AvailabilityException[];
  publication: PublicationState;
};

type WorkflowContextValue = WorkflowState & {
  updateTemplate: (id: string, patch: Partial<ActivityTemplate>) => void;
  refreshTemplates: () => void;
  addException: (exception: Omit<AvailabilityException, "id" | "createdAt">) => void;
  removeException: (id: string) => void;
  updatePublication: (patch: Partial<PublicationState>) => void;
  publishTimetable: (publishedBy: string, notes: string) => void;
};

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const { data } = useCampusData();
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState<WorkflowState>(() => ({
    templates: [],
    exceptions: initialExceptions(),
    publication: initialPublication()
  }));

  useEffect(() => {
    let restored: WorkflowState | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) restored = JSON.parse(saved) as WorkflowState;
    } catch {}

    if (restored) {
      setState(restored);
    } else {
      setState({
        templates: createTemplatesFromData(data),
        exceptions: initialExceptions(),
        publication: initialPublication()
      });
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setState(current => current.templates.length || !data.modules.length
      ? current
      : { ...current, templates: createTemplatesFromData(data) });
  }, [data.modules.length, loaded]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, loaded]);

  const value = useMemo<WorkflowContextValue>(() => ({
    ...state,
    updateTemplate: (id, patch) => setState(current => ({
      ...current,
      templates: current.templates.map(template => {
        if (template.id !== id) return template;
        const updated = { ...template, ...patch, updatedAt: new Date().toISOString() };
        return { ...updated, status: templateStatus(updated) };
      })
    })),
    refreshTemplates: () => setState(current => ({
      ...current,
      templates: createTemplatesFromData(data),
      publication: { ...current.publication, status: "Draft" }
    })),
    addException: exception => setState(current => ({
      ...current,
      exceptions: [{ ...exception, id: `AE-${Date.now()}`, createdAt: new Date().toISOString() }, ...current.exceptions],
      publication: { ...current.publication, status: "Draft" }
    })),
    removeException: id => setState(current => ({
      ...current,
      exceptions: current.exceptions.filter(exception => exception.id !== id),
      publication: { ...current.publication, status: "Draft" }
    })),
    updatePublication: patch => setState(current => ({
      ...current,
      publication: { ...current.publication, ...patch }
    })),
    publishTimetable: (publishedBy, notes) => setState(current => ({
      ...current,
      publication: {
        ...current.publication,
        version: current.publication.version + 1,
        status: "Published",
        notes,
        lastPublishedAt: new Date().toISOString(),
        publishedBy: publishedBy || "Timetabling team"
      }
    }))
  }), [data, state]);

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) throw new Error("useWorkflow must be used inside WorkflowProvider");
  return context;
}

function initialPublication(): PublicationState {
  return {
    version: 1,
    status: "Draft",
    scope: "All campuses",
    notes: ""
  };
}

function initialExceptions(): AvailabilityException[] {
  return [
    {
      id: "AE001",
      resourceType: "Lecturer",
      resourceId: "L4",
      resourceName: "DAVIES, Oliver",
      startDate: "2026-09-14",
      endDate: "2026-09-14",
      startTime: "09:00",
      endTime: "17:00",
      availabilityType: "Unavailable",
      reason: "Conference",
      notes: "Individual teaching-week exception",
      createdAt: "2026-08-03T00:00:00.000Z"
    },
    {
      id: "AE002",
      resourceType: "Room",
      resourceId: "MAN-MC-01",
      resourceName: "Moot Court 1",
      startDate: "2026-10-05",
      endDate: "2026-10-06",
      startTime: "08:00",
      endTime: "19:00",
      availabilityType: "Unavailable",
      reason: "Maintenance",
      notes: "Room temporarily unavailable",
      createdAt: "2026-08-03T00:00:00.000Z"
    }
  ];
}
