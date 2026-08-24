"use client";

import { useEffect, useState } from "react";
import { DataProvider } from "@/components/data-context";
import { WorkflowProvider } from "@/components/workflow-context";

const MIGRATION_FLAG = "cti-campus-master-data-v2-ready";

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(MIGRATION_FLAG)) {
        [
          "cti-demo-data-v3-empty-live",
          "cti-demo-staged-data-v3-empty-live",
          "cti-working-demo-v4-ready",
          "cti-platform-data-v5",
          "cti-platform-staged-v5",
          "cti-platform-data-v6",
          "cti-platform-staged-v6",
          "cti-guide-workflow-v1"
        ].forEach(key => localStorage.removeItem(key));
        localStorage.setItem(MIGRATION_FLAG, "true");
      }
    } catch {}
    setReady(true);
  }, []);

  if (!ready) return <div className="min-h-screen bg-soft" />;
  return <DataProvider><WorkflowProvider>{children}</WorkflowProvider></DataProvider>;
}
