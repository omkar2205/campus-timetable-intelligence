"use client";

import { useEffect, useState } from "react";
import { DataProvider } from "@/components/data-context";
import { WorkflowProvider } from "@/components/workflow-context";

const MIGRATION_FLAG = "cti-production-pilot-v1-ready";

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(MIGRATION_FLAG)) {
        localStorage.removeItem("cti-demo-data-v3-empty-live");
        localStorage.removeItem("cti-demo-staged-data-v3-empty-live");
        localStorage.removeItem("cti-working-demo-v4-ready");
        localStorage.setItem(MIGRATION_FLAG, "true");
      }
    } catch {}
    setReady(true);
  }, []);

  if (!ready) return <div className="min-h-screen bg-soft" />;
  return <DataProvider><WorkflowProvider>{children}</WorkflowProvider></DataProvider>;
}
