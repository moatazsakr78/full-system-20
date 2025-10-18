-- ==============================================
-- FIX MULTI-TENANT FUNCTIONS
-- Migration: إصلاح شامل لدوال multi-tenancy
-- ==============================================

-- 1️⃣ إصلاح دالة current_tenant_id() لتستخدم get_user_tenant() بشكل صحيح
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
    tenant_uuid UUID;
BEGIN
    -- محاولة الحصول على tenant من session variable أولاً
    tenant_uuid := NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;

    IF tenant_uuid IS NOT NULL THEN
        RETURN tenant_uuid;
    END IF;

    -- إذا لم يتم العثور على session variable، استخدم get_user_tenant()
    RETURN get_user_tenant();
END;
$function$;

-- 2️⃣ تحديث دالة get_user_tenant_id() لتعمل بشكل صحيح
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
    -- استدعاء get_user_tenant() مباشرة
    RETURN get_user_tenant();
END;
$function$;

-- 3️⃣ إنشاء دالة للتحقق من صلاحية المستخدم للوصول للـ tenant
CREATE OR REPLACE FUNCTION public.verify_user_tenant_access(
    p_user_id UUID,
    p_tenant_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
    has_access BOOLEAN;
BEGIN
    -- التحقق من وجود mapping نشط بين المستخدم والـ tenant
    SELECT EXISTS (
        SELECT 1
        FROM public.user_tenant_mapping
        WHERE user_id = p_user_id
        AND tenant_id = p_tenant_id
        AND is_active = true
    ) INTO has_access;

    RETURN has_access;
END;
$function$;

-- 4️⃣ إنشاء دالة لجلب tenant للمستخدم الحالي (مع التحقق الصارم)
CREATE OR REPLACE FUNCTION public.get_current_user_tenant()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
    current_user_id UUID;
    session_tenant_id UUID;
    user_tenant_id UUID;
BEGIN
    -- الحصول على ID المستخدم الحالي
    current_user_id := auth.uid();

    -- إذا لم يكن هناك مستخدم مسجل دخول، نرجع session tenant فقط
    IF current_user_id IS NULL THEN
        RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
    END IF;

    -- الحصول على tenant من session
    session_tenant_id := NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;

    -- إذا كان هناك session tenant، نتحقق من صلاحية المستخدم
    IF session_tenant_id IS NOT NULL THEN
        -- التحقق من أن المستخدم له صلاحية الوصول لهذا الـ tenant
        IF verify_user_tenant_access(current_user_id, session_tenant_id) THEN
            RETURN session_tenant_id;
        ELSE
            -- المستخدم ليس له صلاحية، نرجع NULL
            RETURN NULL;
        END IF;
    END IF;

    -- إذا لم يكن هناك session tenant، نجلب أول tenant للمستخدم
    SELECT tenant_id INTO user_tenant_id
    FROM public.user_tenant_mapping
    WHERE user_id = current_user_id
    AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;

    RETURN user_tenant_id;
END;
$function$;

-- 5️⃣ دالة helper للتحقق من tenant context
CREATE OR REPLACE FUNCTION public.has_valid_tenant_context()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
    RETURN current_tenant_id() IS NOT NULL;
END;
$function$;

-- 6️⃣ دالة لمنع الوصول إذا لم يكن هناك tenant صالح
CREATE OR REPLACE FUNCTION public.enforce_tenant_isolation()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
    tenant_id UUID;
BEGIN
    tenant_id := current_tenant_id();

    -- إذا لم يكن هناك tenant، نمنع الوصول
    IF tenant_id IS NULL THEN
        RAISE EXCEPTION 'Access denied: No valid tenant context';
    END IF;

    RETURN TRUE;
END;
$function$;

-- 7️⃣ تحديث دالة bind_user_to_tenant لإضافة معلومات إضافية
CREATE OR REPLACE FUNCTION public.bind_user_to_tenant(
    p_user_id UUID,
    p_tenant_id UUID,
    p_role TEXT DEFAULT 'customer'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.user_tenant_mapping (user_id, tenant_id, role, is_active)
    VALUES (p_user_id, p_tenant_id, p_role, true)
    ON CONFLICT (user_id, tenant_id)
    DO UPDATE SET
        role = EXCLUDED.role,
        is_active = true,
        updated_at = now();

    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to bind user % to tenant %: %', p_user_id, p_tenant_id, SQLERRM;
        RETURN false;
END;
$function$;

-- 8️⃣ إنشاء trigger helper لتعيين tenant_id تلقائياً
CREATE OR REPLACE FUNCTION public.set_tenant_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    tenant_id UUID;
BEGIN
    -- الحصول على tenant_id الحالي
    tenant_id := current_tenant_id();

    -- إذا لم يكن هناك tenant_id، نرفض العملية
    IF tenant_id IS NULL THEN
        RAISE EXCEPTION 'Cannot insert record: No valid tenant context';
    END IF;

    -- تعيين tenant_id للسجل الجديد
    NEW.tenant_id := tenant_id;

    RETURN NEW;
END;
$function$;

-- 9️⃣ دالة للتحقق من أن السجل ينتمي للـ tenant الحالي
CREATE OR REPLACE FUNCTION public.record_belongs_to_current_tenant(record_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
    current_tenant UUID;
BEGIN
    current_tenant := current_tenant_id();

    -- إذا لم يكن هناك tenant حالي، نرفض
    IF current_tenant IS NULL THEN
        RETURN FALSE;
    END IF;

    -- التحقق من تطابق tenant_id
    RETURN record_tenant_id = current_tenant;
END;
$function$;

-- 🔟 إنشاء view لعرض tenant mapping للمستخدم الحالي
CREATE OR REPLACE VIEW public.user_current_tenant_info AS
SELECT
    utm.id,
    utm.user_id,
    utm.tenant_id,
    utm.role,
    utm.is_active,
    t.name as tenant_name,
    t.subdomain,
    t.custom_domain,
    utm.created_at,
    utm.updated_at
FROM public.user_tenant_mapping utm
JOIN public.tenants t ON t.id = utm.tenant_id
WHERE utm.user_id = auth.uid()
AND utm.is_active = true;

-- تعليقات توضيحية
COMMENT ON FUNCTION public.current_tenant_id IS 'Returns current tenant ID from session or user mapping';
COMMENT ON FUNCTION public.get_user_tenant_id IS 'Returns tenant ID for current user';
COMMENT ON FUNCTION public.verify_user_tenant_access IS 'Verifies if user has access to specific tenant';
COMMENT ON FUNCTION public.get_current_user_tenant IS 'Returns tenant ID for current user with strict verification';
COMMENT ON FUNCTION public.has_valid_tenant_context IS 'Checks if current request has valid tenant context';
COMMENT ON FUNCTION public.enforce_tenant_isolation IS 'Raises exception if no valid tenant context';
COMMENT ON FUNCTION public.set_tenant_id_on_insert IS 'Trigger function to auto-set tenant_id on insert';
COMMENT ON FUNCTION public.record_belongs_to_current_tenant IS 'Checks if record belongs to current tenant';

-- رسالة نجاح
DO $$
BEGIN
    RAISE NOTICE '✅ Multi-tenant functions fixed successfully!';
END $$;
