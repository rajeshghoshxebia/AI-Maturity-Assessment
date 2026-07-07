"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, setAppToken } from "@/lib/auth";
import { api } from "@/lib/api-client";

const IS_DEV = !process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;

interface TokenResponse {
  access_token: string;
  token_type: string;
  role: string;
  name: string | null;
  user_id: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [credLoading, setCredLoading] = useState(false);

  async function handleCredentialLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setCredLoading(true);
    setError(null);
    try {
      const res = await api.post<TokenResponse>("/auth/login", {
        username: username.trim(),
        password,
      });
      setAppToken(res.access_token);
      router.push("/dashboard");
    } catch {
      setError("Invalid username or password.");
      setCredLoading(false);
    }
  }

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      if (IS_DEV) {
        // Dev mode: no Azure AD — go straight to dashboard
        router.push("/dashboard");
        return;
      }
      await signIn();
      router.push("/dashboard");
    } catch {
      setError("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-blue-dark flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="text-center mb-10">
          <p className="text-velvet-light text-sm font-medium uppercase tracking-widest mb-2">
            Xebia
          </p>
          <h1 className="text-3xl font-semibold text-white">
            AI Maturity Assessment
          </h1>
          <p className="text-white/50 mt-2 text-sm">
            Enterprise AI readiness in 7 dimensions
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl p-8 shadow-elevated">
          <h2 className="text-lg font-semibold text-grey-900 mb-1">
            Sign in to continue
          </h2>
          <p className="text-sm text-grey-500 mb-6">
            {IS_DEV
              ? "Development mode — Azure AD not configured."
              : "Use your Microsoft 365 account to access the platform."}
          </p>

          {IS_DEV && (
            <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              Dev mode active. Click below to sign in as <strong>dev@xebia.com</strong>.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-md bg-velvet px-4 py-2.5 text-sm font-medium text-white hover:bg-velvet-dark transition-colors disabled:opacity-60"
          >
            {loading ? (
              "Signing in…"
            ) : IS_DEV ? (
              "Continue as Dev User →"
            ) : (
              <>
                <MicrosoftIcon />
                Sign in with Microsoft
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-grey-200" />
            <span className="text-xs text-grey-400 uppercase tracking-wide">or</span>
            <div className="h-px flex-1 bg-grey-200" />
          </div>

          {/* Credential login (Admin-managed accounts) */}
          <form onSubmit={handleCredentialLogin} className="space-y-3">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              className="w-full rounded-md border border-grey-300 px-3 py-2 text-sm focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full rounded-md border border-grey-300 px-3 py-2 text-sm focus:border-velvet focus:outline-none focus:ring-1 focus:ring-velvet"
            />
            <button
              type="submit"
              disabled={credLoading || !username.trim() || !password}
              className="w-full rounded-md border border-velvet px-4 py-2.5 text-sm font-medium text-velvet hover:bg-velvet-subtle transition-colors disabled:opacity-60"
            >
              {credLoading ? "Signing in…" : "Sign in with username"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} Xebia. All rights reserved.
        </p>
      </div>
    </div>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
