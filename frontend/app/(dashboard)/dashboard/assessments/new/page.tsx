"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api-client";
import type { AssessmentMode } from "@/types/assessment";
import type { Organization } from "@/types/organization";

const SUBCATEGORIES = [
  { code: "DATA_STACK", label: "Data Tech Stack", desc: "Data quality, integration, governance" },
  { code: "ML_STACK", label: "ML Tech Stack", desc: "MLOps, pipelines, model lifecycle" },
  { code: "GENAI_STACK", label: "GenAI Tech Stack", desc: "LLMOps, RAG, safety controls" },
];

export default function NewAssessmentPage() {
  return (
    <Suspense>
      <NewAssessmentForm />
    </Suspense>
  );
}

function NewAssessmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillOrgId = searchParams.get("org_id");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedOrg, setLinkedOrg] = useState<Organization | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [form, setForm] = useState({
    organization_name: "",
    mode: "CONSULTANT" as AssessmentMode,
    notes: "",
    active_subcategory_codes: [] as string[],
  });

  useEffect(() => {
    if (!prefillOrgId) return;
    api.get<Organization>(`/organizations/${prefillOrgId}`)
      .then((org) => {
        setLinkedOrg(org);
        setForm((f) => ({ ...f, organization_name: org.name }));
      })
      .catch(() => {});
  }, [prefillOrgId]);

  function toggleSub(code: string) {
    setForm((f) => ({
      ...f,
      active_subcategory_codes: f.active_subcategory_codes.includes(code)
        ? f.active_subcategory_codes.filter((c) => c !== code)
        : [...f.active_subcategory_codes, code],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.organization_name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const assessment = await api.post<{ id: string }>("/assessments", {
        ...form,
        org_id: prefillOrgId ?? undefined,
        org_unit_id: selectedUnitId || undefined,
      });
      router.push(`/dashboard/assessments/${assessment.id}`);
    } catch {
      setError("Failed to create assessment. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/assessments" className="text-grey-400 hover:text-grey-700 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-grey-900">New Assessment</h2>
          <p className="text-grey-500 text-sm mt-0.5">Configure a new AI maturity assessment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Organisation name */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-grey-700">Organisation name *</label>
          <input
            type="text"
            required
            value={form.organization_name}
            onChange={(e) => setForm((f) => ({ ...f, organization_name: e.target.value }))}
            placeholder="e.g. Acme Corporation"
            className="w-full rounded-md border border-grey-300 px-3 py-2 text-sm focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet"
          />
        </div>

        {/* Linked org / team */}
        {linkedOrg && (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-grey-700">Team / Unit</label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full rounded-md border border-grey-300 px-3 py-2 text-sm focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet bg-white"
            >
              <option value="">Whole organization</option>
              {flatUnits(linkedOrg.units).map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Mode */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-grey-700">Assessment mode</label>
          <div className="flex gap-3">
            {(["CONSULTANT", "SURVEY"] as AssessmentMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setForm((f) => ({ ...f, mode }))}
                className={`flex-1 rounded-md border px-4 py-3 text-sm text-left transition-colors ${
                  form.mode === mode
                    ? "border-velvet bg-velvet-subtle text-velvet font-medium"
                    : "border-grey-200 text-grey-600 hover:border-grey-300"
                }`}
              >
                <div className="font-medium capitalize">{mode.toLowerCase()}</div>
                <div className="text-xs mt-0.5 text-grey-500">
                  {mode === "CONSULTANT"
                    ? "One person fills in all dimensions"
                    : "Multiple stakeholders per dimension"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Technology sub-categories */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-grey-700">
            Technology sub-categories
            <span className="ml-1.5 text-xs font-normal text-grey-400">(all off by default)</span>
          </label>
          <div className="space-y-2">
            {SUBCATEGORIES.map(({ code, label, desc }) => {
              const active = form.active_subcategory_codes.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleSub(code)}
                  className={`w-full flex items-center gap-3 rounded-md border px-4 py-3 text-sm text-left transition-colors ${
                    active
                      ? "border-velvet bg-velvet-subtle"
                      : "border-grey-200 hover:border-grey-300"
                  }`}
                >
                  <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${
                    active ? "border-velvet bg-velvet" : "border-grey-300"
                  }`}>
                    {active && (
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className={`font-medium ${active ? "text-velvet" : "text-grey-800"}`}>{label}</div>
                    <div className="text-xs text-grey-500 mt-0.5">{desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-grey-700">Notes <span className="text-grey-400 font-normal">(optional)</span></label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Context, scope, or instructions for this assessment…"
            className="w-full rounded-md border border-grey-300 px-3 py-2 text-sm resize-none focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/dashboard/assessments"
            className="rounded-md px-4 py-2 text-sm font-medium text-grey-600 hover:bg-grey-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !form.organization_name.trim()}
            className="rounded-md bg-velvet px-4 py-2 text-sm font-medium text-white hover:bg-velvet-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create Assessment"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

function flatUnits(units: Organization["units"]): Organization["units"] {
  return units.flatMap((u) => [u, ...flatUnits(u.children)]);
}
