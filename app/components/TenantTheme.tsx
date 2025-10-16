'use client';

// ==============================================
// DYNAMIC TENANT THEME
// ==============================================

import { useEffect } from 'react';
import { useTenant } from '@/lib/tenant/TenantContext';

export default function TenantTheme() {
  const { tenant, isLoading } = useTenant();

  useEffect(() => {
    if (isLoading || !tenant) return;

    // تطبيق الألوان الديناميكية
    const root = document.documentElement;

    // الألوان الأساسية
    root.style.setProperty('--tenant-primary-color', tenant.primary_color || '#3B82F6');
    root.style.setProperty('--tenant-secondary-color', tenant.secondary_color || '#1F2937');

    // تحديث meta theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', tenant.primary_color || '#3B82F6');
    }

    // تحديث الـ favicon
    if (tenant.favicon_url) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = tenant.favicon_url;
      }
    }

    // تحديث الـ title
    if (tenant.name) {
      document.title = tenant.name;
    }

  }, [tenant, isLoading]);

  return null; // هذا component بدون UI، فقط side effects
}
