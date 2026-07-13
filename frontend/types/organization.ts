export type UnitType = "BUSINESS_UNIT" | "DEPARTMENT" | "TEAM";

export interface OrgUnit {
  id: string;
  org_id: string;
  parent_id: string | null;
  name: string;
  unit_type: UnitType;
  sort_order: number;
  competency_codes: string[];
  active_dimension_codes: string[] | null;
  primary_contact_id: string | null;
  children: OrgUnit[];
}

export interface Organization {
  id: string;
  tenant_id: string;
  name: string;
  industry: string | null;
  primary_contact_id: string | null;
  created_at: string;
  updated_at: string;
  units: OrgUnit[];
}

export interface OrganizationListItem {
  id: string;
  name: string;
  industry: string | null;
  created_at: string;
  unit_count: number;
}

export interface OrganizationCreate {
  name: string;
  industry?: string;
}

export interface OrganizationUpdate {
  name?: string;
  industry?: string;
  primary_contact_id?: string | null;
}

export interface OrgUnitCreate {
  name: string;
  unit_type: UnitType;
  parent_id?: string;
  sort_order?: number;
  competency_codes?: string[];
  active_dimension_codes?: string[] | null;
  primary_contact_id?: string | null;
}

export interface OrgUnitUpdate {
  name?: string;
  unit_type?: UnitType;
  parent_id?: string | null;
  sort_order?: number;
  competency_codes?: string[];
  active_dimension_codes?: string[] | null;
  primary_contact_id?: string | null;
}
