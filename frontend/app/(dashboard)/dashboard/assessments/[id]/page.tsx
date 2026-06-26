"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, ChevronDown, ChevronUp, BarChart2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { maturityBadgeClass, formatScore } from "@/lib/utils";
import type { Assessment, Dimension, ResponseOut, ScoreOut, ResponseUpsert } from "@/types/assessment";

export default function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [responses, setResponses] = useState<Record<string, ResponseOut>>({});
  const [score, setScore] = useState<ScoreOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDim, setActiveDim] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, { score: number; observations: string }>>({});

  useEffect(() => {
    Promise.all([
      api.get<Assessment>(`/assessments/${id}`),
      api.get<Dimension[]>("/dimensions"),
      api.get<ResponseOut[]>(`/assessments/${id}/responses`),
      api.get<ScoreOut>(`/assessments/${id}/responses/score`).catch(() => null),
    ]).then(([a, dims, resps, existingScore]) => {
      setAssessment(a);
      const activeCodes = new Set(a.active_subcategories.map((s) => s.code));
      const filtered = dims.map((d) => {
        if (d.code === "TECHNOLOGY_STACK") {
          return {
            ...d,
            questions: d.questions.filter((q) => q.subcategory_id && activeCodes.has(
              d.subcategories.find((s) => s.id === q.subcategory_id)?.code ?? ""
            )),
          };
        }
        return d;
      }).filter((d) => d.code !== "TECHNOLOGY_STACK" || d.questions.length > 0);
      setDimensions(filtered);
      const rMap: Record<string, ResponseOut> = {};
      for (const r of resps) rMap[r.question_id] = r;
      setResponses(rMap);
      if (filtered.length > 0) setActiveDim(filtered[0].id);
      if (existingScore) setScore(existingScore);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  async function loadScore() {
    try {
      const s = await api.get<ScoreOut>(`/assessments/${id}/responses/score`);
      setScore(s);
    } catch {}
  }

  async function saveResponses() {
    if (Object.keys(pending).length === 0) return;
    setSaving(true);
    try {
      const payload: ResponseUpsert[] = Object.entries(pending).map(([qid, v]) => ({
        question_id: qid,
        score: v.score,
        observations: v.observations || undefined,
      }));
      const saved = await api.put<ResponseOut[]>(`/assessments/${id}/responses`, { responses: payload });
      const rMap = { ...responses };
      for (const r of saved) rMap[r.question_id] = r;
      setResponses(rMap);
      setPending({});
      await loadScore();
    } finally {
      setSaving(false);
    }
  }

  function setQuestionScore(qid: string, score: number) {
    setPending((p) => ({ ...p, [qid]: { score, observations: p[qid]?.observations ?? responses[qid]?.observations ?? "" } }));
  }

  function setObservation(qid: string, obs: string) {
    const currentScore = pending[qid]?.score ?? responses[qid]?.score ?? 0;
    if (currentScore === 0) return;
    setPending((p) => ({ ...p, [qid]: { score: currentScore, observations: obs } }));
  }

  const answeredCount = Object.keys(responses).length + Object.keys(pending).filter((k) => !responses[k]).length;
  const totalQuestions = dimensions.reduce((sum, d) => sum + d.questions.length, 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-grey-400">Loading assessment…</div>;
  }
  if (!assessment) {
    return <div className="text-grey-500">Assessment not found.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/assessments" className="text-grey-400 hover:text-grey-700 mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-semibold text-grey-900">{assessment.organization_name}</h2>
            <p className="text-grey-500 text-sm mt-0.5">
              {assessment.mode.toLowerCase()} mode · {assessment.status.toLowerCase().replace("_", " ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/reports/${id}`}
            className="inline-flex items-center gap-2 rounded-md border border-grey-200 px-3 py-2 text-sm font-medium text-grey-700 hover:bg-grey-50 transition-colors"
          >
            <BarChart2 className="h-4 w-4" /> Report
          </Link>
          {Object.keys(pending).length > 0 && (
            <button
              onClick={saveResponses}
              disabled={saving}
              className="rounded-md bg-velvet px-4 py-2 text-sm font-medium text-white hover:bg-velvet-dark transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : `Save ${Object.keys(pending).length} response${Object.keys(pending).length > 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </div>

      {/* Progress + score */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs text-grey-500 uppercase tracking-wide">Progress</p>
          <p className="text-2xl font-semibold text-grey-900 mt-1">{answeredCount} / {totalQuestions}</p>
          <div className="mt-2 h-1.5 rounded-full bg-grey-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-velvet transition-all"
              style={{ width: totalQuestions ? `${(answeredCount / totalQuestions) * 100}%` : "0%" }}
            />
          </div>
        </div>

        {score ? (
          <>
            <div className="card">
              <p className="text-xs text-grey-500 uppercase tracking-wide">Overall Score</p>
              <p className="text-2xl font-semibold text-grey-900 mt-1">{formatScore(score.overall_score)} / 5.0</p>
              <span className={`maturity-badge mt-1 ${maturityBadgeClass(score.maturity_label)}`}>
                {score.maturity_label}
              </span>
            </div>
            <div className="card overflow-auto">
              <p className="text-xs text-grey-500 uppercase tracking-wide mb-2">By Dimension</p>
              <div className="space-y-1">
                {score.dimensions.map((d) => (
                  <div key={d.code} className="flex items-center justify-between text-xs">
                    <span className="text-grey-600 truncate max-w-[65%]">{d.name}</span>
                    <span className="font-semibold text-grey-900">{formatScore(d.score)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="card sm:col-span-2 flex items-center justify-center text-grey-400 text-sm">
            Score will appear once you save responses
          </div>
        )}
      </div>

      {/* Dimensions + questions */}
      <div className="space-y-2">
        {dimensions.map((dim) => {
          const open = activeDim === dim.id;
          const dimAnswered = dim.questions.filter((q) => responses[q.id] || pending[q.id]).length;
          return (
            <div key={dim.id} className="card p-0 overflow-hidden">
              <button
                onClick={() => setActiveDim(open ? null : dim.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-grey-50 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  {dimAnswered === dim.questions.length && dim.questions.length > 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-grey-300 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-grey-900">{dim.name}</p>
                    <p className="text-xs text-grey-500 mt-0.5">{dim.tag} · {dimAnswered}/{dim.questions.length} answered</p>
                  </div>
                </div>
                {open ? <ChevronUp className="h-4 w-4 text-grey-400" /> : <ChevronDown className="h-4 w-4 text-grey-400" />}
              </button>

              {open && (
                <div className="border-t border-grey-100 divide-y divide-grey-100">
                  {dim.questions.map((q, qi) => {
                    const saved = responses[q.id];
                    const pend = pending[q.id];
                    const currentScore = pend?.score ?? saved?.score ?? 0;
                    const currentObs = pend?.observations ?? saved?.observations ?? "";

                    return (
                      <div key={q.id} className="px-6 py-5">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-xs font-mono text-grey-400 mt-0.5 shrink-0">Q{qi + 1}</span>
                          <p className="text-sm text-grey-800 font-medium">{q.text}</p>
                        </div>

                        {/* Score buttons 1–5 */}
                        <div className="flex gap-2 mb-3 ml-6">
                          {[1, 2, 3, 4, 5].map((lvl) => {
                            const level = q.levels?.find((l) => l.level === lvl);
                            const selected = currentScore === lvl;
                            return (
                              <button
                                key={lvl}
                                onClick={() => setQuestionScore(q.id, lvl)}
                                title={level?.description}
                                className={`group relative flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                                  selected
                                    ? "border-velvet bg-velvet text-white"
                                    : "border-grey-200 text-grey-500 hover:border-velvet hover:text-velvet"
                                }`}
                              >
                                {lvl}
                                {level && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 rounded-md bg-grey-900 px-3 py-2 text-xs text-white shadow-lg z-10">
                                    <p className="font-semibold mb-1">Level {lvl}</p>
                                    {level.description}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                          {currentScore > 0 && (
                            <span className="ml-2 self-center text-xs text-grey-500">
                              {q.levels?.find((l) => l.level === currentScore)?.description?.slice(0, 60)}…
                            </span>
                          )}
                        </div>

                        {/* Observations */}
                        {currentScore > 0 && (
                          <div className="ml-6">
                            <textarea
                              rows={2}
                              value={currentObs}
                              onChange={(e) => setObservation(q.id, e.target.value)}
                              placeholder="Observations / evidence (optional)"
                              className="w-full rounded-md border border-grey-200 px-3 py-2 text-xs resize-none focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet text-grey-700 placeholder:text-grey-400"
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

      {/* Sticky save */}
      {Object.keys(pending).length > 0 && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={saveResponses}
            disabled={saving}
            className="rounded-full bg-velvet px-6 py-3 text-sm font-semibold text-white shadow-elevated hover:bg-velvet-dark transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : `Save ${Object.keys(pending).length} unsaved response${Object.keys(pending).length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
