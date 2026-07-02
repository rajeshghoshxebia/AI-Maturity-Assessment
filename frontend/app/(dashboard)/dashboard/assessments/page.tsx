"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, ChevronRight, Edit2, MoreHorizontal, Plus, Trash2, X, Check } from "lucide-react";
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

const ALL_STATUSES: AssessmentStatus[] = ["DRAFT", "IN_PROGRESS", "COMPLETED", "ARCHIVED"];

function ActionsMenu({ item, onDelete, onStatusChange }: {
  item: AssessmentListItem;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: AssessmentStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); setConfirmDelete(false); }}
        className="p-1.5 rounded-md text-grey-400 hover:text-grey-700 hover:bg-grey-100 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setConfirmDelete(false); }} />
          <div className="absolute right-0 top-8 z-20 w-48 rounded-lg border border-grey-200 bg-white shadow-elevated py-1 text-sm">
            <Link
              href={`/dashboard/assessments/${item.id}`}
              className="flex items-center gap-2 px-3 py-2 text-grey-700 hover:bg-grey-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Edit2 className="h-3.5 w-3.5" /> Open / Edit
            </Link>
            <div className="border-t border-grey-100 my-1" />
            <p className="px-3 py-1 text-xs text-grey-400 font-medium uppercase tracking-wide">Change status</p>
            {ALL_STATUSES.filter((s) => s !== item.status).map((s) => (
              <button
                key={s}
                onClick={() => { onStatusChange(item.id, s); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-grey-700 hover:bg-grey-50 transition-colors"
              >
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[s]}`}>{STATUS_LABEL[s]}</span>
              </button>
            ))}
            <div className="border-t border-grey-100 my-1" />
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            ) : (
              <div className="px-3 py-2">
                <p className="text-xs text-grey-600 mb-2">Delete this assessment?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onDelete(item.id); setOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-1 rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                  >
                    <Check className="h-3 w-3" /> Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-md border border-grey-200 px-2 py-1 text-xs text-grey-600 hover:bg-grey-50"
                  >
                    <X className="h-3 w-3" /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

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

  async function handleDelete(id: string) {
    try {
      await api.delete(`/assessments/${id}`);
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError("Failed to delete assessment.");
    }
  }

  async function handleStatusChange(id: string, status: AssessmentStatus) {
    try {
      await api.patch(`/assessments/${id}`, { status });
      setItems((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    } catch {
      setError("Failed to update status.");
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-semibold text-grey-900">Assessments</h2>
          <p className="text-grey-500 text-sm mt-1">All AI maturity assessments</p>
        </div>
        <Link
          href="/dashboard/assessments/new"
          className="shrink-0 inline-flex items-center gap-2 rounded-md bg-velvet px-3 py-2 md:px-4 text-sm font-medium text-white hover:bg-velvet-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Assessment</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
        </div>
      )}

      {loading && <div className="card flex items-center justify-center h-40 text-grey-400">Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="card flex flex-col items-center justify-center h-48 gap-3 text-grey-400">
          <ClipboardList className="h-10 w-10 text-grey-300" />
          <p className="text-sm">No assessments yet.</p>
          <Link href="/dashboard/assessments/new" className="text-sm text-velvet font-medium hover:underline">
            Create your first assessment →
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="card p-0 overflow-hidden">
          {/* Desktop table */}
          <table className="hidden md:table w-full text-sm">
            <thead className="bg-grey-50 border-b border-grey-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-grey-600">Organisation</th>
                <th className="text-left px-6 py-3 font-medium text-grey-600">Mode</th>
                <th className="text-left px-6 py-3 font-medium text-grey-600">Status</th>
                <th className="text-left px-6 py-3 font-medium text-grey-600">Created</th>
                <th className="px-6 py-3 w-24" />
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
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/assessments/${a.id}`}
                        className="inline-flex items-center gap-1 text-velvet text-xs font-medium hover:underline"
                      >
                        Open <ChevronRight className="h-3 w-3" />
                      </Link>
                      <ActionsMenu item={a} onDelete={handleDelete} onStatusChange={handleStatusChange} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-grey-100">
            {items.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3.5">
                <Link href={`/dashboard/assessments/${a.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-grey-900 truncate">{a.organization_name}</p>
                  <p className="text-xs text-grey-500 mt-0.5 capitalize">
                    {a.mode.toLowerCase()} · {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </Link>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status]}`}>
                    {STATUS_LABEL[a.status]}
                  </span>
                  <ActionsMenu item={a} onDelete={handleDelete} onStatusChange={handleStatusChange} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
