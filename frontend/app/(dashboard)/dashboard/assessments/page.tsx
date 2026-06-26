"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ClipboardList, ChevronRight } from "lucide-react";
import { api } from "@/lib/api-client";
import type { AssessmentMode, AssessmentStatus } from "@/types/assessment";

interface AssessmentListItem {
  id: string;
  organization_name: string;
  mode: AssessmentMode;
  status: AssessmentStatus;
  created_at: string;
}

const STATUS_STYLE: Record<AssessmentStatus, string> = {
  DRAFT: "bg-grey-100 text-grey-600",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  ARCHIVED: "bg-grey-100 text-grey-400",
};

const STATUS_LABEL: Record<AssessmentStatus, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export default function AssessmentsPage() {
  const [items, setItems] = useState<AssessmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<AssessmentListItem[]>("/assessments")
      .then(setItems)
      .catch(() => setError("Failed to load assessments."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-grey-900">Assessments</h2>
          <p className="text-grey-500 text-sm mt-1">All AI maturity assessments</p>
        </div>
        <Link
          href="/dashboard/assessments/new"
          className="inline-flex items-center gap-2 rounded-md bg-velvet px-4 py-2 text-sm font-medium text-white hover:bg-velvet-dark transition-colors"
        >
          <Plus className="h-4 w-4" /> New Assessment
        </Link>
      </div>

      {loading && (
        <div className="card flex items-center justify-center h-40 text-grey-400">
          Loading…
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="card flex flex-col items-center justify-center h-48 gap-3 text-grey-400">
          <ClipboardList className="h-10 w-10 text-grey-300" />
          <p className="text-sm">No assessments yet.</p>
          <Link
            href="/dashboard/assessments/new"
            className="text-sm text-velvet font-medium hover:underline"
          >
            Create your first assessment →
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-grey-50 border-b border-grey-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-grey-600">Organisation</th>
                <th className="text-left px-6 py-3 font-medium text-grey-600">Mode</th>
                <th className="text-left px-6 py-3 font-medium text-grey-600">Status</th>
                <th className="text-left px-6 py-3 font-medium text-grey-600">Created</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-100">
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-grey-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-grey-900">{a.organization_name}</td>
                  <td className="px-6 py-4 text-grey-500 capitalize">{a.mode.toLowerCase()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status]}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-grey-500">
                    {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/assessments/${a.id}`}
                      className="inline-flex items-center gap-1 text-velvet text-xs font-medium hover:underline"
                    >
                      Open <ChevronRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
