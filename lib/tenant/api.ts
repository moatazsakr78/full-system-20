// ==============================================
// TENANT API FUNCTIONS
// ==============================================

import { createClient } from '@/lib/supabase/client';
import { Tenant } from '@/types/tenant';

/**
 * جلب tenant من subdomain
 */
export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  const supabase = createClient();

  const { data, error } = await (supabase as any)
    .rpc('get_tenant_by_subdomain', { subdomain_param: subdomain })
    .single();

  if (error || !data) {
    console.error('Error fetching tenant by subdomain:', error);
    return null;
  }

  return data as Tenant;
}

/**
 * جلب tenant من custom domain
 */
export async function getTenantByCustomDomain(domain: string): Promise<Tenant | null> {
  const supabase = createClient();

  const { data, error } = await (supabase as any)
    .rpc('get_tenant_by_custom_domain', { domain_param: domain })
    .single();

  if (error || !data) {
    console.error('Error fetching tenant by custom domain:', error);
    return null;
  }

  return data as Tenant;
}

/**
 * جلب tenant من أي domain (subdomain أو custom)
 */
export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  const supabase = createClient();

  const { data, error } = await (supabase as any)
    .rpc('get_tenant_by_domain', { domain_param: domain })
    .single();

  if (error || !data) {
    console.error('Error fetching tenant by domain:', error);
    return null;
  }

  return data as Tenant;
}

/**
 * جلب tenant من ID
 */
export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  const supabase = createClient();

  const { data, error } = await (supabase as any)
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error('Error fetching tenant by ID:', error);
    return null;
  }

  return data as Tenant;
}

/**
 * تعيين tenant context في Supabase
 */
export async function setTenantContext(tenantId: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await (supabase as any).rpc('set_current_tenant', {
    tenant_uuid: tenantId,
  });

  if (error) {
    console.error('Error setting tenant context:', error);
    return false;
  }

  return true;
}

/**
 * التحقق من أن المستخدم ينتمي لهذا الـ tenant
 */
export async function userBelongsToTenant(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await (supabase as any).rpc('user_belongs_to_tenant', {
    user_uuid: userId,
    tenant_uuid: tenantId,
  });

  if (error) {
    console.error('Error checking user tenant membership:', error);
    return false;
  }

  return data === true;
}

/**
 * جلب tenant_id للمستخدم الحالي
 */
export async function getUserTenantId(userId: string): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await (supabase as any).rpc('get_user_tenant_id', {
    user_uuid: userId,
  });

  if (error || !data) {
    console.error('Error getting user tenant ID:', error);
    return null;
  }

  return data as string;
}

/**
 * إنشاء tenant جديد
 */
export async function createTenant(
  subdomain: string,
  name: string,
  ownerEmail: string
): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await (supabase as any).rpc('create_new_tenant', {
    subdomain_param: subdomain,
    name_param: name,
    owner_email: ownerEmail,
  });

  if (error || !data) {
    console.error('Error creating tenant:', error);
    return null;
  }

  return data as string;
}
