// ── Enums ────────────────────────────────────────────────────────────────────

export type AssessmentMode = "CONSULTANT" | "SURVEY";
export type AssessmentStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
export type UserRole =
  | "PLATFORM_ADMIN"
  | "ORG_ADMIN"
  | "CONSULTANT"
  | "STAKEHOLDER"
  | "VIEWER";

// ── Dimension / Question catalogue ───────────────────────────────────────────

export interface CompetencyLevel {
  level: number;
  description: string;
}

export interface Question {
  id: string;
  text: string;
  order: number;
  weight: number;
  subcategory_id: string | null;
  levels: CompetencyLevel[];
}

export interface TechSubcategory {
  id: string;
  code: string;
  name: string;
  description: string;
  order: number;
}

export interface Dimension {
  id: string;
  code: string;
  name: string;
  tag: string;
  description: string;
  what_is_assessed: string;
  order: number;
  is_optional: boolean;
  subcategories: TechSubcategory[];
  questions: Question[];
}

// ── Assessment ───────────────────────────────────────────────────────────────

export interface Assessment {
  id: string;
  organization_name: string;
  mode: AssessmentMode;
  status: AssessmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  active_subcategories: TechSubcategory[];
  org_id: string | null;
  org_unit_id: string | null;
  per_team: boolean;
}

export interface AssessmentCreate {
  organization_name: string;
  mode: AssessmentMode;
  notes?: string;
  active_subcategory_codes?: string[];
  org_id?: string;
  org_unit_id?: string;
  per_team?: boolean;
}

export interface AssessmentUpdate {
  organization_name?: string;
  status?: AssessmentStatus;
  notes?: string;
  active_subcategory_codes?: string[];
}

// ── Responses ────────────────────────────────────────────────────────────────

export interface ResponseUpsert {
  question_id: string;
  score: number;
  observations?: string;
  org_unit_id?: string;
}

export interface ResponseOut {
  id: string;
  question_id: string;
  score: number;
  observations: string | null;
  answered_at: string;
  org_unit_id: string | null;
}

// ── Scoring ──────────────────────────────────────────────────────────────────

export interface DimensionScoreOut {
  code: string;
  name: string;
  score: number;
  label: string;
  response_count: number;
}

export interface ScoreOut {
  overall_score: number;
  maturity_label: string;
  dimensions: DimensionScoreOut[];
}

export interface UnitScoreOut {
  unit_id: string;
  unit_name: string;
  unit_type: string;
  overall_score: number;
  maturity_label: string;
  dimensions: DimensionScoreOut[];
  children: UnitScoreOut[];
}

export interface HierarchyScoreOut {
  org_name: string;
  org_industry: string | null;
  overall_score: number;
  maturity_label: string;
  dimensions: DimensionScoreOut[];
  units: UnitScoreOut[];
}
