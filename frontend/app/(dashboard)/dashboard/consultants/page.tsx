"use client";

import { useEffect, useState } from "react";
import { Plus, X, Check, Ban, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import type { UserOut, ConsultantAssignmentOut } from "@/types/user";
import type { OrganizationListItem } from "@/types/organization";

function AssignModal({
  consultants, orgs, onClose, onCreated,
}: {
  consultants: UserOut[];
  orgs: OrganizationListItem[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [personId, setPersonId] = useState("");
  const [orgId, setOrgId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!personId || !orgId) return;
    setSaving(true);
    setError(null);
    try {
      await api.post("/consultant-assignments", { person_id: personId, organization_id: orgId });
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError && e.status === 409
        ? "This consultant is already assigned to that organization."
        : "Failed to create assignment.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-elevated w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-grey-900">Assign Consultant</h3>
          <button onClick={onClose} className="text-grey-400 hover:text-grey-700"><X className="h-4 w-4" /></button>
        </div>
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-grey-700">Consultant</label>
            <select value={personId} onChange={(e) => setPersonId(e.target.value)} className="w-full rounded-md border border-grey-300 px-3 py-2 text-sm bg-white focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet">
              <option value="">Select a consultant…</option>
              {consultants.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.email} ({c.username})</option>)}
            </select>
            {consultants.length === 0 && <p className="text-xs text-grey-400">No users with the Assessment Consultant role yet.</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-grey-700">Organization</label>
            <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className="w-full rounded-md border border-grey-300 px-3 py-2 text-sm bg-white focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet">
              <option value="">Select an organization…</option>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 rounded-md border border-grey-200 py-2 text-sm font-medium text-grey-600 hover:bg-grey-50">Cancel</button>
            <button onClick={save} disabled={saving || !personId || !orgId} className="flex-1 rounded-md bg-velvet py-2 text-sm font-medium text-white hover:bg-velvet-dark disabled:opacity-50">{saving ? "Assigning…" : "Assign"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConsultantAccessPage() {
  const [assignments, setAssignments] = useState<ConsultantAssignmentOut[]>([]);
  const [consultants, setConsultants] = useState<UserOut[]>([]);
  const [orgs, setOrgs] = useState<OrganizationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  function loadAssignments() {
    api.get<ConsultantAssignmentOut[]>("/consultant-assignments").then(setAssignments).catch(() => setError("Failed to load assignments (admin only)."));
  }

  useEffect(() => {
    Promise.all([
      api.get<ConsultantAssignmentOut[]>("/consultant-assignments"),
      api.get<UserOut[]>("/users").catch(() => [] as UserOut[]),
      api.get<OrganizationListItem[]>("/organizations").catch(() => [] as OrganizationListItem[]),
    ]).then(([a, u, o]) => {
      setAssignments(a);
      setConsultants(u.filter((x) => x.role === "ASSESSMENT_CONSULTANT" && x.is_active));
      setOrgs(o);
    }).catch(() => setError("Failed to load (admin only).")).finally(() => setLoading(false));
  }, []);

  async function toggle(a: ConsultantAssignmentOut) {
    try {
      const updated = await api.patch<ConsultantAssignmentOut>(`/consultant-assignments/${a.id}`, { active: !a.active });
      setAssignments((prev) => prev.map((x) => x.id === a.id ? updated : x));
    } catch { setError("Failed to update assignment."); }
  }

  async function remove(a: ConsultantAssignmentOut) {
    if (!confirm(`Remove ${a.consultant_name ?? a.consultant_username}'s access to ${a.organization_name}?`)) return;
    try {
      await api.delete(`/consultant-assignments/${a.id}`);
      setAssignments((prev) => prev.filter((x) => x.id !== a.id));
    } catch { setError("Failed to remove assignment."); }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-grey-900">Consultant Access</h2>
          <p className="text-grey-500 text-sm mt-1">Assign Assessment Consultants to client organizations</p>
        </div>
        <button onClick={() => setAssignOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-velvet px-3 py-2 md:px-4 text-sm font-medium text-white hover:bg-velvet-dark transition-colors">
          <Plus className="h-4 w-4" /> Assign Consultant
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">{error}<button onClick={() => setError(null)}><X className="h-4 w-4" /></button></div>}

      {assignOpen && <AssignModal consultants={consultants} orgs={orgs} onClose={() => setAssignOpen(false)} onCreated={loadAssignments} />}

      {loading ? (
        <div className="card flex items-center justify-center h-40 text-grey-400">Loading…</div>
      ) : (
        <div className="card p-0">
          <table className="w-full text-sm">
            <thead className="bg-grey-50 border-b border-grey-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-grey-600 rounded-tl-lg">Consultant</th>
                <th className="text-left px-6 py-3 font-medium text-grey-600">Username</th>
                <th className="text-left px-6 py-3 font-medium text-grey-600">Organization</th>
                <th className="text-left px-6 py-3 font-medium text-grey-600">Status</th>
                <th className="px-6 py-3 rounded-tr-lg" />
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-100">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-grey-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-grey-900">{a.consultant_name ?? a.consultant_email ?? "—"}</td>
                  <td className="px-6 py-3 font-mono text-grey-600">{a.consultant_username ?? "—"}</td>
                  <td className="px-6 py-3 text-grey-600">{a.organization_name ?? "—"}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${a.active ? "bg-green-50 text-green-700" : "bg-grey-100 text-grey-500"}`}>{a.active ? "Active" : "Revoked"}</span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => toggle(a)} title={a.active ? "Revoke access" : "Reactivate"} className="p-1.5 rounded-md text-grey-400 hover:text-grey-700 hover:bg-grey-100">{a.active ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}</button>
                      <button onClick={() => remove(a)} title="Remove" className="p-1.5 rounded-md text-grey-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {assignments.length === 0 && <tr><td colSpan={5} className="px-6 py-10 text-center text-grey-400">No consultant assignments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
