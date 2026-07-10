"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ChevronRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Assessment } from "@/types/assessment";

interface ReportListItem {
  id: string;
  organization_name: string;
  status: string;
  created_at: string;
  org_id: string | null;
}

export default function ReportsPage() {
  const [items, setItems] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Assessment[]>("/assessments")
      .then((assessments) => {
        setItems(assessments.map((assessment) => ({
          id: assessment.id,
          organization_name: assessment.organization_name,
          status: assessment.status,
          created_at: assessment.created_at,
          org_id: assessment.org_id,
        })));
      })
      .catch(() => setError("Failed to load reports."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-semibold text-grey-900">Reports</h2>
          <p className="text-grey-500 text-sm mt-1">Open assessment reports for your organizations</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="card flex items-center justify-center h-40 text-grey-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading reports…
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="card flex flex-col items-center justify-center h-48 gap-3 text-grey-400">
          <FileText className="h-10 w-10 text-grey-300" />
          <p className="text-sm">No reports available yet.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="card p-0">
          <div className="divide-y divide-grey-100">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-grey-900 truncate">{item.organization_name}</p>
                  <p className="text-xs text-grey-500 mt-0.5">
                    {item.status} · {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <Link href={`/dashboard/reports/${item.id}`} className="inline-flex items-center gap-1 text-velvet text-sm font-medium hover:underline">
                  Open <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
