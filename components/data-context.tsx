"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initialData } from "@/data/mock";
import { AppData, Lecturer, Module, Room, SchedulingRequirement, Session, StudentGroup } from "@/types";
import { detectConflicts, generateTimetable } from "@/lib/scheduler";
import {
  clearRemoteData,
  getRuntimeConfig,
  loadRemoteData,
  RuntimeConfig,
  saveRemoteData
} from "@/lib/backend";

const STORAGE_KEY = "cti-demo-data-v3-empty-live";
const STAGED_STORAGE_KEY = "cti-demo-staged-data-v3-empty-live";

type ImportType = "rooms" | "lecturers" | "studentGroups" | "modules" | "requirements";
type BackendStatus = "Local" | "Connecting" | "Connected" | "Syncing" | "Error";

type DataContextValue = {
  data: AppData;
  stagedData: AppData;
  backendConfig: RuntimeConfig;
  backendStatus: BackendStatus;
  resetData: () => void;
  importRows: (type: ImportType, rows: Record<string, string>[]) => void;
  generateSchedule: () => void;
  updateSession: (id: string, patch: Partial<Session>) => void;
  resolveConflict: (id?: string) => void;
  addManualSession: (session: Session) => void;
  syncNow: () => Promise<void>;
};

const emptyData = (): AppData => ({ rooms: [], lecturers: [], studentGroups: [], modules: [], sessions: [], conflicts: [], requirements: [] });
const defaultBackendConfig: RuntimeConfig = { backendEnabled: false, appsScriptUrl: "", geminiEnabled: false, dataMode: "training" };
const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(initialData);
  const [stagedData, setStagedData] = useState<AppData>(emptyData());
  const [loaded, setLoaded] = useState(false);
  const [backendConfig, setBackendConfig] = useState<RuntimeConfig>(defaultBackendConfig);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("Local");

  useEffect(() => {
    let active = true;

    async function initialise() {
      let localData = initialData;
      let localStaged = emptyData();

      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const staged = localStorage.getItem(STAGED_STORAGE_KEY);
        if (saved) localData = JSON.parse(saved);
        if (staged) localStaged = JSON.parse(staged);
      } catch {}

      if (!active) return;
      setData(localData);
      setStagedData(localStaged);

      const config = await getRuntimeConfig();
      if (!active) return;
      setBackendConfig(config);

      if (config.backendEnabled && config.appsScriptUrl) {
        setBackendStatus("Connecting");
        try {
          const remoteData = await loadRemoteData(config);
          if (active && remoteData) setData(remoteData);
          if (active) setBackendStatus("Connected");
        } catch (error) {
          console.error("Backend load failed; continuing with browser storage.", error);
          if (active) setBackendStatus("Error");
        }
      } else {
        setBackendStatus("Local");
      }

      if (active) setLoaded(true);
    }

    void initialise();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem(STAGED_STORAGE_KEY, JSON.stringify(stagedData));
  }, [stagedData, loaded]);

  const persistLiveData = useCallback((next: AppData) => {
    if (!backendConfig.backendEnabled || !backendConfig.appsScriptUrl) return;
    setBackendStatus("Syncing");
    void saveRemoteData(backendConfig, next)
      .then(() => setBackendStatus("Connected"))
      .catch((error) => {
        console.error("Backend save failed; browser copy remains available.", error);
        setBackendStatus("Error");
      });
  }, [backendConfig]);

  const value = useMemo<DataContextValue>(() => ({
    data,
    stagedData,
    backendConfig,
    backendStatus,
    resetData: () => {
      const empty = emptyData();
      setData(empty);
      setStagedData(empty);
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STAGED_STORAGE_KEY);
      } catch {}
      if (backendConfig.backendEnabled && backendConfig.appsScriptUrl) {
        setBackendStatus("Syncing");
        void clearRemoteData(backendConfig)
          .then(() => setBackendStatus("Connected"))
          .catch(() => setBackendStatus("Error"));
      }
    },
    importRows: (type, rows) => setStagedData(current => ({ ...current, ...mapImport(type, rows), sessions: [], conflicts: [], generatedAt: undefined })),
    generateSchedule: () => {
      const next = generateTimetable(stagedData);
      setData(next);
      persistLiveData(next);
    },
    updateSession: (id, patch) => setData(current => {
      const sessions = current.sessions.map(s => s.id === id ? { ...s, ...patch } : s);
      const next = { ...current, sessions, conflicts: detectConflicts({ ...current, sessions }) };
      persistLiveData(next);
      return next;
    }),
    resolveConflict: (id) => setData(current => {
      const next = { ...current, conflicts: current.conflicts.map(c => c.id === id ? { ...c, resolved: true, severity: "Low" } : c) };
      persistLiveData(next);
      return next;
    }),
    addManualSession: (session) => setData(current => {
      const sessions = [...current.sessions, session];
      const next = { ...current, sessions, conflicts: detectConflicts({ ...current, sessions }) };
      persistLiveData(next);
      return next;
    }),
    syncNow: async () => {
      if (!backendConfig.backendEnabled || !backendConfig.appsScriptUrl) return;
      setBackendStatus("Syncing");
      try {
        await saveRemoteData(backendConfig, data);
        setBackendStatus("Connected");
      } catch (error) {
        setBackendStatus("Error");
        throw error;
      }
    }
  }), [data, stagedData, backendConfig, backendStatus, persistLiveData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useCampusData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useCampusData must be used inside DataProvider");
  return context;
}

function mapImport(type: ImportType, rows: Record<string, string>[]): Partial<AppData> {
  if (type === "rooms") {
    const rooms: Room[] = rows.map((r, index) => ({
      id: r.room_id || `R${index + 1}`,
      room: r.room_name || r.room || "Unnamed Room",
      campus: r.campus || "Main Campus",
      building: r.building || "Main Building",
      type: r.room_type || r.type || "Lecture Hall",
      capacity: Number(r.capacity || 0),
      status: r.status || "Available"
    }));
    return { rooms };
  }
  if (type === "lecturers") {
    const lecturers: Lecturer[] = rows.map((r, index) => ({
      id: r.lecturer_id || `L${index + 1}`,
      name: r.lecturer_name || r.name || "Unnamed Lecturer",
      department: r.department || "Academic",
      maxWeeklyHours: Number(r.max_weekly_hours || 18),
      weeklyHours: 0,
      availability: r.availability || "Mon-Fri 09:00-17:00",
      preferredCampus: r.preferred_campus || "Main Campus",
      workload: "Normal",
      modules: []
    }));
    return { lecturers };
  }
  if (type === "studentGroups") {
    const studentGroups: StudentGroup[] = rows.map((r, index) => ({
      id: r.group_id || `G${index + 1}`,
      name: r.group_name || r.name || "Unnamed Group",
      course: r.course || "General",
      studentCount: Number(r.student_count || r.students || 0),
      campus: r.campus || "Main Campus"
    }));
    return { studentGroups };
  }
  if (type === "modules") {
    const modules: Module[] = rows.map((r, index) => ({
      id: r.module_id || `M${index + 1}`,
      code: r.module_code || r.code || "MOD000",
      name: r.module_name || r.name || "Unnamed Module",
      course: r.course || "General",
      lecturerId: r.lecturer_id || undefined,
      lecturerName: r.lecturer_name || undefined,
      weeklySessions: Number(r.weekly_sessions || 1),
      hoursPerSession: Number(r.hours_per_session || 2),
      roomTypeRequired: r.room_type_required || "Lecture Hall",
      studentGroup: r.student_group || undefined
    }));
    return { modules };
  }
  const requirements: SchedulingRequirement[] = rows.map(r => ({
    moduleCode: r.module_code || r.moduleCode || "",
    studentGroup: r.student_group || r.studentGroup || "",
    preferredDays: r.preferred_days || "",
    preferredTime: r.preferred_time || "",
    requiredRoomType: r.required_room_type || "Lecture Hall",
    avoidDays: r.avoid_days || ""
  }));
  return { requirements };
}
