"use client";

import { useState } from "react";
import {
  AlertCircle,
  Building2,
  Download,
  Info,
  Linkedin,
  Loader2,
  Mail,
  Phone,
  Search,
  Sparkles,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import type { Lead, LeadSearchRequest, LeadSearchResponse } from "@/types/lead";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function Chips({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-medium text-grey-500">{label}:</span>
      {items.map((it) => (
        <span
          key={it}
          className="rounded-full bg-grey-100 px-2 py-0.5 text-xs text-grey-700"
        >
          {it}
        </span>
      ))}
    </div>
  );
}

export default function LeadSearchPage() {
  const [businessCase, setBusinessCase] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [limit, setLimit] = useState(25);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LeadSearchResponse | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (businessCase.trim().length < 3) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body: LeadSearchRequest = {
        business_case: businessCase.trim(),
        company_name: companyName.trim() || null,
        limit,
      };
      const res = await api.post<LeadSearchResponse>("/leads/search", body);
      setResult(res);
    } catch (err) {
      const detail =
        err instanceof ApiError && err.body && typeof err.body === "object"
          ? (err.body as { detail?: string }).detail
          : undefined;
      setError(detail ?? (err instanceof Error ? err.message : "Search failed."));
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!result?.leads.length) return;
    setExporting(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/v1/leads/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          leads: result.leads,
          business_case: businessCase.trim(),
          company_name: companyName.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(`Export failed (HTTP ${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-grey-900">Lead Search</h1>
        <p className="mt-1 text-sm text-grey-500">
          Describe your business case — we derive an ideal customer profile and
          find matching people with verified business contact details.
        </p>
      </div>

      {/* Compliance note */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <p>
          Leads come from a licensed B2B data provider ({result?.provider ?? "Apollo"}).
          Contact details are business, provider-verified data — no LinkedIn
          scraping or open-web harvesting of personal information.
        </p>
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        className="space-y-4 rounded-xl border border-grey-200 bg-white p-5 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-grey-700">
            Business case <span className="text-red-500">*</span>
          </label>
          <textarea
            value={businessCase}
            onChange={(e) => setBusinessCase(e.target.value)}
            rows={4}
            required
            placeholder="e.g. We sell an AI governance platform to mid-market financial services firms. We want to reach heads of data, risk and compliance who are starting AI programmes."
            className="w-full rounded-lg border border-grey-200 px-3 py-2 text-sm text-grey-900 placeholder:text-grey-400 focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-grey-700">
              Company name <span className="text-grey-400">(optional)</span>
            </label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Bank"
              className="w-full rounded-lg border border-grey-200 px-3 py-2 text-sm text-grey-900 placeholder:text-grey-400 focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-grey-700">
              Max results
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full rounded-lg border border-grey-200 px-3 py-2 text-sm text-grey-900 focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || businessCase.trim().length < 3}
          className="inline-flex items-center gap-2 rounded-lg bg-velvet px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-velvet/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {loading ? "Searching…" : "Find leads"}
        </button>
      </form>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Derived ICP */}
      {result && (
        <div className="space-y-2 rounded-xl border border-grey-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-grey-800">
            <Sparkles className="h-4 w-4 text-velvet" />
            Derived ideal customer profile
          </div>
          <div className="space-y-1.5">
            <Chips label="Titles" items={result.criteria.job_titles} />
            <Chips label="Seniority" items={result.criteria.seniorities} />
            <Chips label="Industries" items={result.criteria.industries} />
            <Chips label="Locations" items={result.criteria.locations} />
            <Chips label="Keywords" items={result.criteria.keywords} />
            <Chips label="Company size" items={result.criteria.company_headcount} />
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="rounded-xl border border-grey-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-grey-100 px-5 py-3">
            <p className="text-sm text-grey-600">
              <span className="font-semibold text-grey-900">{result.count}</span>{" "}
              lead{result.count === 1 ? "" : "s"} found
            </p>
            <button
              onClick={handleExport}
              disabled={exporting || result.count === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-grey-200 px-3 py-1.5 text-sm font-medium text-grey-700 transition-colors hover:bg-grey-50 disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export to Excel
            </button>
          </div>

          {result.count === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-grey-500">
              No matching leads. Try broadening the business case.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-grey-100 text-left text-xs uppercase tracking-wide text-grey-500">
                    <th className="px-5 py-2.5 font-medium">Name</th>
                    <th className="px-3 py-2.5 font-medium">Company</th>
                    <th className="px-3 py-2.5 font-medium">Location</th>
                    <th className="px-3 py-2.5 font-medium">Email</th>
                    <th className="px-3 py-2.5 font-medium">Phone</th>
                    <th className="px-5 py-2.5 font-medium">Links</th>
                  </tr>
                </thead>
                <tbody>
                  {result.leads.map((lead: Lead, i) => (
                    <tr
                      key={`${lead.full_name}-${i}`}
                      className="border-b border-grey-50 last:border-0 hover:bg-grey-50/50"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-grey-900">
                          {lead.full_name || "—"}
                        </div>
                        <div className="text-xs text-grey-500">{lead.title}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5 text-grey-700">
                          <Building2 className="h-3.5 w-3.5 text-grey-400" />
                          {lead.company || "—"}
                        </div>
                        {lead.industry && (
                          <div className="text-xs text-grey-500">{lead.industry}</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-grey-600">
                        {lead.location || "—"}
                      </td>
                      <td className="px-3 py-3">
                        {lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            className="inline-flex items-center gap-1 text-velvet hover:underline"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            {lead.email}
                          </a>
                        ) : (
                          <span className="text-xs text-grey-400">
                            Not available
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-grey-600">
                        {lead.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-grey-400" />
                            {lead.phone}
                          </span>
                        ) : (
                          <span className="text-xs text-grey-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {lead.linkedin_url ? (
                          <a
                            href={lead.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-grey-400 hover:text-[#0A66C2]"
                            aria-label="LinkedIn profile"
                          >
                            <Linkedin className="h-4 w-4" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
