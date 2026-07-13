"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, BarChart2, Check, CheckCircle2, ChevronDown, ChevronUp,
  Circle, Copy, Edit2, Mail, Settings2, Trash2, Users, X,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { maturityBadgeClass, formatScore } from "@/lib/utils";
import { useMe, canEditOrg } from "@/lib/use-me";
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
        <p className="text-xs text-grey-500 mt-0.5">Enter email addresses (one per line). Optionally: <code className="bg-grey-100 px-1 rounded">Jane Smith &lt;jane@co.com&gt;</code></p>
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
                <button onClick={() => revoke(inv.id)} title="Revoke" className="text-grey-400 hover:text-red-500 transition-colors">
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

// ── Dimension picker modal ────────────────────────────────────────────────────

function DimPickerModal({
  unit, allDimensions, onClose, onSave,
}: {
  unit: OrgUnit;
  allDimensions: Dimension[];
  onClose: () => void;
  onSave: (codes: string[] | null) => void;
}) {
  const initial = unit.active_dimension_codes ?? allDimensions.map((d) => d.code);
  const [selected, setSelected] = useState<Set<string>>(new Set(initial));
  const [saving, setSaving] = useState(false);

  function toggle(code: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    const allSelected = allDimensions.every((d) => selected.has(d.code));
    onSave(allSelected ? null : Array.from(selected));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-elevated w-full max-w-sm p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-grey-900">Dimensions for <span className="text-velvet">{unit.name}</span></h3>
          <button onClick={onClose} className="text-grey-400 hover:text-grey-700"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-xs text-grey-500">Choose which dimensions are assessed for this team. Deselected dimensions won't appear during scoring.</p>
        <div className="space-y-1">
          {allDimensions.map((d) => {
            const active = selected.has(d.code);
            return (
              <button
                key={d.code}
                onClick={() => toggle(d.code)}
                className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-left transition-colors ${active ? "bg-velvet/5 text-velvet" : "text-grey-600 hover:bg-grey-50"}`}
              >
                <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${active ? "border-velvet bg-velvet" : "border-grey-300"}`}>
                  {active && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                <span className="font-medium">{d.name}</span>
                <span className="ml-auto text-xs text-grey-400">{d.tag}</span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 rounded-md border border-grey-200 py-2 text-sm font-medium text-grey-600 hover:bg-grey-50">Cancel</button>
          <button
            onClick={save}
            disabled={saving || selected.size === 0}
            className="flex-1 rounded-md bg-velvet py-2 text-sm font-medium text-white hover:bg-velvet-dark disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit assessment modal ─────────────────────────────────────────────────────

const ALL_STATUSES = ["DRAFT", "IN_PROGRESS", "COMPLETED", "ARCHIVED"] as const;
type AssessmentStatus = typeof ALL_STATUSES[number];
const STATUS_LABEL: Record<AssessmentStatus, string> = {
  DRAFT: "Draft", IN_PROGRESS: "In Progress", COMPLETED: "Completed", ARCHIVED: "Archived",
};

function EditAssessmentModal({
  assessment,
  onClose,
  onSave,
}: {
  assessment: Assessment;
  onClose: () => void;
  onSave: (updated: Assessment) => void;
}) {
  const [form, setForm] = useState({
    organization_name: assessment.organization_name,
    status: assessment.status as AssessmentStatus,
    notes: assessment.notes ?? "",
    org_context: assessment.org_context ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!form.organization_name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.patch<Assessment>(`/assessments/${assessment.id}`, {
        organization_name: form.organization_name,
        status: form.status,
        notes: form.notes || null,
        org_context: form.org_context || null,
      });
      onSave(updated);
    } catch {
      setError("Failed to save changes.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-elevated w-full max-w-lg p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-grey-900">Edit Assessment</h3>
          <button onClick={onClose} className="text-grey-400 hover:text-grey-700"><X className="h-4 w-4" /></button>
        </div>
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-grey-700">Organisation name *</label>
            <input
              type="text"
              required
              value={form.organization_name}
              onChange={(e) => setForm((f) => ({ ...f, organization_name: e.target.value }))}
              className="w-full rounded-md border border-grey-300 px-3 py-2 text-sm focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-grey-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AssessmentStatus }))}
              className="w-full rounded-md border border-grey-300 px-3 py-2 text-sm bg-white focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-grey-700">
              Organisation context <span className="text-grey-400 font-normal">(used by AI report)</span>
            </label>
            <textarea
              rows={4}
              value={form.org_context}
              onChange={(e) => setForm((f) => ({ ...f, org_context: e.target.value }))}
              placeholder="Describe the organisation, industry, challenges, strategic priorities…"
              className="w-full rounded-md border border-grey-300 px-3 py-2 text-sm resize-none focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-grey-700">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Assessment scope, instructions, observations…"
              className="w-full rounded-md border border-grey-300 px-3 py-2 text-sm resize-none focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 rounded-md border border-grey-200 py-2 text-sm font-medium text-grey-600 hover:bg-grey-50">Cancel</button>
          <button
            onClick={save}
            disabled={saving || !form.organization_name.trim()}
            className="flex-1 rounded-md bg-velvet py-2 text-sm font-medium text-white hover:bg-velvet-dark disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function flatUnits(units: OrgUnit[]): OrgUnit[] {
  return units.flatMap((u) => [u, ...flatUnits(u.children)]);
}

// ── Main page ─────────────────────────────────────────────────────────────────

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
  const [selectedDoc, setSelectedDoc] = useState<Record<string, string>>({});

  const [editOpen, setEditOpen] = useState(false);
  const me = useMe();

  // Per-team state
  const [org, setOrg] = useState<Organization | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [dimPickerUnit, setDimPickerUnit] = useState<OrgUnit | null>(null);

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
      if (existingScore) setScore(existingScore);

      if (a.per_team && a.org_id) {
        api.get<Organization>(`/organizations/${a.org_id}`).then((o) => {
          setOrg(o);
          const units = flatUnits(o.units);
          if (units.length > 0) setSelectedUnitId(units[0].id);
        }).catch(() => {});
      } else {
        setActiveDim(filtered[0]?.id ?? null);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  // When team changes, open first dimension
  useEffect(() => {
    if (dimensions.length > 0) setActiveDim(dimensions[0].id);
  }, [selectedUnitId]);

  const allTeams = org ? flatUnits(org.units) : [];
  const selectedUnit = allTeams.find((u) => u.id === selectedUnitId) ?? null;

  // Dimensions active for the selected team (null = all)
  const activeDimCodes = selectedUnit?.active_dimension_codes ?? null;
  const visibleDimensions = activeDimCodes
    ? dimensions.filter((d) => activeDimCodes.includes(d.code))
    : dimensions;

  // Responses for the selected team
  const responses: Record<string, ResponseOut> = {};
  for (const r of allResponses) {
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

  function openDocumentPicker(qid: string) {
    const input = document.getElementById(`local-doc-picker-${qid}`) as HTMLInputElement | null;
    input?.click();
  }

  function handleDocumentPicked(qid: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedDoc((prev) => ({ ...prev, [qid]: file.name }));
    event.target.value = "";
  }

  async function saveDimConfig(codes: string[] | null) {
    if (!selectedUnit || !org) return;
    try {
      const updated = await api.patch<OrgUnit>(`/organizations/${org.id}/units/${selectedUnit.id}`, { active_dimension_codes: codes });
      setOrg((prev) => {
        if (!prev) return prev;
        const patch = (units: OrgUnit[]): OrgUnit[] => units.map((u) =>
          u.id === updated.id ? { ...u, active_dimension_codes: updated.active_dimension_codes } : { ...u, children: patch(u.children) }
        );
        return { ...prev, units: patch(prev.units) };
      });
    } finally {
      setDimPickerUnit(null);
    }
  }

  async function deleteAssessment() {
    if (!confirm(`Delete assessment "${assessment?.organization_name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/assessments/${id}`);
      router.push("/dashboard/assessments");
    } catch {
      alert("Failed to delete assessment.");
    }
  }

  const answeredCount = Object.keys(responses).length + Object.keys(pending).filter((k) => !responses[k]).length;
  const totalQuestions = visibleDimensions.reduce((sum, d) => sum + d.questions.length, 0);

  if (loading) return <div className="flex items-center justify-center h-64 text-grey-400">Loading assessment…</div>;
  if (!assessment) return <div className="text-grey-500">Assessment not found.</div>;

  // Editable only for assigned organizations (admins can edit anything).
  const editable = canEditOrg(me, assessment.org_id);

  return (
    <div className="space-y-6 animate-fade-in">
      {!editable && (
        <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-2.5 text-sm text-blue-800">
          View-only — this assessment belongs to an organization you are not assigned to. You can review scores and the report, but not edit or conduct it.
        </div>
      )}
      {/* Dim config modal */}
      {dimPickerUnit && (
        <DimPickerModal
          unit={dimPickerUnit}
          allDimensions={dimensions}
          onClose={() => setDimPickerUnit(null)}
          onSave={saveDimConfig}
        />
      )}

      {/* Edit modal */}
      {editOpen && (
        <EditAssessmentModal
          assessment={assessment}
          onClose={() => setEditOpen(false)}
          onSave={(updated) => { setAssessment(updated); setEditOpen(false); }}
        />
      )}

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
        <div className="flex items-center gap-2 shrink-0">
          {editable && (
            <>
              <button
                onClick={() => setEditOpen(true)}
                title="Edit assessment"
                className="inline-flex items-center gap-1.5 rounded-md border border-grey-200 px-3 py-2 text-sm font-medium text-grey-700 hover:bg-grey-50 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={deleteAssessment}
                title="Delete assessment"
                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </>
          )}
          <Link
            href={`/dashboard/reports/${id}`}
            className="inline-flex items-center gap-2 rounded-md border border-grey-200 px-3 py-2 text-sm font-medium text-grey-700 hover:bg-grey-50 transition-colors"
          >
            <BarChart2 className="h-4 w-4" />
            <span className="hidden sm:inline">Report</span>
          </Link>
          {editable && Object.keys(pending).length > 0 && (
            <button onClick={saveResponses} disabled={saving} className="rounded-md bg-velvet px-4 py-2 text-sm font-medium text-white hover:bg-velvet-dark transition-colors disabled:opacity-50">
              {saving ? "Saving…" : `Save ${Object.keys(pending).length}`}
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
              const teamAnswered = allResponses.filter((r) => r.org_unit_id === u.id).length;
              const isSelected = selectedUnitId === u.id;
              const hasDimFilter = (u.active_dimension_codes?.length ?? 0) > 0;
              return (
                <div key={u.id} className="flex items-center gap-0.5">
                  <button
                    onClick={() => { setSelectedUnitId(u.id); setPending({}); }}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      isSelected ? "bg-velvet text-white" : "text-grey-600 hover:bg-grey-100"
                    }`}
                  >
                    {u.name}
                    {teamAnswered > 0 && (
                      <span className={`rounded-full px-1.5 py-0.5 text-xs ${isSelected ? "bg-white/20 text-white" : "bg-green-100 text-green-700"}`}>
                        {teamAnswered}
                      </span>
                    )}
                    {hasDimFilter && (
                      <span className={`rounded-full px-1.5 py-0.5 text-xs ${isSelected ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"}`} title="Custom dimensions">
                        {u.active_dimension_codes!.length}d
                      </span>
                    )}
                  </button>
                  {isSelected && editable && (
                    <button
                      onClick={() => setDimPickerUnit(u)}
                      title="Configure dimensions for this team"
                      className="p-1.5 rounded-md text-grey-400 hover:text-velvet hover:bg-grey-100 transition-colors"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {selectedUnit && activeDimCodes && (
            <div className="px-4 pb-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-grey-400">Active dimensions:</span>
              {activeDimCodes.map((code) => (
                <span key={code} className="rounded-full bg-velvet/10 text-velvet text-xs px-2 py-0.5">
                  {dimensions.find((d) => d.code === code)?.name ?? code}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Progress + score */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs text-grey-500 uppercase tracking-wide">
            Progress{assessment.per_team && selectedUnit ? ` · ${selectedUnit.name}` : ""}
          </p>
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
        {visibleDimensions.map((dim) => {
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
                                onClick={() => editable && setQuestionScore(q.id, lvl)}
                                disabled={!editable}
                                title={level?.description}
                                className={`group relative flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                                  selected ? "border-velvet bg-velvet text-white" : "border-grey-200 text-grey-500 hover:border-velvet hover:text-velvet"
                                } ${!editable ? "opacity-60 cursor-not-allowed hover:border-grey-200 hover:text-grey-500" : ""}`}
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
                          <>
                            <textarea
                              rows={2}
                              value={currentObs}
                              onChange={(e) => setObservation(q.id, e.target.value)}
                              readOnly={!editable}
                              placeholder="Observations / evidence (optional)"
                              className="w-full rounded-md border border-grey-200 px-3 py-2 text-xs resize-none focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet text-grey-700 placeholder:text-grey-400 read-only:bg-grey-50"
                            />
                            <div className="mt-2 rounded-md border border-dashed border-grey-200 bg-grey-50 px-3 py-3 text-xs text-grey-500">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-medium text-grey-700">Upload document</p>
                                  <p className="mt-1 text-xs text-grey-500">Proof of completion or additional context.</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openDocumentPicker(q.id)}
                                  className="rounded-md bg-velvet px-3 py-2 text-xs font-medium text-white hover:bg-velvet-dark transition-colors"
                                >
                                  Choose file
                                </button>
                              </div>
                              {selectedDoc[q.id] && (
                                <p className="mt-2 text-xs text-grey-600">Selected: {selectedDoc[q.id]}</p>
                              )}
                              <input
                                id={`local-doc-picker-${q.id}`}
                                type="file"
                                className="hidden"
                                onChange={(e) => handleDocumentPicked(q.id, e)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {visibleDimensions.length === 0 && assessment.per_team && selectedUnit && (
          <div className="card text-center py-8 text-grey-400 text-sm">
            No dimensions selected for {selectedUnit.name}.{" "}
            <button onClick={() => setDimPickerUnit(selectedUnit)} className="text-velvet underline">Configure dimensions</button>
          </div>
        )}
      </div>

      {editable && Object.keys(pending).length > 0 && (
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
