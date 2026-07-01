"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import type { OrganizationListItem } from "@/types/organization";

const INDUSTRIES = [
  "Technology", "Financial Services", "Healthcare", "Retail",
  "Manufacturing", "Energy", "Telecommunications", "Government", "Education", "Other",
];

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

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Content */}
      <div className="card p-0 overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-20 text-grey-400 text-sm">
            Loading organizations…
          </div>
        )}

        {error && (
          <div className="p-6 text-sm text-red-600">{error}</div>
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

        {!loading && !error && orgs.length > 0 && (
          <>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="border-b border-grey-100 bg-grey-50">
                  <th className="text-left px-6 py-3 font-medium text-grey-500 text-xs uppercase tracking-wide">Organization</th>
                  <th className="text-left px-6 py-3 font-medium text-grey-500 text-xs uppercase tracking-wide">Industry</th>
                  <th className="text-left px-6 py-3 font-medium text-grey-500 text-xs uppercase tracking-wide">Teams</th>
                  <th className="text-left px-6 py-3 font-medium text-grey-500 text-xs uppercase tracking-wide">Created</th>
                  <th className="px-6 py-3" />
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
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/organizations/${org.id}`} className="btn-secondary text-xs px-3 py-1.5">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-grey-100">
              {orgs.map((org) => (
                <Link
                  key={org.id}
                  href={`/dashboard/organizations/${org.id}`}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-grey-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-grey-900 truncate">{org.name}</p>
                    <p className="text-xs text-grey-500 mt-0.5">
                      {org.industry ?? "No industry"} · {org.unit_count} {org.unit_count === 1 ? "team" : "teams"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-grey-400 ml-3 shrink-0" />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
