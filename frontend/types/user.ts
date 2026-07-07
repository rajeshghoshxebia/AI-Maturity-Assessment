export type UserRole =
  | "ADMINISTRATOR"
  | "PC_ORGANIZATION"
  | "PC_BUSINESS_UNIT"
  | "PC_TEAM"
  | "ASSESSMENT_CONSULTANT"
  | "MEMBER"
  | "VIEWER";

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMINISTRATOR: "Administrator",
  PC_ORGANIZATION: "Primary Contact — Organization",
  PC_BUSINESS_UNIT: "Primary Contact — Business Unit",
  PC_TEAM: "Primary Contact — Team",
  ASSESSMENT_CONSULTANT: "Assessment Consultant",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export interface UserOut {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  role: UserRole;
  is_active: boolean;
  primary_org_unit_id: string | null;
}

export interface UserCreateResult extends UserOut {
  generated_username: string;
  initial_password: string;
}

export interface ConsultantAssignmentOut {
  id: string;
  person_id: string;
  organization_id: string;
  active: boolean;
  assigned_date: string | null;
  consultant_name: string | null;
  consultant_username: string | null;
  consultant_email: string | null;
  organization_name: string | null;
}
