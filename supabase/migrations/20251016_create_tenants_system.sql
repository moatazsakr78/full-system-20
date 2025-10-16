-- ==============================================
-- MULTI-TENANT SYSTEM SETUP
-- ==============================================

-- إنشاء جدول tenants
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    custom_domain TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    settings JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- إضافة indexes للأداء
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON public.tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON public.tenants(custom_domain);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON public.tenants(is_active);

-- إضافة updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- RPC FUNCTIONS
-- ==============================================

-- جلب tenant من subdomain
CREATE OR REPLACE FUNCTION get_tenant_by_subdomain(subdomain_param TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    subdomain TEXT,
    custom_domain TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    settings JSONB,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name, t.subdomain, t.custom_domain, t.is_active,
           t.created_at, t.updated_at, t.settings, t.metadata
    FROM public.tenants t
    WHERE t.subdomain = subdomain_param AND t.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- جلب tenant من custom domain
CREATE OR REPLACE FUNCTION get_tenant_by_custom_domain(domain_param TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    subdomain TEXT,
    custom_domain TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    settings JSONB,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name, t.subdomain, t.custom_domain, t.is_active,
           t.created_at, t.updated_at, t.settings, t.metadata
    FROM public.tenants t
    WHERE t.custom_domain = domain_param AND t.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- جلب tenant من أي domain
CREATE OR REPLACE FUNCTION get_tenant_by_domain(domain_param TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    subdomain TEXT,
    custom_domain TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    settings JSONB,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name, t.subdomain, t.custom_domain, t.is_active,
           t.created_at, t.updated_at, t.settings, t.metadata
    FROM public.tenants t
    WHERE (t.subdomain = domain_param OR t.custom_domain = domain_param)
      AND t.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تعيين tenant context (متغير جلسة)
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_uuid UUID)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_uuid::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- جلب tenant_id للمستخدم
CREATE OR REPLACE FUNCTION get_user_tenant_id(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
    tenant_id UUID;
BEGIN
    -- هنا يمكن إضافة logic للربط بين المستخدم والـ tenant
    -- حاليا نرجع null
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- التحقق من انتماء المستخدم للـ tenant
CREATE OR REPLACE FUNCTION user_belongs_to_tenant(user_uuid UUID, tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- هنا يمكن إضافة logic للتحقق
    -- حاليا نرجع true للسماح بالوصول
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء tenant جديد
CREATE OR REPLACE FUNCTION create_new_tenant(
    subdomain_param TEXT,
    name_param TEXT,
    owner_email TEXT
)
RETURNS UUID AS $$
DECLARE
    new_tenant_id UUID;
BEGIN
    INSERT INTO public.tenants (subdomain, name)
    VALUES (subdomain_param, name_param)
    RETURNING id INTO new_tenant_id;

    RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- إضافة tenant افتراضي للدومين الحالي
-- ==============================================

-- إضافة tenant لـ omelarosa.store
INSERT INTO public.tenants (name, subdomain, custom_domain, is_active)
VALUES ('Omelarosa Store', 'omelarosa', 'omelarosa.store', true)
ON CONFLICT (subdomain) DO NOTHING;

-- إضافة tenant مع www أيضاً
INSERT INTO public.tenants (name, subdomain, custom_domain, is_active)
VALUES ('Omelarosa Store (www)', 'omelarosa-www', 'www.omelarosa.store', true)
ON CONFLICT (subdomain) DO NOTHING;

-- ==============================================
-- RLS POLICIES (اختياري)
-- ==============================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة للجميع (للـ middleware)
CREATE POLICY "Allow read access to all users" ON public.tenants
    FOR SELECT USING (true);

-- السماح بالإدراج والتحديث للمصادقين فقط
CREATE POLICY "Allow insert for authenticated users" ON public.tenants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.tenants
    FOR UPDATE USING (auth.role() = 'authenticated');

COMMENT ON TABLE public.tenants IS 'Multi-tenant system - stores information about each tenant/store';
COMMENT ON FUNCTION get_tenant_by_subdomain IS 'Get tenant by subdomain';
COMMENT ON FUNCTION get_tenant_by_custom_domain IS 'Get tenant by custom domain';
COMMENT ON FUNCTION get_tenant_by_domain IS 'Get tenant by any domain (subdomain or custom)';
