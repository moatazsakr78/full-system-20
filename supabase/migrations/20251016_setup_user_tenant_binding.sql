-- ==============================================
-- USER-TENANT BINDING SETUP
-- ==============================================

-- إنشاء جدول لربط المستخدمين بالـ tenants
CREATE TABLE IF NOT EXISTS public.user_tenant_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'customer', -- customer, admin, staff
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, tenant_id)
);

-- إضافة indexes
CREATE INDEX IF NOT EXISTS idx_user_tenant_mapping_user_id ON public.user_tenant_mapping(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_mapping_tenant_id ON public.user_tenant_mapping(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_mapping_active ON public.user_tenant_mapping(is_active);

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- دالة لجلب tenant_id من session variable أو من domain
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
    tenant_uuid UUID;
BEGIN
    -- محاولة الحصول على tenant من session variable
    tenant_uuid := NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;

    IF tenant_uuid IS NOT NULL THEN
        RETURN tenant_uuid;
    END IF;

    -- إذا لم يتم العثور، نرجع NULL
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- دالة لربط مستخدم جديد بـ tenant
CREATE OR REPLACE FUNCTION bind_user_to_tenant(
    p_user_id UUID,
    p_tenant_id UUID,
    p_role TEXT DEFAULT 'customer'
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.user_tenant_mapping (user_id, tenant_id, role)
    VALUES (p_user_id, p_tenant_id, p_role)
    ON CONFLICT (user_id, tenant_id)
    DO UPDATE SET
        role = EXCLUDED.role,
        is_active = true,
        updated_at = now();

    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لجلب tenant_id للمستخدم الحالي
CREATE OR REPLACE FUNCTION get_user_tenant()
RETURNS UUID AS $$
DECLARE
    current_user_id UUID;
    user_tenant_id UUID;
    current_tenant UUID;
BEGIN
    -- الحصول على ID المستخدم الحالي
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        -- إذا لم يكن مسجل دخول، نستخدم tenant من session
        RETURN get_current_tenant_id();
    END IF;

    -- محاولة الحصول على tenant من session أولاً
    current_tenant := get_current_tenant_id();

    IF current_tenant IS NOT NULL THEN
        -- التحقق من أن المستخدم ينتمي لهذا الـ tenant
        SELECT tenant_id INTO user_tenant_id
        FROM public.user_tenant_mapping
        WHERE user_id = current_user_id
        AND tenant_id = current_tenant
        AND is_active = true
        LIMIT 1;

        IF user_tenant_id IS NOT NULL THEN
            RETURN user_tenant_id;
        END IF;
    END IF;

    -- إذا لم نجد، نجلب أول tenant للمستخدم
    SELECT tenant_id INTO user_tenant_id
    FROM public.user_tenant_mapping
    WHERE user_id = current_user_id
    AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;

    RETURN user_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Trigger عند إنشاء user profile جديد
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    current_tenant UUID;
BEGIN
    -- الحصول على tenant الحالي
    current_tenant := get_current_tenant_id();

    IF current_tenant IS NOT NULL THEN
        -- تعيين tenant_id للـ profile
        NEW.tenant_id := current_tenant;

        -- ربط المستخدم بالـ tenant
        PERFORM bind_user_to_tenant(NEW.id, current_tenant, 'customer');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء أو تحديث Trigger
DROP TRIGGER IF EXISTS on_user_profile_created ON public.user_profiles;
CREATE TRIGGER on_user_profile_created
    BEFORE INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_profile();

-- ==============================================
-- RLS POLICIES لـ user_tenant_mapping
-- ==============================================

ALTER TABLE public.user_tenant_mapping ENABLE ROW LEVEL SECURITY;

-- السماح للمستخدمين بقراءة mappings الخاصة بهم
CREATE POLICY "Users can view their own tenant mappings" ON public.user_tenant_mapping
    FOR SELECT USING (auth.uid() = user_id);

-- السماح بإنشاء mappings جديدة
CREATE POLICY "Allow creating tenant mappings" ON public.user_tenant_mapping
    FOR INSERT WITH CHECK (true);

-- السماح للـ admins بتحديث mappings
CREATE POLICY "Allow updating tenant mappings" ON public.user_tenant_mapping
    FOR UPDATE USING (auth.uid() = user_id OR get_user_tenant() = tenant_id);

COMMENT ON TABLE public.user_tenant_mapping IS 'Maps users to tenants for multi-tenancy support';
COMMENT ON FUNCTION get_current_tenant_id IS 'Get current tenant ID from session variable';
COMMENT ON FUNCTION get_user_tenant IS 'Get tenant ID for current authenticated user';
COMMENT ON FUNCTION bind_user_to_tenant IS 'Bind a user to a tenant with a specific role';
