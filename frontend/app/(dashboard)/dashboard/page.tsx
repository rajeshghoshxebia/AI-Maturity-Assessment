"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, TrendingUp, Users } from "lucide-react";
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

export default function DashboardPage() {
  const [items, setItems] = useState<AssessmentListItem[]>([]);

  useEffect(() => {
    api.get<AssessmentListItem[]>("/assessments").then(setItems).catch(() => {});
  }, []);

  const active = items.filter((a) => a.status === "IN_PROGRESS" || a.status === "DRAFT").length;
  const completed = items.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold text-grey-900">Dashboard</h2>
        <p className="text-grey-500 text-sm mt-1">Overview of AI maturity assessments</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card flex items-start gap-4">
          <span className="rounded-lg bg-velvet-subtle p-2.5"><ClipboardList className="h-5 w-5 text-velvet" /></span>
          <div>
            <p className="text-sm text-grey-500">Active Assessments</p>
            <p className="text-2xl font-semibold text-grey-900 mt-0.5">{active}</p>
          </div>
        </div>
        <div className="card flex items-start gap-4">
          <span className="rounded-lg bg-green-50 p-2.5"><TrendingUp className="h-5 w-5 text-green-600" /></span>
          <div>
            <p className="text-sm text-grey-500">Completed</p>
            <p className="text-2xl font-semibold text-grey-900 mt-0.5">{completed}</p>
          </div>
        </div>
        <div className="card flex items-start gap-4">
          <span className="rounded-lg bg-blue-50 p-2.5"><Users className="h-5 w-5 text-blue-600" /></span>
          <div>
            <p className="text-sm text-grey-500">Total Assessments</p>
            <p className="text-2xl font-semibold text-grey-900 mt-0.5">{items.length}</p>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-grey-100">
          <h3 className="font-semibold text-grey-900">Recent assessments</h3>
          <Link href="/dashboard/assessments" className="text-sm text-velvet hover:underline">View all</Link>
        </div>
        {items.length === 0 ? (
          <div className="px-6 py-10 text-center text-grey-400 text-sm">
            No assessments yet.{" "}
            <Link href="/dashboard/assessments/new" className="text-velvet font-medium hover:underline">Create one →</Link>
          </div>
        ) : (
          <div className="divide-y divide-grey-100">
            {items.slice(0, 5).map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/assessments/${a.id}`}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-grey-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-grey-900">{a.organization_name}</p>
                  <p className="text-xs text-grey-500 mt-0.5">
                    {a.mode.toLowerCase()} · {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status]}`}>
                  {a.status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 && (
        <div className="card">
          <h3 className="font-semibold text-grey-900 mb-1">Get started</h3>
          <p className="text-sm text-grey-500 mb-4">Create your first AI maturity assessment for a client organisation.</p>
          <Link
            href="/dashboard/assessments/new"
            className="inline-flex items-center gap-2 rounded-md bg-velvet px-4 py-2 text-sm font-medium text-white hover:bg-velvet-dark transition-colors"
          >
            New assessment <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
