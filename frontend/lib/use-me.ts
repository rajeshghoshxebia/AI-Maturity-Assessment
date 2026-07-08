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
    api.get<Me>("/me").then((m) => { _cache = m; setMe(m); }).catch(() => {});
  }, []);
  return me;
}

/** Write access: admin (null scope) can edit anything; others only their scoped orgs. */
export function canEditOrg(me: Me | null, orgId: string | null | undefined): boolean {
  if (!me) return false;
  if (me.org_scope === null) return true;
  if (!orgId) return false;
  return me.org_scope.includes(orgId);
}

export const isConsultant = (me: Me | null) => me?.role === "ASSESSMENT_CONSULTANT";
