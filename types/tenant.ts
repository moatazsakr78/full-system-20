// ==============================================
// TENANT TYPES
// ==============================================

export interface Tenant {
  id: string;
  subdomain: string;
  custom_domain: string | null;
  domain_type: 'subdomain' | 'custom';
  domain_verified: boolean;

  name: string;
  name_en: string | null;
  description: string | null;

  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;

  settings: TenantSettings;

  is_active: boolean;
  subscription_status: 'active' | 'suspended' | 'cancelled';
  subscription_plan: 'basic' | 'pro' | 'enterprise';

  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  currency?: string;
  timezone?: string;
  language?: string;
  tax_enabled?: boolean;
  tax_rate?: number;
  [key: string]: any;
}

export interface TenantContext {
  tenant: Tenant | null;
  isLoading: boolean;
  error: Error | null;
}

export interface DomainInfo {
  hostname: string;
  subdomain: string | null;
  isCustomDomain: boolean;
  baseDomain: string;
}
