"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface CompetencyLevel { level: number; description: string; }
interface Question { id: string; text: string; order: number; levels: CompetencyLevel[]; subcategory_id: string | null; }
interface Dimension { id: string; code: string; name: string; tag: string; questions: Question[]; }
interface SurveyMeta {
  assessment_id: string;
  organization_name: string;
  invitee_name: string | null;
  invitee_email: string;
  status: string;
  dimensions: Dimension[];
}

type ScoreMap = Record<string, number>;
type ObsMap = Record<string, string>;

export default function SurveyPage() {
  const { token } = useParams<{ token: string }>();
  const [meta, setMeta] = useState<SurveyMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<ScoreMap>({});
  const [obs, setObs] = useState<ObsMap>({});
  const [openDim, setOpenDim] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/v1/survey/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Survey link not found." : r.status === 410 ? "This survey link has been revoked." : "Failed to load survey.");
        return r.json();
      })
      .then((data: SurveyMeta) => {
        if (data.status === "COMPLETED") { setSubmitted(true); }
        setMeta(data);
        if (data.dimensions.length) setOpenDim(data.dimensions[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit() {
    if (!meta) return;
    const payload = Object.entries(scores).map(([question_id, score]) => ({
      question_id,
      score,
      observations: obs[question_id] || undefined,
    }));
    if (payload.length === 0) { alert("Please score at least one question before submitting."); return; }
    setSubmitting(true);
    try {
      const r = await fetch(`${BASE}/api/v1/survey/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: payload }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.detail ?? "Submission failed");
      }
      setSubmitted(true);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-grey-400">Loading survey…</div>;
  if (error) return <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-red-700 text-sm">{error}</div>;
  if (!meta) return null;

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-semibold text-grey-900">Thank you!</h2>
        <p className="text-grey-500 max-w-sm">Your responses for <strong>{meta.organization_name}</strong> have been recorded. You may close this window.</p>
      </div>
    );
  }

  const totalQ = meta.dimensions.reduce((s, d) => s + d.questions.length, 0);
  const answered = Object.keys(scores).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-[#150027] p-6 text-white">
        <p className="text-white/60 text-sm mb-1">AI Maturity Assessment</p>
        <h1 className="text-2xl font-bold">{meta.organization_name}</h1>
        {meta.invitee_name && <p className="text-white/70 text-sm mt-1">For {meta.invitee_name} · {meta.invitee_email}</p>}
        <p className="text-white/60 text-xs mt-3 leading-relaxed">
          Please score each question from 1 (not started) to 5 (optimised). Answer only the areas you have direct knowledge of — partial responses are welcome.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-grey-200 overflow-hidden">
          <div className="h-full rounded-full bg-[#831B84] transition-all" style={{ width: `${totalQ ? (answered / totalQ) * 100 : 0}%` }} />
        </div>
        <span className="text-sm text-grey-500 shrink-0">{answered} / {totalQ} answered</span>
      </div>

      {/* Dimensions */}
      <div className="space-y-2">
        {meta.dimensions.map((dim) => {
          const open = openDim === dim.id;
          const dimAnswered = dim.questions.filter((q) => scores[q.id]).length;
          return (
            <div key={dim.id} className="rounded-xl border border-grey-200 bg-white overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenDim(open ? null : dim.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-grey-50 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  {dimAnswered === dim.questions.length && dim.questions.length > 0
                    ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    : <span className="h-5 w-5 rounded-full border-2 border-grey-300 shrink-0" />}
                  <div>
                    <p className="font-medium text-grey-900 text-sm">{dim.name}</p>
                    <p className="text-xs text-grey-500 mt-0.5">{dim.tag} · {dimAnswered}/{dim.questions.length} answered</p>
                  </div>
                </div>
                {open ? <ChevronUp className="h-4 w-4 text-grey-400" /> : <ChevronDown className="h-4 w-4 text-grey-400" />}
              </button>

              {open && (
                <div className="border-t border-grey-100 divide-y divide-grey-50">
                  {dim.questions.map((q, qi) => {
                    const current = scores[q.id] ?? 0;
                    return (
                      <div key={q.id} className="px-5 py-5">
                        <div className="flex gap-3 mb-3">
                          <span className="text-xs font-mono text-grey-400 mt-0.5 shrink-0">Q{qi + 1}</span>
                          <p className="text-sm text-grey-800 font-medium">{q.text}</p>
                        </div>
                        <div className="flex gap-2 mb-3 ml-6 flex-wrap">
                          {[1, 2, 3, 4, 5].map((lvl) => {
                            const level = q.levels?.find((l) => l.level === lvl);
                            const selected = current === lvl;
                            return (
                              <button
                                key={lvl}
                                onClick={() => setScores((s) => ({ ...s, [q.id]: lvl }))}
                                title={level?.description}
                                className={`group relative flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                                  selected ? "border-[#831B84] bg-[#831B84] text-white" : "border-grey-200 text-grey-500 hover:border-[#831B84] hover:text-[#831B84]"
                                }`}
                              >
                                {lvl}
                                {level && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-60 rounded-md bg-grey-900 px-3 py-2 text-xs text-white shadow-lg z-10 text-left">
                                    <p className="font-semibold mb-1">Level {lvl}</p>
                                    {level.description}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                          {current > 0 && (
                            <span className="self-center text-xs text-grey-500 ml-1 max-w-[200px] truncate">
                              {q.levels?.find((l) => l.level === current)?.description?.slice(0, 55)}…
                            </span>
                          )}
                        </div>
                        {current > 0 && (
                          <div className="ml-6">
                            <textarea
                              rows={2}
                              value={obs[q.id] ?? ""}
                              onChange={(e) => setObs((o) => ({ ...o, [q.id]: e.target.value }))}
                              placeholder="Observations / evidence (optional)"
                              className="w-full rounded-md border border-grey-200 px-3 py-2 text-xs resize-none focus:border-[#831B84] focus:outline-none focus:ring-1 focus:ring-[#831B84] text-grey-700 placeholder:text-grey-400"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit */}
      <div className="sticky bottom-4">
        <button
          onClick={handleSubmit}
          disabled={submitting || answered === 0}
          className="w-full rounded-xl bg-[#831B84] py-4 text-sm font-semibold text-white hover:bg-[#6b1470] transition-colors disabled:opacity-50 shadow-lg"
        >
          {submitting ? "Submitting…" : `Submit ${answered} response${answered !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
