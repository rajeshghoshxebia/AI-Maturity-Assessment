"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Check, ChevronRight, MoreHorizontal, Plus, Trash2, X } from "lucide-react";
import { api } from "@/lib/api-client";
import type { OrganizationListItem } from "@/types/organization";

function OrgActionsMenu({ org, onDelete }: { org: OrganizationListItem; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); setConfirmDelete(false); }}
        className="p-1.5 rounded-md text-grey-400 hover:text-grey-700 hover:bg-grey-100 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setConfirmDelete(false); }} />
          <div className="absolute right-0 top-8 z-20 w-44 rounded-lg border border-grey-200 bg-white shadow-elevated py-1 text-sm">
            <Link
              href={`/dashboard/organizations/${org.id}`}
              className="flex items-center gap-2 px-3 py-2 text-grey-700 hover:bg-grey-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              View / Edit
            </Link>
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
                <p className="text-xs text-grey-600 mb-2">Delete this org?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onDelete(org.id); setOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-1 rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                  >
                    <Check className="h-3 w-3" /> Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-md border border-grey-200 px-2 py-1 text-xs text-grey-600 hover:bg-grey-50"
                  >
                    <X className="h-3 w-3" /> No
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

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<OrganizationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<OrganizationListItem[]>("/organizations")
      .then(setOrgs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    try {
      await api.delete(`/organizations/${id}`);
      setOrgs((prev) => prev.filter((o) => o.id !== id));
    } catch {
      setError("Failed to delete organisation.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-grey-900 md:text-2xl">Organizations</h1>
          <p className="text-sm text-grey-500 mt-0.5">Manage client organizations and their team hierarchies</p>
        </div>
        <Link
          href="/dashboard/organizations/new"
          className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          New Organization
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="card p-0">
        {loading && (
          <div className="flex items-center justify-center py-20 text-grey-400 text-sm">
            Loading organizations…
          </div>
        )}

        {!loading && !error && orgs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Building2 className="h-10 w-10 text-grey-200" />
            <p className="text-grey-400 text-sm">No organizations yet</p>
            <Link href="/dashboard/organizations/new" className="btn-primary text-sm">
              Create your first organization
            </Link>
          </div>
        )}

        {!loading && orgs.length > 0 && (
          <>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="border-b border-grey-100 bg-grey-50">
                  <th className="text-left px-6 py-3 font-medium text-grey-500 text-xs uppercase tracking-wide rounded-tl-lg">Organization</th>
                  <th className="text-left px-6 py-3 font-medium text-grey-500 text-xs uppercase tracking-wide">Industry</th>
                  <th className="text-left px-6 py-3 font-medium text-grey-500 text-xs uppercase tracking-wide">Teams</th>
                  <th className="text-left px-6 py-3 font-medium text-grey-500 text-xs uppercase tracking-wide">Created</th>
                  <th className="px-6 py-3 w-28 rounded-tr-lg" />
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-100">
                {orgs.map((org) => (
                  <tr key={org.id} className="hover:bg-grey-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-grey-900">{org.name}</td>
                    <td className="px-6 py-4 text-grey-500">{org.industry ?? "—"}</td>
                    <td className="px-6 py-4 text-grey-500">{org.unit_count}</td>
                    <td className="px-6 py-4 text-grey-500">
                      {new Date(org.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/organizations/${org.id}`} className="btn-secondary text-xs px-3 py-1.5">
                          View
                        </Link>
                        <OrgActionsMenu org={org} onDelete={handleDelete} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-grey-100">
              {orgs.map((org) => (
                <div key={org.id} className="flex items-center justify-between px-4 py-3.5">
                  <Link href={`/dashboard/organizations/${org.id}`} className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-grey-900 truncate">{org.name}</p>
                    <p className="text-xs text-grey-500 mt-0.5">
                      {org.industry ?? "No industry"} · {org.unit_count} {org.unit_count === 1 ? "team" : "teams"}
                    </p>
                  </Link>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <ChevronRight className="h-4 w-4 text-grey-400" />
                    <OrgActionsMenu org={org} onDelete={handleDelete} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
