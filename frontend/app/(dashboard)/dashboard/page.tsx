"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, ChevronUp, ClipboardList, Lock, Pencil, TrendingUp, Users } from "lucide-react";
import { api } from "@/lib/api-client";
import { useMe, canEditOrg, isAdmin } from "@/lib/use-me";
import type { AssessmentMode, AssessmentStatus } from "@/types/assessment";

interface AssessmentListItem {
  id: string;
  organization_name: string;
  mode: AssessmentMode;
  status: AssessmentStatus;
  created_at: string;
  org_id: string | null;
}

const STATUS_STYLE: Record<AssessmentStatus, string> = {
  DRAFT: "bg-grey-100 text-grey-600",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  ARCHIVED: "bg-grey-100 text-grey-400",
};

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card p-0 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 md:px-6 md:py-4 hover:bg-grey-50 transition-colors"
      >
        <span className="font-semibold text-grey-900 text-sm md:text-base">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-grey-400" /> : <ChevronDown className="h-4 w-4 text-grey-400" />}
      </button>
      {open && <div className="border-t border-grey-100">{children}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [items, setItems] = useState<AssessmentListItem[]>([]);
  const me = useMe();
  const router = useRouter();

  // The Dashboard is an Administrator surface; other roles land on Assessments.
  useEffect(() => {
    if (me && !isAdmin(me)) router.replace("/dashboard/assessments");
  }, [me, router]);

  useEffect(() => {
    api.get<AssessmentListItem[]>("/assessments").then(setItems).catch(() => {});
  }, []);

  const active = items.filter((a) => a.status === "IN_PROGRESS" || a.status === "DRAFT").length;
  const completed = items.filter((a) => a.status === "COMPLETED").length;
  const doneItems = items.filter((a) => a.status === "COMPLETED");

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-grey-900">Dashboard</h2>
        <p className="text-grey-500 text-sm mt-1">Overview of AI maturity assessments</p>
      </div>

      <CollapsibleSection title="Summary">
        <div className="grid grid-cols-3 divide-x divide-grey-100">
          <div className="flex flex-col items-center py-4 px-2 text-center">
            <span className="rounded-lg bg-velvet-subtle p-2 mb-2">
              <ClipboardList className="h-4 w-4 text-velvet" />
            </span>
            <p className="text-2xl font-semibold text-grey-900">{active}</p>
            <p className="text-xs text-grey-500 mt-0.5 leading-tight">Active</p>
          </div>
          <div className="flex flex-col items-center py-4 px-2 text-center">
            <span className="rounded-lg bg-green-50 p-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </span>
            <p className="text-2xl font-semibold text-grey-900">{completed}</p>
            <p className="text-xs text-grey-500 mt-0.5 leading-tight">Completed</p>
          </div>
          <div className="flex flex-col items-center py-4 px-2 text-center">
            <span className="rounded-lg bg-blue-50 p-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
            </span>
            <p className="text-2xl font-semibold text-grey-900">{items.length}</p>
            <p className="text-xs text-grey-500 mt-0.5 leading-tight">Total</p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Recent Assessments">
        <div className="flex items-center justify-end px-4 py-2 md:px-6">
          <Link href="/dashboard/assessments" className="text-xs text-velvet hover:underline">View all</Link>
        </div>
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center text-grey-400 text-sm">
            No assessments yet.{" "}
            <Link href="/dashboard/assessments/new" className="text-velvet font-medium hover:underline">Create one</Link>
          </div>
        ) : (
          <div className="divide-y divide-grey-100">
            {items.slice(0, 5).map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/assessments/${a.id}`}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-grey-50 transition-colors md:px-6"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-sm font-medium text-grey-900 truncate">{a.organization_name}</p>
                  <p className="text-xs text-grey-500 mt-0.5">
                    {a.mode.toLowerCase()} · {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status]}`}>
                  {a.status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Completed Assessments">
        {doneItems.length === 0 ? (
          <div className="px-4 py-10 text-center text-grey-400 text-sm">No completed assessments yet.</div>
        ) : (
          <div className="divide-y divide-grey-100">
            {doneItems.map((a) => {
              const editable = canEditOrg(me, a.org_id);
              return (
                <Link
                  key={a.id}
                  href={`/dashboard/assessments/${a.id}`}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-grey-50 transition-colors md:px-6"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium text-grey-900 truncate">{a.organization_name}</p>
                    <p className="text-xs text-grey-500 mt-0.5">
                      {a.mode.toLowerCase()} · {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${editable ? "bg-velvet-subtle text-velvet" : "bg-grey-100 text-grey-500"}`}>
                    {editable ? <><Pencil className="h-3 w-3" /> Editable</> : <><Lock className="h-3 w-3" /> View only</>}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </CollapsibleSection>

      {items.length === 0 && (
        <div className="card px-4 py-5 md:px-6">
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
