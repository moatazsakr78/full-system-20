// ==============================================
// TENANT UTILITIES
// ==============================================

import { DomainInfo, Tenant } from '@/types/tenant';

// قاعدة الدومين الأساسية (يجب تغييرها حسب الـ production domain)
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'mysystem.com';

/**
 * استخراج معلومات الدومين من hostname
 */
export function parseDomain(hostname: string): DomainInfo {
  // إزالة port إذا موجود
  const cleanHostname = hostname.split(':')[0];

  // تحقق: هل ده custom domain ولا subdomain؟
  const isCustomDomain = !cleanHostname.endsWith(`.${BASE_DOMAIN}`) && cleanHostname !== BASE_DOMAIN;

  let subdomain: string | null = null;

  if (!isCustomDomain && cleanHostname !== BASE_DOMAIN) {
    // استخراج الـ subdomain
    // مثال: "elmasry.mysystem.com" -> "elmasry"
    subdomain = cleanHostname.split('.')[0];
  }

  return {
    hostname: cleanHostname,
    subdomain,
    isCustomDomain,
    baseDomain: BASE_DOMAIN,
  };
}

/**
 * التحقق من صحة subdomain
 */
export function isValidSubdomain(subdomain: string): boolean {
  // قواعد subdomain:
  // - حروف صغيرة، أرقام، وشرطات فقط
  // - يبدأ ويبنتهي بحرف أو رقم
  // - طول من 3 إلى 63 حرف
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;

  // Subdomains محجوزة
  const reservedSubdomains = [
    'www',
    'api',
    'admin',
    'app',
    'mail',
    'ftp',
    'localhost',
    'test',
    'staging',
    'dev',
    'demo',
  ];

  return (
    subdomainRegex.test(subdomain) &&
    !reservedSubdomains.includes(subdomain.toLowerCase())
  );
}

/**
 * بناء URL كامل للمتجر
 */
export function buildTenantUrl(tenant: Tenant, path: string = ''): string {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

  // استخدام custom domain إذا متاح ومُفعّل
  if (tenant.custom_domain && tenant.domain_verified && tenant.domain_type === 'custom') {
    return `${protocol}://${tenant.custom_domain}${path}`;
  }

  // استخدام subdomain
  return `${protocol}://${tenant.subdomain}.${BASE_DOMAIN}${path}`;
}

/**
 * الحصول على tenant ID من localStorage (للتطوير فقط)
 */
export function getLocalTenantId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tenant_id');
}

/**
 * حفظ tenant ID في localStorage (للتطوير فقط)
 */
export function setLocalTenantId(tenantId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tenant_id', tenantId);
}

/**
 * حذف tenant ID من localStorage
 */
export function clearLocalTenantId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('tenant_id');
}
