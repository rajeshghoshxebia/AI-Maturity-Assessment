"use client";

import { useEffect, useState } from "react";
import { Plus, KeyRound, Check, X, ShieldCheck, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { ROLE_LABEL, type UserRole, type UserOut, type UserCreateResult } from "@/types/user";

const ROLES: UserRole[] = [
  "ADMINISTRATOR", "PC_ORGANIZATION", "PC_BUSINESS_UNIT", "PC_DEPARTMENT", "PC_TEAM",
  "ASSESSMENT_CONSULTANT", "MEMBER", "VIEWER",
];

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: (u: UserOut) => void }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", role: "ASSESSMENT_CONSULTANT" as UserRole });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UserCreateResult | null>(null);

  async function save() {
    if (!form.first_name.trim() || !form.email.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.post<UserCreateResult>("/users", form);
      setResult(res);
      onCreated(res);
    } catch {
      setError("Failed to create user. Check the email is unique.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-elevated w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-grey-900">New User</h3>
          <button onClick={onClose} className="text-grey-400 hover:text-grey-700"><X className="h-4 w-4" /></button>
        </div>

        {result ? (
          <div className="space-y-3">
            <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
              User created. Share these credentials securely — the password is shown only once.
            </div>
            <div className="rounded-md border border-grey-200 divide-y divide-grey-100 text-sm">
              <div className="flex justify-between px-3 py-2"><span className="text-grey-500">Username</span><span className="font-mono font-medium">{result.generated_username}</span></div>
              <div className="flex justify-between px-3 py-2"><span className="text-grey-500">Password</span><span className="font-mono font-medium">{result.initial_password}</span></div>
            </div>
            <button onClick={onClose} className="w-full rounded-md bg-velvet py-2 text-sm font-medium text-white hover:bg-velvet-dark">Done</button>
          </div>
        ) : (
          <div className="space-y-3">
            {error && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <input value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} placeholder="First name" className="rounded-md border border-grey-300 px-3 py-2 text-sm focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet" />
              <input value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} placeholder="Last name" className="rounded-md border border-grey-300 px-3 py-2 text-sm focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet" />
            </div>
            <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" type="email" className="w-full rounded-md border border-grey-300 px-3 py-2 text-sm focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet" />
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))} className="w-full rounded-md border border-grey-300 px-3 py-2 text-sm bg-white focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <p className="text-xs text-grey-500">A username is auto-generated and the initial password defaults to <code className="bg-grey-100 px-1 rounded">username@123</code>.</p>
            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 rounded-md border border-grey-200 py-2 text-sm font-medium text-grey-600 hover:bg-grey-50">Cancel</button>
              <button onClick={save} disabled={saving || !form.first_name.trim() || !form.email.trim()} className="flex-1 rounded-md bg-velvet py-2 text-sm font-medium text-white hover:bg-velvet-dark disabled:opacity-50">{saving ? "Creating…" : "Create user"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetInfo, setResetInfo] = useState<{ username: string; password: string } | null>(null);

  function load() {
    api.get<UserOut[]>("/users").then(setUsers).catch(() => setError("Failed to load users (admin only).")).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function toggleActive(u: UserOut) {
    try {
      const updated = await api.patch<UserOut>(`/users/${u.id}`, { is_active: !u.is_active });
      setUsers((prev) => prev.map((x) => x.id === u.id ? updated : x));
    } catch { setError("Failed to update user."); }
  }

  async function resetPassword(u: UserOut) {
    if (!confirm(`Reset password for ${u.username ?? u.email} to the default?`)) return;
    try {
      const res = await api.post<{ username: string; new_password: string }>(`/users/${u.id}/reset-password`, {});
      setResetInfo({ username: res.username, password: res.new_password });
    } catch { setError("Failed to reset password."); }
  }

  async function deleteUser(u: UserOut) {
    if (!confirm(`Permanently delete ${u.name ?? u.username ?? u.email}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch { setError("Failed to delete user."); }
  }

  async function changeRole(u: UserOut, role: UserRole) {
    if (role === u.role) return;
    try {
      const updated = await api.patch<UserOut>(`/users/${u.id}`, { role });
      setUsers((prev) => prev.map((x) => x.id === u.id ? updated : x));
    } catch { setError("Failed to change role."); }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-grey-900">Users</h2>
          <p className="text-grey-500 text-sm mt-1">Manage people, roles, and credentials</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-velvet px-3 py-2 md:px-4 text-sm font-medium text-white hover:bg-velvet-dark transition-colors">
          <Plus className="h-4 w-4" /> New User
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">{error}<button onClick={() => setError(null)}><X className="h-4 w-4" /></button></div>}

      {resetInfo && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 flex items-center justify-between">
          <span>Password for <strong>{resetInfo.username}</strong> reset to <span className="font-mono">{resetInfo.password}</span></span>
          <button onClick={() => setResetInfo(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {createOpen && <CreateUserModal onClose={() => setCreateOpen(false)} onCreated={() => load()} />}

      {loading ? (
        <div className="card flex items-center justify-center h-40 text-grey-400">Loading…</div>
      ) : (
        <div className="card p-0">
          <table className="w-full text-sm">
            <thead className="bg-grey-50 border-b border-grey-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-grey-600 rounded-tl-lg">Name</th>
                <th className="text-left px-6 py-3 font-medium text-grey-600">Username</th>
                <th className="text-left px-6 py-3 font-medium text-grey-600">Email</th>
                <th className="text-left px-6 py-3 font-medium text-grey-600">Role</th>
                <th className="text-left px-6 py-3 font-medium text-grey-600">Status</th>
                <th className="px-6 py-3 rounded-tr-lg" />
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-grey-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-grey-900">{u.name ?? "—"}</td>
                  <td className="px-6 py-3 font-mono text-grey-600">{u.username ?? "—"}</td>
                  <td className="px-6 py-3 text-grey-500">{u.email}</td>
                  <td className="px-6 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value as UserRole)}
                      className="rounded-md border border-grey-200 bg-white px-2 py-1 text-xs text-grey-700 focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${u.is_active ? "bg-green-50 text-green-700" : "bg-grey-100 text-grey-500"}`}>
                      {u.is_active ? <><ShieldCheck className="h-3 w-3" /> Active</> : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => resetPassword(u)} title="Reset password" className="p-1.5 rounded-md text-grey-400 hover:text-velvet hover:bg-grey-100"><KeyRound className="h-4 w-4" /></button>
                      <button onClick={() => toggleActive(u)} title={u.is_active ? "Deactivate" : "Activate"} className="p-1.5 rounded-md text-grey-400 hover:text-grey-700 hover:bg-grey-100">{u.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}</button>
                      <button onClick={() => deleteUser(u)} title="Delete permanently" className="p-1.5 rounded-md text-grey-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-grey-400">No users yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
