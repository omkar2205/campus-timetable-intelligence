"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initialData } from "@/data/mock";
import { AppData, Lecturer, Module, Room, SchedulingRequirement, Session, StudentGroup } from "@/types";
import { detectConflicts, generateTimetable } from "@/lib/scheduler";
import {
  checkBackendReachable,
  getRuntimeConfig,
  loadRemoteData,
  RuntimeConfig,
  saveRemoteData
} from "@/lib/backend";

const STORAGE_KEY = "cti-platform-data-v6";
const STAGED_STORAGE_KEY = "cti-platform-staged-v6";

const SEEDED_CONFLICT_IDS = new Set(["C001", "C002", "C003", "C004", "C005"]);
const SEEDED_CONFLICT_MODULES = new Set([
  "MAN-CRIADV-26-022",
  "BHM-SOL-26-053",
  "BHM-EU-26-092",
  "MAN-CRIADV-26-132",
  "MAN-EU-26-152"
]);

type ImportType = "rooms" | "lecturers" | "studentGroups" | "modules" | "requirements";
export type BackendStatus = "Local" | "Connecting" | "Connected" | "Syncing" | "Unavailable";

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

function hasStagedSchedulingData(value: AppData) {
  return value.rooms.length > 0 && value.lecturers.length > 0 && value.studentGroups.length > 0 && value.modules.length > 0;
}

function withoutSeededConflicts(value: AppData): AppData {
  return {
    ...value,
    sessions: value.sessions.map(session => {
      if (SEEDED_CONFLICT_MODULES.has(session.moduleCode) && session.conflict === "Capacity mismatch") {
        const { conflict: _conflict, ...cleanSession } = session;
        return cleanSession;
      }
      return session;
    }),
    conflicts: value.conflicts.filter(conflict => !SEEDED_CONFLICT_IDS.has(conflict.id || ""))
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const cleanInitialData = useMemo(() => withoutSeededConflicts(structuredClone(initialData)), []);
  const [data, setData] = useState<AppData>(cleanInitialData);
  const [stagedData, setStagedData] = useState<AppData>(emptyData());
  const [loaded, setLoaded] = useState(false);
  const [backendConfig, setBackendConfig] = useState<RuntimeConfig>(defaultBackendConfig);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("Local");

  useEffect(() => {
    let active = true;

    async function initialise() {
      let localData = cleanInitialData;
      let localStaged = emptyData();

      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const staged = localStorage.getItem(STAGED_STORAGE_KEY);
        if (saved) localData = withoutSeededConflicts(JSON.parse(saved));
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
          if (active && remoteData && remoteData.rooms.length) {
            const cleanedRemote = withoutSeededConflicts(remoteData);
            setData(cleanedRemote);
            const removedSeededContent = cleanedRemote.conflicts.length !== remoteData.conflicts.length
              || cleanedRemote.sessions.some((session, index) => session.conflict !== remoteData.sessions[index]?.conflict);
            if (removedSeededContent) {
              void saveRemoteData(config, cleanedRemote).catch(error => console.warn("Seeded conflict cleanup could not be confirmed.", error));
            }
          }
          if (active) setBackendStatus("Connected");
        } catch (error) {
          console.warn("Shared data could not be read directly; checking backend reachability.", error);
          const reachable = await checkBackendReachable(config);
          if (active) setBackendStatus(reachable ? "Connected" : "Unavailable");
        }
      } else {
        setBackendStatus("Local");
      }

      if (active) setLoaded(true);
    }

    void initialise();
    return () => { active = false; };
  }, [cleanInitialData]);

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
        console.warn("Shared save was unavailable; the browser copy remains available.", error);
        setBackendStatus("Unavailable");
      });
  }, [backendConfig]);

  const value = useMemo<DataContextValue>(() => ({
    data,
    stagedData,
    backendConfig,
    backendStatus,
    resetData: () => {
      const restored = withoutSeededConflicts(structuredClone(initialData));
      setData(restored);
      setStagedData(emptyData());
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STAGED_STORAGE_KEY);
      } catch {}
      persistLiveData(restored);
    },
    importRows: (type, rows) => setStagedData(current => ({ ...current, ...mapImport(type, rows), sessions: [], conflicts: [], generatedAt: undefined })),
    generateSchedule: () => {
      const source = hasStagedSchedulingData(stagedData)
        ? stagedData
        : { ...data, sessions: [], conflicts: [], generatedAt: undefined };
      const next = generateTimetable(source);
      setData(next);
      persistLiveData(next);
    },
    updateSession: (id, patch) => setData(current => {
      const sessions = current.sessions.map(session => session.id === id ? { ...session, ...patch } : session);
      const next = { ...current, sessions, conflicts: detectConflicts({ ...current, sessions }) };
      persistLiveData(next);
      return next;
    }),
    resolveConflict: (id) => setData(current => {
      const next = { ...current, conflicts: current.conflicts.map(conflict => conflict.id === id ? { ...conflict, resolved: true, severity: "Low" } : conflict) };
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
        setBackendStatus("Unavailable");
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
    const rooms: Room[] = rows.map((row, index) => ({
      id: row.room_id || `R${index + 1}`,
      room: row.room_name || row.room || "Unnamed Room",
      campus: row.campus || "Main Campus",
      building: row.building || "Main Building",
      type: row.room_type || row.type || "Lecture Hall",
      capacity: Number(row.capacity || 0),
      status: row.status || "Available"
    }));
    return { rooms };
  }

  if (type === "lecturers") {
    const lecturers: Lecturer[] = rows.map((row, index) => ({
      id: row.lecturer_id || `L${index + 1}`,
      name: row.lecturer_name || row.name || "Unnamed Lecturer",
      department: row.department || "Academic",
      maxWeeklyHours: Number(row.max_weekly_hours || 18),
      weeklyHours: 0,
      availability: row.availability || "Mon-Fri 09:00-17:00",
      preferredCampus: row.preferred_campus || "Main Campus",
      workload: "Normal",
      modules: []
    }));
    return { lecturers };
  }

  if (type === "studentGroups") {
    const studentGroups: StudentGroup[] = rows.map((row, index) => ({
      id: row.group_id || `G${index + 1}`,
      name: row.group_name || row.name || "Unnamed Group",
      course: row.course || "General",
      studentCount: Number(row.student_count || row.students || 0),
      campus: row.campus || "Main Campus"
    }));
    return { studentGroups };
  }

  if (type === "modules") {
    const modules: Module[] = rows.map((row, index) => ({
      id: row.module_id || `M${index + 1}`,
      code: row.module_code || row.code || "MOD000",
      name: row.module_name || row.name || "Unnamed Module",
      course: row.course || "General",
      lecturerId: row.lecturer_id || undefined,
      lecturerName: row.lecturer_name || undefined,
      weeklySessions: Number(row.weekly_sessions || 1),
      hoursPerSession: Number(row.hours_per_session || 2),
      roomTypeRequired: row.room_type_required || "Lecture Hall",
      studentGroup: row.student_group || undefined
    }));
    return { modules };
  }

  const requirements: SchedulingRequirement[] = rows.map(row => ({
    moduleCode: row.module_code || row.moduleCode || "",
    studentGroup: row.student_group || row.studentGroup || "",
    preferredDays: row.preferred_days || "",
    preferredTime: row.preferred_time || "",
    requiredRoomType: row.required_room_type || "Lecture Hall",
    avoidDays: row.avoid_days || ""
  }));
  return { requirements };
}
