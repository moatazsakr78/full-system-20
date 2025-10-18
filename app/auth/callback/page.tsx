'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase/client';
import { useTenantId } from '@/lib/tenant/TenantContext';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTenantId = useTenantId();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the code from URL params
        const code = searchParams?.get('code');

        if (code) {
          console.log('🔗 Processing auth code from URL');

          // Exchange code for session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('❌ Error exchanging code for session:', error);
            router.push('/?error=auth_error');
            return;
          }

          if (data.session) {
            console.log('✅ User authenticated successfully:', data.session.user.email);

            // الحصول على tenant_id من sessionStorage أو استخدام الحالي
            const savedTenantId = sessionStorage.getItem('pending_oauth_tenant_id');
            const tenantId = savedTenantId || currentTenantId;

            if (!tenantId) {
              console.error('❌ No tenant context available!');
              await supabase.auth.signOut();
              router.push('/?error=no_tenant');
              return;
            }

            const userId = data.session.user.id;

            // 🔒 التحقق من صلاحية المستخدم للـ tenant
            const { data: userTenantMapping } = await (supabase as any)
              .from('user_tenant_mapping')
              .select('*')
              .eq('user_id', userId)
              .eq('tenant_id', tenantId)
              .eq('is_active', true)
              .single();

            // إذا المستخدم مش موجود في الـ tenant ده، نشوف لو هو جديد
            if (!userTenantMapping) {
              console.log('🔍 User not found in tenant mapping, checking if new user...');

              // التحقق من وجود المستخدم في user_profiles
              const { data: profile } = await (supabase as any)
                .from('user_profiles')
                .select('id')
                .eq('id', userId)
                .single();

              if (!profile) {
                // مستخدم جديد تماماً - نضيفه للـ tenant
                console.log('🆕 New OAuth user, creating profile for tenant:', tenantId);

                const userName = data.session.user.user_metadata?.full_name ||
                                data.session.user.user_metadata?.name ||
                                data.session.user.email?.split('@')[0];

                // تعيين tenant context أولاً
                await (supabase as any).rpc('set_current_tenant', {
                  tenant_uuid: tenantId
                });

                // إضافة للـ user_profiles
                await (supabase as any).from('user_profiles').insert({
                  id: userId,
                  tenant_id: tenantId,
                  full_name: userName,
                  email: data.session.user.email,
                  role: 'عميل',
                  is_active: true,
                  is_admin: false
                });

                // إضافة للـ user_tenant_mapping
                await (supabase as any).from('user_tenant_mapping').insert({
                  user_id: userId,
                  tenant_id: tenantId,
                  role: 'customer',
                  is_active: true
                });

                console.log('✅ OAuth user profile created successfully');
              } else {
                // مستخدم موجود لكن مش في الـ tenant ده
                console.error('❌ User exists but NOT in this tenant!');
                console.error('User must create a NEW account for this tenant');

                await supabase.auth.signOut();
                sessionStorage.removeItem('pending_oauth_tenant_id');
                router.push('/?error=wrong_tenant');
                return;
              }
            } else {
              console.log('✅ User verified for tenant:', userTenantMapping.role);

              // تعيين tenant context
              await (supabase as any).rpc('set_current_tenant', {
                tenant_uuid: tenantId
              });
            }

            // مسح tenant_id من sessionStorage
            sessionStorage.removeItem('pending_oauth_tenant_id');

            // Redirect to home page
            router.push('/');
          } else {
            console.log('⚠️ No session created, redirecting to home');
            router.push('/');
          }
        } else {
          // No code, try to get existing session
          console.log('📋 No code in URL, checking for existing session');
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error('❌ Error getting session:', error);
            router.push('/?error=auth_error');
            return;
          }

          if (data.session) {
            console.log('✅ Existing session found:', data.session.user.email);
            router.push('/');
          } else {
            console.log('⚠️ No session found, redirecting to home');
            router.push('/');
          }
        }
      } catch (error) {
        console.error('❌ Unexpected error in auth callback:', error);
        router.push('/?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router, searchParams, currentTenantId]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#c0c0c0'}}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-['Cairo',Arial,sans-serif]">جاري تسجيل الدخول...</p>
      </div>
    </div>
  );
}