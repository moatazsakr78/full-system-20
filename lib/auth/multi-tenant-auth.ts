// ==============================================
// MULTI-TENANT AUTHENTICATION
// ==============================================

import { createClient } from '@/lib/supabase/client';
import { userBelongsToTenant, setTenantContext } from '@/lib/tenant/api';

export interface SignInResult {
  success: boolean;
  error?: string;
  user?: any;
  profile?: any;
}

/**
 * تسجيل دخول مع التحقق من الـ tenant
 */
export async function signInWithTenant(
  email: string,
  password: string,
  tenantId: string
): Promise<SignInResult> {
  const supabase = createClient();

  try {
    // 1. تسجيل الدخول في Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return {
        success: false,
        error: authError.message || 'فشل تسجيل الدخول',
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'لم يتم العثور على المستخدم',
      };
    }

    // 2. التحقق من أن المستخدم ينتمي للمتجر الحالي
    const belongs = await userBelongsToTenant(authData.user.id, tenantId);

    if (!belongs) {
      // المستخدم موجود لكن ليس في هذا المتجر
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'هذا الحساب غير مسجل في هذا المتجر',
      };
    }

    // 3. جلب بيانات الـ profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'لم يتم العثور على بيانات المستخدم',
      };
    }

    // 4. تعيين tenant context
    await setTenantContext(tenantId);

    return {
      success: true,
      user: authData.user,
      profile,
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: 'حدث خطأ أثناء تسجيل الدخول',
    };
  }
}

/**
 * تسجيل مستخدم جديد في متجر محدد
 */
export async function signUpWithTenant(
  email: string,
  password: string,
  fullName: string,
  tenantId: string,
  role: string = 'عميل'
): Promise<SignInResult> {
  const supabase = createClient();

  try {
    // 1. إنشاء حساب في Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return {
        success: false,
        error: authError.message || 'فشل إنشاء الحساب',
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'لم يتم إنشاء الحساب',
      };
    }

    // 2. إنشاء profile في الـ tenant
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        tenant_id: tenantId,
        full_name: fullName,
        email: email,
        role: role,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      // حذف الحساب من Auth إذا فشل إنشاء الـ profile
      await supabase.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        error: 'فشل إنشاء ملف المستخدم',
      };
    }

    // 3. تعيين tenant context
    await setTenantContext(tenantId);

    return {
      success: true,
      user: authData.user,
      profile,
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: 'حدث خطأ أثناء إنشاء الحساب',
    };
  }
}

/**
 * تسجيل الخروج
 */
export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

/**
 * الحصول على المستخدم الحالي
 */
export async function getCurrentUser() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * الحصول على profile المستخدم الحالي
 */
export async function getCurrentUserProfile(tenantId: string) {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .eq('tenant_id', tenantId)
    .single();

  return profile;
}
