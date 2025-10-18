'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { getOAuthRedirectUrl } from './utils/auth-urls';
import { useTenantId } from './tenant/TenantContext';

export interface AuthUser {
  id: string;
  email: string | undefined;
  name: string | undefined;
  avatar: string | undefined;
  phone: string | undefined;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

export function useAuth() {
  const tenantId = useTenantId(); // الحصول على tenant ID الحالي

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false
  });

  // Convert Supabase user to our AuthUser format
  const formatUser = useCallback((user: User | null): AuthUser | null => {
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
      avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      phone: user.phone
    };
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }

        if (mounted) {
          setAuthState({
            user: formatUser(session?.user ?? null),
            session,
            loading: false,
            initialized: true
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            initialized: true
          });
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        // 🔒 STRICT TENANT VERIFICATION - إجباري
        if (event === 'SIGNED_IN' && session?.user && tenantId) {
          console.log('🔍 Verifying tenant access for user:', session.user.id, 'tenant:', tenantId);

          const { data: userTenant, error: tenantError } = await (supabase as any)
            .from('user_tenant_mapping')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('tenant_id', tenantId)
            .eq('is_active', true)
            .single();

          if (tenantError || !userTenant) {
            console.error('❌ User does NOT belong to this tenant!');
            console.error('User ID:', session.user.id);
            console.error('Tenant ID:', tenantId);
            console.error('Error:', tenantError);

            // 🚨 تسجيل خروج فوري - المستخدم ليس له صلاحية
            await supabase.auth.signOut();

            // إعادة توجيه للصفحة الرئيسية مع رسالة خطأ
            if (typeof window !== 'undefined') {
              window.location.href = '/?error=unauthorized_tenant';
            }
            return;
          }

          console.log('✅ User verified for tenant:', userTenant.role);

          // تعيين tenant context في Supabase
          try {
            await (supabase as any).rpc('set_current_tenant', {
              tenant_uuid: tenantId
            });
            console.log('✅ Tenant context set successfully');
          } catch (err) {
            console.error('❌ Failed to set tenant context:', err);
          }
        }

        if (mounted) {
          setAuthState({
            user: formatUser(session?.user ?? null),
            session,
            loading: false,
            initialized: true
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [formatUser, tenantId]);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectUrl = getOAuthRedirectUrl('/auth/callback');
      console.log('🔗 OAuth Debug Info:');
      console.log('- Redirect URL:', redirectUrl);
      console.log('- Current window origin:', typeof window !== 'undefined' ? window.location.origin : 'server-side');
      console.log('- Environment NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);
      console.log('- Current Tenant ID:', tenantId);

      // ✅ حفظ tenant_id في sessionStorage قبل OAuth redirect
      if (typeof window !== 'undefined' && tenantId) {
        sessionStorage.setItem('pending_oauth_tenant_id', tenantId);
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('❌ OAuth Error:', error);
        throw error;
      }

      console.log('✅ OAuth initiated successfully for tenant:', tenantId);
      return { success: true, data };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ في تسجيل الدخول'
      };
    }
  }, [tenantId]);

  // Sign in with email/password
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      // 🔒 STRICT TENANT VERIFICATION - إجباري
      if (data.user && tenantId) {
        console.log('🔍 Verifying tenant access for user:', data.user.id, 'tenant:', tenantId);

        const { data: userTenant, error: tenantError } = await (supabase as any)
          .from('user_tenant_mapping')
          .select('*')
          .eq('user_id', data.user.id)
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .single();

        if (tenantError || !userTenant) {
          console.error('❌ Access Denied: User does NOT belong to this tenant');

          // تسجيل خروج فوري
          await supabase.auth.signOut();

          return {
            success: false,
            error: 'ليس لديك صلاحية الوصول لهذا المتجر. يرجى إنشاء حساب جديد للمتجر.'
          };
        }

        console.log('✅ User verified for tenant:', userTenant.role);

        // تعيين tenant context
        try {
          await (supabase as any).rpc('set_current_tenant', {
            tenant_uuid: tenantId
          });
        } catch (err) {
          console.error('Failed to set tenant context:', err);
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error signing in with email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ في تسجيل الدخول'
      };
    }
  }, [tenantId]);

  // Sign up with email/password
  const signUpWithEmail = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const redirectUrl = getOAuthRedirectUrl('/auth/callback');
      console.log('🔗 Email SignUp Debug Info:');
      console.log('- Redirect URL:', redirectUrl);
      console.log('- Current window origin:', typeof window !== 'undefined' ? window.location.origin : 'server-side');
      console.log('- Current Tenant ID:', tenantId);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            tenant_id: tenantId // ✅ إرسال tenant_id الحالي
          },
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Email signup successful for tenant:', tenantId);
      return { success: true, data };
    } catch (error) {
      console.error('Error signing up:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ في إنشاء الحساب'
      };
    }
  }, [tenantId]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'خطأ في تسجيل الخروج' 
      };
    }
  }, []);

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    initialized: authState.initialized,
    isAuthenticated: !!authState.user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut
  };
}