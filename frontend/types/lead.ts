export interface SearchCriteria {
  job_titles: string[];
  seniorities: string[];
  industries: string[];
  locations: string[];
  keywords: string[];
  company_names: string[];
  company_domains: string[];
  company_headcount: string[];
}

export interface Lead {
  full_name: string;
  first_name: string;
  last_name: string;
  title: string;
  seniority: string;
  company: string;
  company_domain: string;
  industry: string;
  location: string;
  email: string;
  email_verified: boolean;
  phone: string;
  linkedin_url: string;
  source: string;
  match_reason: string;
}

export interface LeadSearchRequest {
  business_case: string;
  company_name?: string | null;
  limit?: number;
  criteria?: SearchCriteria | null;
}

export interface LeadSearchResponse {
  criteria: SearchCriteria;
  leads: Lead[];
  provider: string;
  count: number;
}
