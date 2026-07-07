import {
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
} from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ?? "",
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID ?? "common"}`,
    redirectUri:
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  },
  cache: {
    cacheLocation: "sessionStorage" as const,
    storeAuthStateInCookie: false,
  },
};

const loginScopes = ["openid", "profile", "email"];

// ── App-native credential session (username/password → app JWT) ──────────────
const APP_TOKEN_KEY = "aima_app_token";

export function setAppToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem(APP_TOKEN_KEY, token);
}

export function getAppToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(APP_TOKEN_KEY) : null;
}

export function clearAppToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(APP_TOKEN_KEY);
}

let _pca: PublicClientApplication | null = null;

export function getMsalInstance(): PublicClientApplication {
  if (!_pca) {
    _pca = new PublicClientApplication(msalConfig);
  }
  return _pca;
}

export async function signIn(): Promise<AuthenticationResult> {
  const pca = getMsalInstance();
  await pca.initialize();
  return pca.loginPopup({ scopes: loginScopes });
}

export async function signOut(): Promise<void> {
  const pca = getMsalInstance();
  const account = getActiveAccount();
  await pca.logoutPopup({ account: account ?? undefined });
}

export function getActiveAccount(): AccountInfo | null {
  const pca = getMsalInstance();
  const accounts = pca.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
}

export async function getAccessToken(): Promise<string | null> {
  // Prefer an app-native credential session when present.
  const appToken = getAppToken();
  if (appToken) return appToken;

  const pca = getMsalInstance();
  const account = getActiveAccount();
  if (!account) return null;
  try {
    const result = await pca.acquireTokenSilent({
      scopes: loginScopes,
      account,
    });
    return result.accessToken;
  } catch {
    return null;
  }
}
