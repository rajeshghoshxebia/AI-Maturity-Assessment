"use client";

import { useEffect, useState } from "react";
import { api } from "./api-client";

export interface Me {
  user_id: string;
  email: string;
  name: string | null;
  role: string;
  org_scope: string[] | null; // null = all organizations (admin)
}

// Cached across mounts within a session so nav/pages don't refetch constantly.
let _cache: Me | null = null;

export function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(_cache);
  useEffect(() => {
    if (_cache) { setMe(_cache); return; }
    api.get<Me>("/auth/me").then((m) => { _cache = m; setMe(m); }).catch(() => {});
  }, []);
  return me;
}

export const isAdmin = (me: Me | null) => me?.role === "ADMINISTRATOR";
export const isConsultant = (me: Me | null) => me?.role === "ASSESSMENT_CONSULTANT";

/** Write access (hierarchical): admins edit anything; consultants only their
 *  assigned orgs; all other roles have no edit access. */
export function canEditOrg(me: Me | null, orgId: string | null | undefined): boolean {
  if (!me) return false;
  if (me.role === "ADMINISTRATOR") return true;
  if (me.role === "ASSESSMENT_CONSULTANT") return !!orgId && (me.org_scope?.includes(orgId) ?? false);
  return false;
}
