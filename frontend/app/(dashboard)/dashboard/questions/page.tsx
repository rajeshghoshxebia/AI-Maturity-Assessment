"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Check, X, History } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Dimension, Question, CompetencyLevel } from "@/types/assessment";

interface EditState {
  questionId: string;
  text: string;
  levels: CompetencyLevel[];
}

interface QuestionVersion {
  id: string;
  text: string;
  levels: { level: number; description: string }[] | null;
  edited_by_label: string | null;
  created_at: string;
}

export default function QuestionsPage() {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDim, setOpenDim] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [versions, setVersions] = useState<QuestionVersion[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function toggleHistory(qid: string) {
    if (historyId === qid) { setHistoryId(null); return; }
    setHistoryId(qid);
    setHistoryLoading(true);
    setVersions([]);
    try {
      setVersions(await api.get<QuestionVersion[]>(`/questions/${qid}/versions`));
    } catch {
      setVersions([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    api.get<Dimension[]>("/dimensions")
      .then((dims) => { setDimensions(dims); if (dims.length) setOpenDim(dims[0].id); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function startEdit(q: Question) {
    setEditing({ questionId: q.id, text: q.text, levels: q.levels.map((l) => ({ ...l })) });
  }

  function cancelEdit() { setEditing(null); }

  function setEditText(text: string) { setEditing((e) => e ? { ...e, text } : e); }

  function setLevelDesc(level: number, description: string) {
    setEditing((e) => e ? { ...e, levels: e.levels.map((l) => l.level === level ? { ...l, description } : l) } : e);
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await api.patch<Question>(`/questions/${editing.questionId}`, {
        text: editing.text,
        levels: editing.levels,
      });
      setDimensions((dims) =>
        dims.map((d) => ({
          ...d,
          questions: d.questions.map((q) => q.id === updated.id ? { ...q, text: updated.text, levels: updated.levels } : q),
        }))
      );
      setSaved(editing.questionId);
      setEditing(null);
      setTimeout(() => setSaved(null), 2000);
    } catch {
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-grey-400">Loading questions…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold text-grey-900">Question Bank</h2>
        <p className="text-grey-500 text-sm mt-1">Edit question text and competency level descriptions</p>
      </div>

      <div className="space-y-2">
        {dimensions.map((dim) => {
          const open = openDim === dim.id;
          return (
            <div key={dim.id} className="card p-0 overflow-hidden">
              <button
                onClick={() => setOpenDim(open ? null : dim.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-grey-50 transition-colors"
              >
                <div className="text-left">
                  <p className="font-medium text-grey-900">{dim.name}</p>
                  <p className="text-xs text-grey-500 mt-0.5">{dim.questions.length} questions</p>
                </div>
                {open ? <ChevronUp className="h-4 w-4 text-grey-400" /> : <ChevronDown className="h-4 w-4 text-grey-400" />}
              </button>

              {open && (
                <div className="border-t border-grey-100 divide-y divide-grey-50">
                  {dim.questions.map((q, qi) => {
                    const isEditing = editing?.questionId === q.id;
                    const wasSaved = saved === q.id;

                    return (
                      <div key={q.id} className={`px-6 py-5 ${wasSaved ? "bg-green-50/50" : ""}`}>
                        <div className="flex items-start gap-2 mb-3">
                          <span className="text-xs font-mono text-grey-400 mt-1 shrink-0 w-6">Q{qi + 1}</span>
                          <div className="flex-1">
                            {isEditing ? (
                              <textarea
                                rows={2}
                                value={editing.text}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full rounded-md border border-velvet px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-velvet text-grey-800"
                              />
                            ) : (
                              <p className="text-sm text-grey-800 font-medium">{q.text}</p>
                            )}
                          </div>
                          {!isEditing && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => toggleHistory(q.id)}
                                className={`p-1.5 rounded-md transition-colors ${historyId === q.id ? "text-velvet bg-velvet-subtle" : "text-grey-400 hover:text-velvet hover:bg-velvet-subtle"}`}
                                title="Version history"
                              >
                                <History className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => startEdit(q)}
                                className="p-1.5 rounded-md text-grey-400 hover:text-velvet hover:bg-velvet-subtle transition-colors"
                                title="Edit question"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Competency levels */}
                        <div className="ml-8 space-y-2">
                          {(isEditing ? editing.levels : q.levels).map((lvl) => (
                            <div key={lvl.level} className="flex items-start gap-3">
                              <span className={`shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                                isEditing ? "bg-velvet text-white" : "bg-grey-100 text-grey-600"
                              }`}>
                                {lvl.level}
                              </span>
                              {isEditing ? (
                                <textarea
                                  rows={2}
                                  value={lvl.description}
                                  onChange={(e) => setLevelDesc(lvl.level, e.target.value)}
                                  className="flex-1 rounded-md border border-grey-200 px-2 py-1.5 text-xs resize-none focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet text-grey-700"
                                />
                              ) : (
                                <p className="text-xs text-grey-600 leading-relaxed">{lvl.description}</p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Version history */}
                        {historyId === q.id && !isEditing && (
                          <div className="ml-8 mt-3 rounded-md border border-grey-200 bg-grey-50 p-3">
                            <p className="text-xs font-medium text-grey-500 uppercase tracking-wide mb-2">Version history</p>
                            {historyLoading ? (
                              <p className="text-xs text-grey-400">Loading…</p>
                            ) : versions.length === 0 ? (
                              <p className="text-xs text-grey-400">No edits recorded yet.</p>
                            ) : (
                              <ul className="space-y-2">
                                {versions.map((v) => (
                                  <li key={v.id} className="text-xs text-grey-600 border-l-2 border-grey-200 pl-3">
                                    <span className="font-medium text-grey-700">
                                      {new Date(v.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    {" · "}{v.edited_by_label ?? "unknown"}
                                    <p className="text-grey-500 mt-0.5 line-clamp-2">{v.text}</p>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        {/* Edit action buttons */}
                        {isEditing && (
                          <div className="ml-8 mt-3 flex items-center gap-2">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="inline-flex items-center gap-1.5 rounded-md bg-velvet px-3 py-1.5 text-xs font-medium text-white hover:bg-velvet-dark transition-colors disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="inline-flex items-center gap-1.5 rounded-md border border-grey-200 px-3 py-1.5 text-xs font-medium text-grey-600 hover:bg-grey-50 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" /> Cancel
                            </button>
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
    </div>
  );
}
