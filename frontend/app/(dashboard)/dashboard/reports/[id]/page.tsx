"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { ArrowLeft, Download, FileText, Presentation } from "lucide-react";
import { api } from "@/lib/api-client";
import { maturityBadgeClass, formatScore } from "@/lib/utils";
import type { Assessment, ScoreOut } from "@/types/assessment";

const VELVET = "#831B84";
const MATURITY_COLORS: Record<string, string> = {
  Planning: "#94a3b8",
  Experimenting: "#60a5fa",
  Standardizing: "#34d399",
  Scaling: "#a78bfa",
  Optimizing: "#831B84",
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

function maturityColor(label: string) {
  return MATURITY_COLORS[label] ?? VELVET;
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const reportRef = useRef<HTMLDivElement>(null);

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [score, setScore] = useState<ScoreOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Assessment>(`/assessments/${id}`),
      api.get<ScoreOut>(`/assessments/${id}/responses/score`),
    ])
      .then(([a, s]) => { setAssessment(a); setScore(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

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
    if (!score || !assessment) return;
    setExporting(true);
    try {
      const { default: PptxGenJS } = await import("pptxgenjs");
      const prs = new PptxGenJS();
      prs.layout = "LAYOUT_WIDE";
      prs.title = `AI Maturity Report – ${assessment.organization_name}`;

      // Slide 1: Title
      const slide1 = prs.addSlide();
      slide1.background = { color: "150027" };
      slide1.addText(`AI Maturity Assessment`, { x: 0.5, y: 1.2, w: 12, h: 0.8, fontSize: 32, bold: true, color: "FFFFFF", fontFace: "Arial" });
      slide1.addText(assessment.organization_name, { x: 0.5, y: 2.2, w: 12, h: 0.6, fontSize: 22, color: "E0C8E0", fontFace: "Arial" });
      slide1.addText(`Overall Score: ${formatScore(score.overall_score)} / 5.0  ·  ${score.maturity_label}`, {
        x: 0.5, y: 3.0, w: 12, h: 0.5, fontSize: 16, color: "C9A0CA", fontFace: "Arial",
      });
      slide1.addText(`Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, {
        x: 0.5, y: 6.5, w: 12, h: 0.4, fontSize: 11, color: "888888", fontFace: "Arial",
      });

      // Slide 2: Dimension scores table
      const slide2 = prs.addSlide();
      slide2.addText("Dimension Scores", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 22, bold: true, color: "150027", fontFace: "Arial" });
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
      slide2.addTable(rows, { x: 0.5, y: 1.0, w: 12.5, colW: [2.8, 0.8, 1.8, 7.1], fontSize: 11, fontFace: "Arial", border: { pt: 0.5, color: "E2E8F0" } });

      // Slide 3: Key observations
      const slide3 = prs.addSlide();
      slide3.addText("Strengths & Areas for Improvement", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 22, bold: true, color: "150027", fontFace: "Arial" });
      const sorted = [...score.dimensions].sort((a, b) => b.score - a.score);
      const top3 = sorted.slice(0, 3);
      const bottom3 = sorted.slice(-3).reverse();
      slide3.addText("Top performing dimensions", { x: 0.5, y: 1.1, w: 6, h: 0.4, fontSize: 14, bold: true, color: "059669", fontFace: "Arial" });
      top3.forEach((d, i) => {
        slide3.addText(`${i + 1}. ${d.name} — ${formatScore(d.score)} (${d.label})`, { x: 0.7, y: 1.6 + i * 0.5, w: 6, h: 0.4, fontSize: 12, color: "374151", fontFace: "Arial" });
      });
      slide3.addText("Focus areas for improvement", { x: 7, y: 1.1, w: 6, h: 0.4, fontSize: 14, bold: true, color: "DC2626", fontFace: "Arial" });
      bottom3.forEach((d, i) => {
        slide3.addText(`${i + 1}. ${d.name} — ${formatScore(d.score)} (${d.label})`, { x: 7.2, y: 1.6 + i * 0.5, w: 6, h: 0.4, fontSize: 12, color: "374151", fontFace: "Arial" });
      });

      await prs.writeFile({ fileName: `AI-Maturity-Report-${assessment.organization_name}.pptx` });
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-grey-400">Loading report…</div>;
  if (!score || !assessment) return <div className="text-grey-500">No score data available. Complete the assessment first.</div>;

  const radarData = score.dimensions.map((d) => ({ subject: d.name.replace(/ &| and /g, " &\n"), score: d.score, fullMark: 5 }));
  const barData = score.dimensions.map((d) => ({ name: d.name, score: d.score, label: d.label }));
  const sorted = [...score.dimensions].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href={`/dashboard/assessments/${id}`} className="text-grey-400 hover:text-grey-700 mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-semibold text-grey-900">{assessment.organization_name} — Report</h2>
            <p className="text-grey-500 text-sm mt-0.5">AI Maturity Assessment · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportPdf}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-md border border-grey-200 px-3 py-2 text-sm font-medium text-grey-700 hover:bg-grey-50 transition-colors disabled:opacity-50"
          >
            <FileText className="h-4 w-4" /> {exporting ? "Exporting…" : "Export PDF"}
          </button>
          <button
            onClick={exportPpt}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-md bg-velvet px-3 py-2 text-sm font-medium text-white hover:bg-velvet-dark transition-colors disabled:opacity-50"
          >
            <Presentation className="h-4 w-4" /> {exporting ? "Exporting…" : "Export PPT"}
          </button>
        </div>
      </div>

      {/* Printable report body */}
      <div ref={reportRef} className="space-y-6 bg-white">
        {/* Summary banner */}
        <div className="rounded-xl border border-grey-100 bg-gradient-to-r from-[#150027] to-[#2d005a] p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Overall AI Maturity</p>
              <p className="text-5xl font-bold">{formatScore(score.overall_score)}<span className="text-2xl text-white/50 ml-1">/ 5.0</span></p>
              <span className={`maturity-badge mt-2 inline-block ${maturityBadgeClass(score.maturity_label)}`}>
                {score.maturity_label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {score.dimensions.map((d) => (
                <div key={d.code} className="flex items-center justify-between gap-4">
                  <span className="text-white/70 truncate max-w-[140px]">{d.name}</span>
                  <span className="font-semibold text-white">{formatScore(d.score)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Spider chart */}
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

          {/* Bar chart */}
          <div className="card">
            <h3 className="font-semibold text-grey-900 mb-4">Dimension Scores</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: "#9ca3af" }} tickCount={6} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: "#6b7280" }} />
                <Tooltip
                  formatter={(v: number) => [formatScore(v), "Score"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {barData.map((d, i) => (
                    <Cell key={i} fill={maturityColor(d.label)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dimension detail cards */}
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
                {/* Mini progress bar */}
                <div className="h-1.5 rounded-full bg-grey-100 overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(d.score / 5) * 100}%`, backgroundColor: maturityColor(d.label) }} />
                </div>
                <p className="text-xs text-grey-500 leading-relaxed">{DIM_NARRATIVE[d.code]}</p>
                <p className="text-xs text-grey-400 mt-1">{d.response_count} question{d.response_count !== 1 ? "s" : ""} answered</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & focus areas */}
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
