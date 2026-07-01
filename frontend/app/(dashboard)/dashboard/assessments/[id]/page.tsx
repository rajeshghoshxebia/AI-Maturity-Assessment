"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, BarChart2, Check, CheckCircle2, ChevronDown, ChevronUp,
  Circle, Copy, Mail, Trash2, Users,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { maturityBadgeClass, formatScore } from "@/lib/utils";
import type { Assessment, Dimension, ResponseOut, ScoreOut, ResponseUpsert } from "@/types/assessment";
import type { Organization, OrgUnit } from "@/types/organization";

interface Invitation {
  id: string;
  email: string;
  name: string | null;
  status: "PENDING" | "COMPLETED" | "REVOKED";
  sent_at: string | null;
  completed_at: string | null;
  survey_url: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  REVOKED: "bg-grey-100 text-grey-400",
};

function InvitePanel({ assessmentId, orgName }: { assessmentId: string; orgName: string }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [emails, setEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    api.get<Invitation[]>(`/assessments/${assessmentId}/invitations`).then(setInvitations).catch(() => {});
  }, [assessmentId]);

  async function sendInvites() {
    const lines = emails.split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean);
    if (!lines.length) return;
    setSending(true);
    try {
      const invitees = lines.map((line) => {
        const match = line.match(/^(.+?)\s*<(.+?)>$/);
        return match ? { name: match[1].trim(), email: match[2].trim() } : { email: line, name: undefined };
      });
      const result = await api.post<Invitation[]>(`/assessments/${assessmentId}/invitations`, { invitees });
      setInvitations((prev) => {
        const map = new Map(prev.map((i) => [i.id, i]));
        result.forEach((i) => map.set(i.id, i));
        return Array.from(map.values());
      });
      setEmails("");
    } finally {
      setSending(false);
    }
  }

  async function revoke(invId: string) {
    await api.delete(`/assessments/${assessmentId}/invitations/${invId}`);
    setInvitations((prev) => prev.map((i) => i.id === invId ? { ...i, status: "REVOKED" as const } : i));
  }

  function copyLink(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="font-semibold text-grey-900 flex items-center gap-2"><Mail className="h-4 w-4 text-velvet" /> Invite Stakeholders</h3>
        <p className="text-xs text-grey-500 mt-0.5">Enter email addresses (one per line, or comma-separated). Optionally include names: <code className="bg-grey-100 px-1 rounded">Jane Smith &lt;jane@company.com&gt;</code></p>
      </div>
      <textarea
        rows={4}
        value={emails}
        onChange={(e) => setEmails(e.target.value)}
        placeholder={"alice@company.com\nBob Jones <bob@company.com>"}
        className="w-full rounded-md border border-grey-200 px-3 py-2 text-sm resize-none focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet font-mono"
      />
      <button
        onClick={sendInvites}
        disabled={sending || !emails.trim()}
        className="rounded-md bg-velvet px-4 py-2 text-sm font-medium text-white hover:bg-velvet-dark transition-colors disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send Survey Links"}
      </button>
      {invitations.filter((i) => i.status !== "REVOKED").length > 0 && (
        <div className="border-t border-grey-100 pt-4 space-y-2">
          <p className="text-xs font-medium text-grey-600 uppercase tracking-wide">Invitations sent</p>
          {invitations.filter((i) => i.status !== "REVOKED").map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 rounded-md bg-grey-50 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-grey-800 truncate">{inv.name ? `${inv.name} <${inv.email}>` : inv.email}</p>
                <p className="text-xs text-grey-500 mt-0.5">
                  {inv.sent_at ? `Sent ${new Date(inv.sent_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "Not sent"}
                  {inv.completed_at && ` · Completed ${new Date(inv.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                </p>
              </div>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[inv.status]}`}>{inv.status}</span>
              {inv.survey_url && (
                <button onClick={() => copyLink(inv.survey_url!, inv.id)} title="Copy survey link" className="text-grey-400 hover:text-velvet transition-colors">
                  {copied === inv.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
              {inv.status === "PENDING" && (
                <button onClick={() => revoke(inv.id)} title="Revoke invitation" className="text-grey-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function flatUnits(units: OrgUnit[]): OrgUnit[] {
  return units.flatMap((u) => [u, ...flatUnits(u.children)]);
}

export default function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [allResponses, setAllResponses] = useState<ResponseOut[]>([]);
  const [score, setScore] = useState<ScoreOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDim, setActiveDim] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, { score: number; observations: string }>>({});

  // Per-team state
  const [org, setOrg] = useState<Organization | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

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
          return { ...d, questions: d.questions.filter((q) => q.subcategory_id && activeCodes.has(d.subcategories.find((s) => s.id === q.subcategory_id)?.code ?? "")) };
        }
        return d;
      }).filter((d) => d.code !== "TECHNOLOGY_STACK" || d.questions.length > 0);
      setDimensions(filtered);
      setAllResponses(resps);
      if (filtered.length > 0) setActiveDim(filtered[0].id);
      if (existingScore) setScore(existingScore);

      // Load org if per_team
      if (a.per_team && a.org_id) {
        api.get<Organization>(`/organizations/${a.org_id}`).then((o) => {
          setOrg(o);
          const units = flatUnits(o.units);
          if (units.length > 0) setSelectedUnitId(units[0].id);
        }).catch(() => {});
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  // Derive responses for selected team
  const responses: Record<string, ResponseOut> = {};
  for (const r of allResponses) {
    const key = assessment?.per_team ? `${r.org_unit_id ?? ""}:${r.question_id}` : r.question_id;
    if (assessment?.per_team) {
      if (r.org_unit_id === selectedUnitId) responses[r.question_id] = r;
    } else {
      responses[r.question_id] = r;
    }
  }

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
        org_unit_id: assessment?.per_team ? selectedUnitId ?? undefined : undefined,
      }));
      const saved = await api.put<ResponseOut[]>(`/assessments/${id}/responses`, { responses: payload });
      setAllResponses((prev) => {
        const next = prev.filter((r) => {
          if (!assessment?.per_team) return !saved.find((s) => s.question_id === r.question_id);
          return !(r.org_unit_id === selectedUnitId && saved.find((s) => s.question_id === r.question_id));
        });
        return [...next, ...saved];
      });
      setPending({});
      await loadScore();
    } finally {
      setSaving(false);
    }
  }

  function setQuestionScore(qid: string, s: number) {
    setPending((p) => ({ ...p, [qid]: { score: s, observations: p[qid]?.observations ?? responses[qid]?.observations ?? "" } }));
  }

  function setObservation(qid: string, obs: string) {
    const currentScore = pending[qid]?.score ?? responses[qid]?.score ?? 0;
    if (currentScore === 0) return;
    setPending((p) => ({ ...p, [qid]: { score: currentScore, observations: obs } }));
  }

  const answeredCount = Object.keys(responses).length + Object.keys(pending).filter((k) => !responses[k]).length;
  const totalQuestions = dimensions.reduce((sum, d) => sum + d.questions.length, 0);

  if (loading) return <div className="flex items-center justify-center h-64 text-grey-400">Loading assessment…</div>;
  if (!assessment) return <div className="text-grey-500">Assessment not found.</div>;

  const allTeams = org ? flatUnits(org.units) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/assessments" className="text-grey-400 hover:text-grey-700 mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl font-semibold text-grey-900 md:text-2xl truncate">{assessment.organization_name}</h2>
            <p className="text-grey-500 text-sm mt-0.5">
              {assessment.mode.toLowerCase()} mode · {assessment.status.toLowerCase().replace("_", " ")}
              {assessment.per_team && <span className="ml-2 inline-flex items-center gap-1 text-velvet"><Users className="h-3.5 w-3.5" />per-team</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/dashboard/reports/${id}`}
            className="inline-flex items-center gap-2 rounded-md border border-grey-200 px-3 py-2 text-sm font-medium text-grey-700 hover:bg-grey-50 transition-colors"
          >
            <BarChart2 className="h-4 w-4" /> Report
          </Link>
          {Object.keys(pending).length > 0 && (
            <button onClick={saveResponses} disabled={saving} className="rounded-md bg-velvet px-4 py-2 text-sm font-medium text-white hover:bg-velvet-dark transition-colors disabled:opacity-50">
              {saving ? "Saving…" : `Save ${Object.keys(pending).length} response${Object.keys(pending).length > 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </div>

      {/* Per-team tabs */}
      {assessment.per_team && allTeams.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-grey-100 bg-grey-50">
            <Users className="h-4 w-4 text-velvet shrink-0" />
            <p className="text-xs font-medium text-grey-600 uppercase tracking-wide">Scoring team</p>
          </div>
          <div className="flex gap-1 p-2 flex-wrap">
            {allTeams.map((u) => {
              const teamResponses = allResponses.filter((r) => r.org_unit_id === u.id);
              const answered = teamResponses.length;
              const isSelected = selectedUnitId === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => { setSelectedUnitId(u.id); setPending({}); }}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isSelected ? "bg-velvet text-white" : "text-grey-600 hover:bg-grey-100"
                  }`}
                >
                  {u.name}
                  {answered > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-xs ${isSelected ? "bg-white/20 text-white" : "bg-green-100 text-green-700"}`}>
                      {answered}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress + score */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs text-grey-500 uppercase tracking-wide">Progress{assessment.per_team && selectedUnitId ? ` · ${allTeams.find((u) => u.id === selectedUnitId)?.name}` : ""}</p>
          <p className="text-2xl font-semibold text-grey-900 mt-1">{answeredCount} / {totalQuestions}</p>
          <div className="mt-2 h-1.5 rounded-full bg-grey-100 overflow-hidden">
            <div className="h-full rounded-full bg-velvet transition-all" style={{ width: totalQuestions ? `${(answeredCount / totalQuestions) * 100}%` : "0%" }} />
          </div>
        </div>
        {score ? (
          <>
            <div className="card">
              <p className="text-xs text-grey-500 uppercase tracking-wide">Overall Score</p>
              <p className="text-2xl font-semibold text-grey-900 mt-1">{formatScore(score.overall_score)} / 5.0</p>
              <span className={`maturity-badge mt-1 ${maturityBadgeClass(score.maturity_label)}`}>{score.maturity_label}</span>
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
          <div className="card sm:col-span-2 flex items-center justify-center text-grey-400 text-sm">Score will appear once you save responses</div>
        )}
      </div>

      {assessment.mode === "SURVEY" && (
        <InvitePanel assessmentId={id} orgName={assessment.organization_name} />
      )}

      {/* Dimensions + questions */}
      <div className="space-y-2">
        {dimensions.map((dim) => {
          const open = activeDim === dim.id;
          const dimAnswered = dim.questions.filter((q) => responses[q.id] || pending[q.id]).length;
          return (
            <div key={dim.id} className="card p-0 overflow-hidden">
              <button
                onClick={() => setActiveDim(open ? null : dim.id)}
                className="w-full flex items-center justify-between px-4 py-3.5 md:px-6 md:py-4 hover:bg-grey-50 transition-colors"
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
                      <div key={q.id} className="px-4 py-4 md:px-6 md:py-5">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-xs font-mono text-grey-400 mt-0.5 shrink-0">Q{qi + 1}</span>
                          <p className="text-sm text-grey-800 font-medium">{q.text}</p>
                        </div>
                        <div className="flex gap-2 mb-3 ml-6 flex-wrap">
                          {[1, 2, 3, 4, 5].map((lvl) => {
                            const level = q.levels?.find((l) => l.level === lvl);
                            const selected = currentScore === lvl;
                            return (
                              <button
                                key={lvl}
                                onClick={() => setQuestionScore(q.id, lvl)}
                                title={level?.description}
                                className={`group relative flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                                  selected ? "border-velvet bg-velvet text-white" : "border-grey-200 text-grey-500 hover:border-velvet hover:text-velvet"
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
                        {currentScore > 0 && (
                          <textarea
                            rows={2}
                            value={currentObs}
                            onChange={(e) => setObservation(q.id, e.target.value)}
                            placeholder="Observations / evidence (optional)"
                            className="w-full rounded-md border border-grey-200 px-3 py-2 text-xs resize-none focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet text-grey-700 placeholder:text-grey-400"
                          />
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

      {Object.keys(pending).length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-auto">
          <button
            onClick={saveResponses}
            disabled={saving}
            className="w-full md:w-auto rounded-full bg-velvet px-6 py-3 text-sm font-semibold text-white shadow-elevated hover:bg-velvet-dark transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : `Save ${Object.keys(pending).length} unsaved response${Object.keys(pending).length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
