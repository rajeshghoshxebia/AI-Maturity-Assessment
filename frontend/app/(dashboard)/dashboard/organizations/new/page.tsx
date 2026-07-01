"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Building2, GitBranch, Layers } from "lucide-react";
import { api } from "@/lib/api-client";
import { HierarchyBuilder, type LocalUnit } from "@/components/organizations/HierarchyBuilder";
import type { Organization, OrgUnitCreate } from "@/types/organization";

const INDUSTRIES = [
  "Technology", "Financial Services", "Healthcare", "Retail",
  "Manufacturing", "Energy", "Telecommunications", "Government", "Education", "Other",
];

const STEPS = [
  { id: 1, label: "Details", icon: Building2 },
  { id: 2, label: "Hierarchy", icon: GitBranch },
  { id: 3, label: "Review", icon: Layers },
];

function flattenUnits(units: LocalUnit[], parentId: string | null = null): OrgUnitCreate[] {
  const result: OrgUnitCreate[] = [];
  units.forEach((u, i) => {
    result.push({
      name: u.name,
      unit_type: u.unit_type,
      parent_id: parentId ?? undefined,
      sort_order: i,
      competency_codes: u.competency_codes,
    });
    result.push(...flattenUnits(u.children, u.id));
  });
  return result;
}

async function createOrgWithUnits(
  name: string,
  industry: string,
  units: LocalUnit[],
): Promise<string> {
  const org = await api.post<Organization>("/organizations", { name, industry: industry || null });

  // Create units top-down — we need real IDs for parent references
  async function createTree(list: LocalUnit[], parentId: string | null) {
    for (const u of list) {
      const created = await api.post<{ id: string }>(`/organizations/${org.id}/units`, {
        name: u.name,
        unit_type: u.unit_type,
        parent_id: parentId,
        sort_order: u.sort_order,
        competency_codes: u.competency_codes,
      });
      await createTree(u.children, created.id);
    }
  }
  await createTree(units, null);
  return org.id;
}

export default function NewOrganizationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [units, setUnits] = useState<LocalUnit[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const id = await createOrgWithUnits(name.trim(), industry, units);
      router.push(`/dashboard/organizations/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-grey-500 hover:text-grey-800 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="text-xl font-semibold text-grey-900 md:text-2xl">New Organization</h1>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button
              type="button"
              onClick={() => step > s.id && setStep(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                step === s.id
                  ? "bg-velvet text-white"
                  : step > s.id
                    ? "text-velvet hover:bg-velvet/10 cursor-pointer"
                    : "text-grey-400 cursor-default"
              }`}
            >
              <s.icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-grey-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-grey-700 mb-1.5">
              Organization name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              className="w-full px-3 py-2 text-sm border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-velvet/30 focus:border-velvet"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-grey-700 mb-1.5">Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-velvet/30 focus:border-velvet bg-white"
            >
              <option value="">Select industry…</option>
              {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={!name.trim()}
              onClick={() => setStep(2)}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next: Hierarchy
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Hierarchy */}
      {step === 2 && (
        <div className="card p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-grey-900 mb-1">Organization Hierarchy</h2>
            <p className="text-xs text-grey-500">
              Build your org structure — business units, departments, and teams.
              You can always edit this later.
            </p>
          </div>

          <HierarchyBuilder units={units} onChange={setUnits} />

          <div className="flex justify-between pt-2">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button type="button" onClick={() => setStep(3)} className="btn-primary flex items-center gap-2">
              Review
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-grey-900">Review & Create</h2>

          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="text-xs font-medium text-grey-500 w-24 shrink-0 mt-0.5">Name</span>
              <span className="text-sm text-grey-900">{name}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-xs font-medium text-grey-500 w-24 shrink-0 mt-0.5">Industry</span>
              <span className="text-sm text-grey-900">{industry || "—"}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-xs font-medium text-grey-500 w-24 shrink-0 mt-0.5">Units</span>
              <span className="text-sm text-grey-900">{flattenUnits(units).length} units defined</span>
            </div>
          </div>

          {units.length > 0 && (
            <div className="border border-grey-100 rounded-lg p-3 bg-grey-50">
              <p className="text-xs font-medium text-grey-500 mb-2">Hierarchy preview</p>
              <HierarchyPreview units={units} depth={0} />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-between pt-2">
            <button type="button" onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Creating…" : "Create Organization"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HierarchyPreview({ units, depth }: { units: LocalUnit[]; depth: number }) {
  return (
    <div>
      {units.map((u) => (
        <div key={u.id}>
          <div className="flex items-center gap-1.5 py-0.5" style={{ paddingLeft: `${depth * 16}px` }}>
            <span className="text-grey-300 text-xs">{"└─"}</span>
            <span className="text-xs text-grey-700">{u.name}</span>
            <span className="text-xs text-grey-400">({u.unit_type.replace("_", " ").toLowerCase()})</span>
          </div>
          {u.children.length > 0 && <HierarchyPreview units={u.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}
