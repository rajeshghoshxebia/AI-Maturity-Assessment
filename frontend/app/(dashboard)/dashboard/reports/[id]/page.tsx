"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  ArrowLeft, ChevronDown, ChevronRight, FileText, Layers, Loader2,
  MessageSquare, Presentation, Sparkles, Users,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { maturityBadgeClass, formatScore } from "@/lib/utils";
import type { Assessment, ScoreOut, HierarchyScoreOut, UnitScoreOut, GenerateReportResponse } from "@/types/assessment";

const VELVET = "#831B84";
const MATURITY_COLORS: Record<string, string> = {
  Initial: "#94a3b8",
  Developing: "#60a5fa",
  Managed: "#34d399",
  Advanced: "#a78bfa",
  Optimized: "#831B84",
};

const DIM_NARRATIVE: Record<string, string> = {
  LEADERSHIP_VISION: "Assesses how clearly AI is embedded in organisational strategy, executive sponsorship, and strategic communications.",
  DATA_INFRASTRUCTURE: "Evaluates data quality, governance, integration pipelines, and readiness to support AI/ML workloads.",
  TECHNOLOGY_STACK: "Reviews the maturity of ML and GenAI tooling, MLOps practices, and infrastructure for model development and deployment.",
  PEOPLE_CULTURE: "Measures AI literacy, talent availability, cross-functional collaboration, and the organisation's learning culture.",
  GOVERNANCE_RISK: "Examines policies, ethical frameworks, compliance controls, and accountability mechanisms for responsible AI.",
  USE_CASE_CLARITY: "Gauges how well the organisation identifies, prioritises, and validates AI use cases against business value.",
  VALUE_ROI: "Tracks how AI investments are measured, the maturity of business cases, and the realisation of quantifiable outcomes.",
};

const UNIT_TYPE_LABEL: Record<string, string> = {
  DIVISION: "Division", DEPARTMENT: "Department", TEAM: "Team",
  BUSINESS_UNIT: "Business Unit", REGION: "Region",
};

type ReportLevel = "ALL" | "BUSINESS_UNIT" | "DEPARTMENT" | "TEAM";
const LEVEL_OPTIONS: { value: ReportLevel; label: string }[] = [
  { value: "ALL", label: "All levels" },
  { value: "BUSINESS_UNIT", label: "Business Unit" },
  { value: "DEPARTMENT", label: "Department" },
  { value: "TEAM", label: "Team" },
];

function maturityColor(label: string) { return MATURITY_COLORS[label] ?? VELVET; }

function flatUnits(units: UnitScoreOut[]): UnitScoreOut[] {
  return units.flatMap((u) => [u, ...flatUnits(u.children)]);
}

// ── Hierarchy tree ────────────────────────────────────────────────────────────

function UnitTreeNode({ unit, depth = 0, filterLevel }: { unit: UnitScoreOut; depth?: number; filterLevel: ReportLevel }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const filteredChildren = filterLevel === "ALL"
    ? unit.children
    : unit.children.filter((c) => c.unit_type === filterLevel || flatUnits(c.children).some((u) => u.unit_type === filterLevel));
  const hasChildren = filteredChildren.length > 0;
  const isHidden = filterLevel !== "ALL" && unit.unit_type !== filterLevel && !hasChildren;
  if (isHidden) return null;

  const dimmed = filterLevel !== "ALL" && unit.unit_type !== filterLevel;

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-md px-3 py-2 transition-colors ${dimmed ? "opacity-50" : ""} ${depth === 0 ? "bg-grey-50" : ""} hover:bg-grey-50 ${hasChildren ? "cursor-pointer" : ""}`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        onClick={() => hasChildren && setExpanded((v) => !v)}
      >
        <span className="shrink-0 w-4">
          {hasChildren
            ? expanded ? <ChevronDown className="h-3.5 w-3.5 text-grey-400" /> : <ChevronRight className="h-3.5 w-3.5 text-grey-400" />
            : <span className="h-3.5 w-3.5 block" />}
        </span>
        <span className="flex-1 text-sm font-medium text-grey-800 truncate">{unit.unit_name}</span>
        <span className="text-xs text-grey-400 hidden sm:inline">{UNIT_TYPE_LABEL[unit.unit_type] ?? unit.unit_type}</span>
        {unit.overall_score > 0 ? (
          <>
            <span className="text-sm font-bold text-grey-900 w-10 text-right">{formatScore(unit.overall_score)}</span>
            <span className={`maturity-badge text-xs w-28 text-center ${maturityBadgeClass(unit.maturity_label)}`}>{unit.maturity_label}</span>
          </>
        ) : (
          <span className="text-xs text-grey-400 italic w-40 text-right">No responses</span>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {filteredChildren.map((child) => (
            <UnitTreeNode key={child.unit_id} unit={child} depth={depth + 1} filterLevel={filterLevel} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const reportRef = useRef<HTMLDivElement>(null);

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [score, setScore] = useState<ScoreOut | null>(null);
  const [hierarchy, setHierarchy] = useState<HierarchyScoreOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reportLevel, setReportLevel] = useState<ReportLevel>("ALL");
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<Assessment>(`/assessments/${id}`),
      api.get<ScoreOut>(`/assessments/${id}/responses/score`),
    ])
      .then(([a, s]) => {
        setAssessment(a);
        setScore(s);
        if (a.per_team && a.org_id) {
          api.get<HierarchyScoreOut>(`/assessments/${id}/responses/score/hierarchy`).then(setHierarchy).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // For per-team assessments, the org-level report is the consolidated average
  // across the hierarchy (BU = avg of departments, dept = avg of teams). Fall
  // back to the flat pooled score for single-team assessments.
  const rep: ScoreOut | null = hierarchy && hierarchy.dimensions.length > 0
    ? { overall_score: hierarchy.overall_score, maturity_label: hierarchy.maturity_label, dimensions: hierarchy.dimensions }
    : score;

  async function generateAINarrative() {
    setGeneratingAI(true);
    setAiError(null);
    try {
      const result = await api.post<GenerateReportResponse>(`/assessments/${id}/generate-report`, {
        include_recommendations: true,
        custom_prompt: useCustomPrompt && customPrompt.trim() ? customPrompt.trim() : undefined,
      });
      setAiNarrative(result.narrative);
    } catch (e: any) {
      setAiError(e?.message ?? "Failed to generate narrative. Check that OPENAI_API_KEY is configured on the backend.");
    } finally {
      setGeneratingAI(false);
    }
  }

  async function exportPdf() {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`AI-Maturity-Report-${assessment?.organization_name ?? id}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  async function exportPpt() {
    if (!rep || !assessment) return;
    const score = rep;
    setExporting(true);
    try {
      const { default: PptxGenJS } = await import("pptxgenjs");
      const prs = new PptxGenJS();
      prs.layout = "LAYOUT_WIDE";
      prs.title = `AI Maturity Report – ${assessment.organization_name}`;

      // Slide 1: Title
      const s1 = prs.addSlide();
      s1.background = { color: "150027" };
      s1.addText("AI Maturity Assessment", { x: 0.5, y: 1.2, w: 12, h: 0.8, fontSize: 32, bold: true, color: "FFFFFF", fontFace: "Arial" });
      s1.addText(assessment.organization_name, { x: 0.5, y: 2.2, w: 12, h: 0.6, fontSize: 22, color: "E0C8E0", fontFace: "Arial" });
      s1.addText(`Overall Score: ${formatScore(score.overall_score)} / 5.0  ·  ${score.maturity_label}`, { x: 0.5, y: 3.0, w: 12, h: 0.5, fontSize: 16, color: "C9A0CA", fontFace: "Arial" });
      s1.addText(`Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, { x: 0.5, y: 6.5, w: 12, h: 0.4, fontSize: 11, color: "888888", fontFace: "Arial" });

      // Slide 2: Organisation context
      if (assessment.org_context?.trim()) {
        const s2 = prs.addSlide();
        s2.addText("Organisation Context", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 22, bold: true, color: "150027", fontFace: "Arial" });
        s2.addShape("rect", { x: 0.5, y: 1.0, w: 12.5, h: 0.05, fill: { color: "831B84" } });
        s2.addText(assessment.org_context, { x: 0.5, y: 1.3, w: 12.5, h: 5.5, fontSize: 12, color: "374151", fontFace: "Arial", valign: "top", wrap: true });
      }

      // Slide 3: AI Narrative (if generated)
      if (aiNarrative) {
        const s3 = prs.addSlide();
        s3.addText("Summary (AI generated)", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 22, bold: true, color: "150027", fontFace: "Arial" });
        s3.addShape("rect", { x: 0.5, y: 1.0, w: 12.5, h: 0.05, fill: { color: "831B84" } });
        s3.addText(aiNarrative.slice(0, 2000), { x: 0.5, y: 1.3, w: 12.5, h: 5.5, fontSize: 10, color: "374151", fontFace: "Arial", valign: "top", wrap: true });
      }

      // Slide 4: Consultant notes
      if (assessment.notes?.trim()) {
        const s4 = prs.addSlide();
        s4.addText("Consultant Notes", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 22, bold: true, color: "150027", fontFace: "Arial" });
        s4.addShape("rect", { x: 0.5, y: 1.0, w: 12.5, h: 0.05, fill: { color: "831B84" } });
        s4.addText(assessment.notes, { x: 0.5, y: 1.3, w: 12.5, h: 5.5, fontSize: 13, color: "374151", fontFace: "Arial", valign: "top", wrap: true });
      }

      // Slide 5: Dimension scores table
      const s5 = prs.addSlide();
      s5.addText("Dimension Scores", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 22, bold: true, color: "150027", fontFace: "Arial" });
      const rows: any[] = [
        [
          { text: "Dimension", options: { bold: true, color: "FFFFFF", fill: { color: "831B84" } } },
          { text: "Score", options: { bold: true, color: "FFFFFF", fill: { color: "831B84" } } },
          { text: "Maturity Level", options: { bold: true, color: "FFFFFF", fill: { color: "831B84" } } },
          { text: "Description", options: { bold: true, color: "FFFFFF", fill: { color: "831B84" } } },
        ],
        ...score.dimensions.map((d) => [
          { text: d.name },
          { text: formatScore(d.score), options: { bold: true } },
          { text: d.label },
          { text: DIM_NARRATIVE[d.code] ?? "" },
        ]),
      ];
      s5.addTable(rows, { x: 0.5, y: 1.0, w: 12.5, colW: [2.8, 0.8, 1.8, 7.1], fontSize: 11, fontFace: "Arial", border: { pt: 0.5, color: "E2E8F0" } });

      // Slide 6: Strengths & focus areas
      const s6 = prs.addSlide();
      s6.addText("Strengths & Improvement Areas", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 22, bold: true, color: "150027", fontFace: "Arial" });
      const sortedDims = [...score.dimensions].sort((a, b) => b.score - a.score);
      s6.addText("Top performing", { x: 0.5, y: 1.1, w: 6, h: 0.4, fontSize: 14, bold: true, color: "059669", fontFace: "Arial" });
      sortedDims.slice(0, 3).forEach((d, i) => {
        s6.addText(`${i + 1}. ${d.name} — ${formatScore(d.score)} (${d.label})`, { x: 0.7, y: 1.6 + i * 0.5, w: 6, h: 0.4, fontSize: 12, color: "374151", fontFace: "Arial" });
      });
      s6.addText("Focus areas", { x: 7, y: 1.1, w: 6, h: 0.4, fontSize: 14, bold: true, color: "DC2626", fontFace: "Arial" });
      [...sortedDims].reverse().slice(0, 3).forEach((d, i) => {
        s6.addText(`${i + 1}. ${d.name} — ${formatScore(d.score)} (${d.label})`, { x: 7.2, y: 1.6 + i * 0.5, w: 6, h: 0.4, fontSize: 12, color: "374151", fontFace: "Arial" });
      });

      // Slide 7: Team breakdown (if hierarchy)
      if (hierarchy) {
        const allTeams = flatUnits(hierarchy.units).filter((u) => u.overall_score > 0);
        if (allTeams.length > 0) {
          const s7 = prs.addSlide();
          s7.addText("Team Maturity Breakdown", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 22, bold: true, color: "150027", fontFace: "Arial" });
          const teamRows: any[] = [
            [
              { text: "Team / Unit", options: { bold: true, color: "FFFFFF", fill: { color: "831B84" } } },
              { text: "Type", options: { bold: true, color: "FFFFFF", fill: { color: "831B84" } } },
              { text: "Score", options: { bold: true, color: "FFFFFF", fill: { color: "831B84" } } },
              { text: "Maturity Level", options: { bold: true, color: "FFFFFF", fill: { color: "831B84" } } },
            ],
            ...allTeams.map((u) => [
              { text: u.unit_name },
              { text: UNIT_TYPE_LABEL[u.unit_type] ?? u.unit_type },
              { text: formatScore(u.overall_score), options: { bold: true } },
              { text: u.maturity_label },
            ]),
          ];
          s7.addTable(teamRows, { x: 0.5, y: 1.0, w: 12.5, colW: [5, 2, 1.5, 4], fontSize: 11, fontFace: "Arial", border: { pt: 0.5, color: "E2E8F0" } });
        }
      }

      await prs.writeFile({ fileName: `AI-Maturity-Report-${assessment.organization_name}.pptx` });
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-grey-400">Loading report…</div>;
  if (!rep || !assessment) return <div className="text-grey-500">No score data available. Complete the assessment first.</div>;

  const consolidated = hierarchy && hierarchy.dimensions.length > 0;
  const radarData = rep.dimensions.map((d) => ({ subject: d.name.replace(/ &| and /g, " &\n"), score: d.score, fullMark: 5 }));
  const barData = rep.dimensions.map((d) => ({ name: d.name, score: d.score, label: d.label }));
  const sorted = [...rep.dimensions].sort((a, b) => b.score - a.score);

  // Team comparison — filtered by level
  const allHierarchyUnits = hierarchy ? flatUnits(hierarchy.units).filter((u) => u.overall_score > 0) : [];
  const visibleTeams = reportLevel === "ALL"
    ? allHierarchyUnits
    : allHierarchyUnits.filter((u) => u.unit_type === reportLevel);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <Link href={`/dashboard/assessments/${id}`} className="text-grey-400 hover:text-grey-700 mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-semibold text-grey-900">{assessment.organization_name} — Report</h2>
            <p className="text-grey-500 text-sm mt-0.5">AI Maturity Assessment · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Level filter — only show when hierarchy has data */}
          {hierarchy && allHierarchyUnits.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-grey-200 p-1 bg-white">
              <Layers className="h-3.5 w-3.5 text-grey-400 ml-1 shrink-0" />
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setReportLevel(opt.value)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    reportLevel === opt.value ? "bg-velvet text-white" : "text-grey-600 hover:bg-grey-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={exportPdf}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-md border border-grey-200 px-3 py-2 text-sm font-medium text-grey-700 hover:bg-grey-50 transition-colors disabled:opacity-50"
          >
            <FileText className="h-4 w-4" /> {exporting ? "Exporting…" : "PDF"}
          </button>
          <button
            onClick={exportPpt}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-md bg-velvet px-3 py-2 text-sm font-medium text-white hover:bg-velvet-dark transition-colors disabled:opacity-50"
          >
            <Presentation className="h-4 w-4" /> {exporting ? "Exporting…" : "PPT"}
          </button>
        </div>
      </div>

      {/* Printable body */}
      <div ref={reportRef} className="space-y-6 bg-white">

        {/* Summary banner */}
        <div className="rounded-xl border border-grey-100 bg-gradient-to-r from-[#150027] to-[#2d005a] p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-widest mb-1">
                Overall AI Maturity{consolidated ? " · consolidated" : ""}
              </p>
              <p className="text-5xl font-bold">{formatScore(rep.overall_score)}<span className="text-2xl text-white/50 ml-1">/ 5.0</span></p>
              <span className={`maturity-badge mt-2 inline-block ${maturityBadgeClass(rep.maturity_label)}`}>{rep.maturity_label}</span>
              {consolidated && (
                <p className="text-white/50 text-xs mt-2 max-w-xs">Averaged across the organisation hierarchy — each business unit, department, and team weighted equally.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {rep.dimensions.map((d) => (
                <div key={d.code} className="flex items-center justify-between gap-4">
                  <span className="text-white/70 truncate max-w-[140px]">{d.name}</span>
                  <span className="font-semibold text-white">{formatScore(d.score)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Organisation context */}
        {assessment.org_context?.trim() && (
          <div className="rounded-xl border border-grey-200 bg-grey-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-4 w-4 text-grey-500 shrink-0" />
              <h3 className="font-semibold text-grey-700">Organisation Context</h3>
            </div>
            <p className="text-sm text-grey-600 leading-relaxed whitespace-pre-wrap">{assessment.org_context}</p>
          </div>
        )}

        {/* Summary (AI generated) */}
        <div className="rounded-xl border border-velvet/20 bg-white p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-velvet shrink-0" />
              <h3 className="font-semibold text-velvet">Summary (AI generated)</h3>
              {aiNarrative && <span className="text-xs text-grey-400 font-normal">· generated by GPT-4o</span>}
            </div>
            <button
              onClick={generateAINarrative}
              disabled={generatingAI}
              className="inline-flex items-center gap-1.5 rounded-md bg-velvet px-3 py-1.5 text-xs font-medium text-white hover:bg-velvet-dark transition-colors disabled:opacity-60"
            >
              {generatingAI ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</> : <><Sparkles className="h-3.5 w-3.5" /> {aiNarrative ? "Regenerate" : "Generate summary"}</>}
            </button>
          </div>

          {/* Custom prompt / template */}
          <div className="mb-3 rounded-lg border border-grey-200 bg-grey-50/60 p-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={useCustomPrompt}
                onClick={() => setUseCustomPrompt((v) => !v)}
                className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-velvet/40 ${useCustomPrompt ? "bg-velvet" : "bg-grey-300"}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${useCustomPrompt ? "translate-x-4" : "translate-x-0"}`} />
              </button>
              <div className="min-w-0">
                <p className="text-sm font-medium text-grey-800">Use my own prompt / template</p>
                <p className="text-xs text-grey-500 mt-0.5">Curate the summary your way. Scores, question responses and consultant comments are always supplied to the model — your prompt controls tone and structure.</p>
              </div>
            </label>
            {useCustomPrompt && (
              <textarea
                rows={5}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={"e.g. Write a 1-page executive brief for the board. Lead with the 3 biggest risks, then quick wins for the next quarter. Keep it under 400 words, plain language, no jargon."}
                className="mt-3 w-full rounded-md border border-grey-300 px-3 py-2 text-sm resize-y focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet"
              />
            )}
          </div>

          {aiError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{aiError}</div>
          )}
          {aiNarrative ? (
            <div className="prose prose-sm max-w-none text-grey-700 whitespace-pre-wrap leading-relaxed text-sm">{aiNarrative}</div>
          ) : (
            !aiError && (
              <p className="text-sm text-grey-400 italic">
                Click "Generate summary" to create a curated summary based on the assessment scores, individual question responses and consultant comments
                {assessment.org_context ? ", organisation context" : ""}{assessment.notes ? ", and consultant notes" : ""}.
              </p>
            )
          )}
        </div>

        {/* Consultant notes */}
        {assessment.notes?.trim() && (
          <div className="rounded-xl border border-velvet/20 bg-velvet/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-velvet shrink-0" />
              <h3 className="font-semibold text-velvet">Consultant Notes</h3>
            </div>
            <p className="text-sm text-grey-700 whitespace-pre-wrap leading-relaxed">{assessment.notes}</p>
          </div>
        )}

        {/* Hierarchy overview */}
        {hierarchy && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-velvet shrink-0" />
              <h3 className="font-semibold text-grey-900">Organisation Hierarchy & Team Scores</h3>
              <span className="ml-auto text-xs text-grey-400">{hierarchy.org_name}{hierarchy.org_industry ? ` · ${hierarchy.org_industry}` : ""}</span>
            </div>
            <div className="divide-y divide-grey-100 -mx-4 sm:-mx-6">
              {hierarchy.units.map((unit) => (
                <UnitTreeNode key={unit.unit_id} unit={unit} depth={0} filterLevel={reportLevel} />
              ))}
            </div>
            {hierarchy.units.length === 0 && <p className="text-sm text-grey-400 italic text-center py-4">No teams scored yet.</p>}
          </div>
        )}

        {/* Team comparison bar chart */}
        {visibleTeams.length > 1 && (
          <div className="card">
            <h3 className="font-semibold text-grey-900 mb-1">
              Team Comparison
              {reportLevel !== "ALL" && <span className="ml-2 text-xs font-normal text-grey-400">({LEVEL_OPTIONS.find((o) => o.value === reportLevel)?.label})</span>}
            </h3>
            <ResponsiveContainer width="100%" height={Math.max(200, visibleTeams.length * 40)}>
              <BarChart
                data={visibleTeams.map((u) => ({ name: u.unit_name, score: u.overall_score, label: u.maturity_label }))}
                layout="vertical"
                margin={{ top: 0, right: 60, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: "#9ca3af" }} tickCount={6} />
                <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11, fill: "#6b7280" }} />
                <Tooltip formatter={(v: number) => [formatScore(v), "Score"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {visibleTeams.map((u, i) => <Cell key={i} fill={maturityColor(u.maturity_label)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="font-semibold text-grey-900 mb-4">Maturity Spider Chart</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10, fill: "#9ca3af" }} tickCount={6} />
                <Radar name="Score" dataKey="score" stroke={VELVET} fill={VELVET} fillOpacity={0.25} strokeWidth={2} dot={{ r: 4, fill: VELVET }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="font-semibold text-grey-900 mb-4">Dimension Scores</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: "#9ca3af" }} tickCount={6} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: "#6b7280" }} />
                <Tooltip formatter={(v: number) => [formatScore(v), "Score"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {barData.map((d, i) => <Cell key={i} fill={maturityColor(d.label)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dimension cards */}
        <div>
          <h3 className="font-semibold text-grey-900 mb-3">Dimension Analysis</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sorted.map((d) => (
              <div key={d.code} className="rounded-lg border border-grey-100 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-medium text-grey-900 text-sm">{d.name}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xl font-bold text-grey-900">{formatScore(d.score)}</span>
                    <span className={`maturity-badge text-xs ${maturityBadgeClass(d.label)}`}>{d.label}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-grey-100 overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(d.score / 5) * 100}%`, backgroundColor: maturityColor(d.label) }} />
                </div>
                <p className="text-xs text-grey-500 leading-relaxed">{DIM_NARRATIVE[d.code]}</p>
                <p className="text-xs text-grey-400 mt-1">{d.response_count} question{d.response_count !== 1 ? "s" : ""} answered</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & focus */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="card border-green-100">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> Top performing dimensions
            </h4>
            <ol className="space-y-2">
              {sorted.slice(0, 3).map((d, i) => (
                <li key={d.code} className="flex items-center gap-3 text-sm">
                  <span className="text-xs font-mono text-grey-400 w-4">{i + 1}.</span>
                  <span className="text-grey-800">{d.name}</span>
                  <span className="ml-auto font-semibold text-grey-900">{formatScore(d.score)}</span>
                  <span className={`maturity-badge text-xs ${maturityBadgeClass(d.label)}`}>{d.label}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="card border-red-100">
            <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-400 inline-block" /> Focus areas for improvement
            </h4>
            <ol className="space-y-2">
              {[...sorted].reverse().slice(0, 3).map((d, i) => (
                <li key={d.code} className="flex items-center gap-3 text-sm">
                  <span className="text-xs font-mono text-grey-400 w-4">{i + 1}.</span>
                  <span className="text-grey-800">{d.name}</span>
                  <span className="ml-auto font-semibold text-grey-900">{formatScore(d.score)}</span>
                  <span className={`maturity-badge text-xs ${maturityBadgeClass(d.label)}`}>{d.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
