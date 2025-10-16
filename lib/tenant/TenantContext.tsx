'use client';

// ==============================================
// TENANT CONTEXT PROVIDER
// ==============================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Tenant, TenantContext as TenantContextType } from '@/types/tenant';
import { getTenantByDomain, setTenantContext } from './api';
import { parseDomain } from './utils';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadTenant() {
      try {
        setIsLoading(true);
        setError(null);

        // جلب hostname الحالي
        const hostname = window.location.hostname;

        // استخراج معلومات الدومين
        const domainInfo = parseDomain(hostname);

        // جلب الـ tenant من الـ database
        const tenantData = await getTenantByDomain(hostname);

        if (!tenantData) {
          throw new Error('Tenant not found');
        }

        // تعيين tenant context في Supabase
        await setTenantContext(tenantData.id);

        setTenant(tenantData);
      } catch (err) {
        console.error('Error loading tenant:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, isLoading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook للوصول لبيانات الـ tenant
 */
export function useTenant() {
  const context = useContext(TenantContext);

  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }

  return context;
}

/**
 * Hook للحصول على tenant ID مباشرة
 */
export function useTenantId(): string | null {
  const { tenant } = useTenant();
  return tenant?.id || null;
}

/**
 * Hook للحصول على tenant settings
 */
export function useTenantSettings() {
  const { tenant } = useTenant();
  return tenant?.settings || {};
}
