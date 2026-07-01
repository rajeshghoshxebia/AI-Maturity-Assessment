"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Edit2, Plus, Save, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { HierarchyBuilder, type LocalUnit } from "@/components/organizations/HierarchyBuilder";
import type { Organization, OrgUnit } from "@/types/organization";

const INDUSTRIES = [
  "Technology", "Financial Services", "Healthcare", "Retail",
  "Manufacturing", "Energy", "Telecommunications", "Government", "Education", "Other",
];

function toLocalUnit(u: OrgUnit): LocalUnit {
  return {
    id: u.id,
    parent_id: u.parent_id,
    name: u.name,
    unit_type: u.unit_type,
    sort_order: u.sort_order,
    competency_codes: u.competency_codes,
    children: u.children.map(toLocalUnit),
  };
}

async function syncUnits(orgId: string, next: LocalUnit[], prev: OrgUnit[]) {
  const prevIds = new Set(prev.map((u) => u.id));
  const nextIds = new Set<string>();

  async function processTree(list: LocalUnit[], parentId: string | null) {
    for (let i = 0; i < list.length; i++) {
      const u = list[i];
      nextIds.add(u.id);
      if (u.id.startsWith("new-")) {
        const created = await api.post<{ id: string }>(`/organizations/${orgId}/units`, {
          name: u.name,
          unit_type: u.unit_type,
          parent_id: parentId,
          sort_order: i,
          competency_codes: u.competency_codes,
        });
        await processTree(u.children, created.id);
      } else {
        await api.patch(`/organizations/${orgId}/units/${u.id}`, {
          name: u.name,
          unit_type: u.unit_type,
          parent_id: parentId,
          sort_order: i,
          competency_codes: u.competency_codes,
        });
        await processTree(u.children, u.id);
      }
    }
  }
  await processTree(next, null);

  for (const id of prevIds) {
    if (!nextIds.has(id)) {
      await api.delete(`/organizations/${orgId}/units/${id}`).catch(() => {});
    }
  }
}

function flatPrev(units: OrgUnit[]): OrgUnit[] {
  return units.flatMap((u) => [u, ...flatPrev(u.children)]);
}

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingDetails, setEditingDetails] = useState(false);
  const [editName, setEditName] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [units, setUnits] = useState<LocalUnit[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<Organization>(`/organizations/${id}`)
      .then((o) => {
        setOrg(o);
        setEditName(o.name);
        setEditIndustry(o.industry ?? "");
        setUnits(o.units.map(toLocalUnit));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function saveDetails() {
    if (!org) return;
    setSaving(true);
    try {
      const updated = await api.patch<Organization>(`/organizations/${id}`, {
        name: editName.trim(),
        industry: editIndustry || null,
      });
      setOrg(updated);
      setEditingDetails(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveHierarchy() {
    if (!org) return;
    setSaving(true);
    try {
      const prevFlat = flatPrev(org.units);
      await syncUnits(id, units, prevFlat);
      const updated = await api.get<Organization>(`/organizations/${id}`);
      setOrg(updated);
      setUnits(updated.units.map(toLocalUnit));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteOrg() {
    if (!confirm(`Delete "${org?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/organizations/${id}`);
      router.push("/dashboard/organizations");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-grey-400">Loading…</div>;
  if (error && !org) return <div className="py-20 text-center text-sm text-red-600">{error}</div>;
  if (!org) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/organizations"
          className="flex items-center gap-1.5 text-sm text-grey-500 hover:text-grey-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Organizations
        </Link>
        <button
          onClick={deleteOrg}
          disabled={deleting}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      {/* Details */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-grey-900">{org.name}</h1>
          {!editingDetails && (
            <button
              onClick={() => setEditingDetails(true)}
              className="flex items-center gap-1.5 text-sm text-grey-500 hover:text-velvet transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        {editingDetails ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-grey-700 mb-1.5">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-velvet/30 focus:border-velvet"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-700 mb-1.5">Industry</label>
              <select
                value={editIndustry}
                onChange={(e) => setEditIndustry(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-velvet/30 focus:border-velvet bg-white"
              >
                <option value="">Select industry…</option>
                {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveDetails}
                disabled={saving || !editName.trim()}
                className="btn-primary disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => { setEditName(org.name); setEditIndustry(org.industry ?? ""); setEditingDetails(false); }} className="btn-secondary text-sm">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 text-sm text-grey-500">
            <span>{org.industry ?? "No industry"}</span>
            <span>·</span>
            <span>
              Created {new Date(org.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        )}
      </div>

      {/* Hierarchy */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-grey-900">Organization Hierarchy</h2>
        <HierarchyBuilder units={units} onChange={setUnits} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-between items-center pt-1">
          <Link
            href={`/dashboard/assessments/new?org_id=${id}`}
            className="flex items-center gap-1.5 text-sm text-velvet hover:text-velvet/80 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New assessment for this org
          </Link>
          <button
            onClick={saveHierarchy}
            disabled={saving}
            className="btn-primary disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving…" : "Save hierarchy"}
          </button>
        </div>
      </div>
    </div>
  );
}
