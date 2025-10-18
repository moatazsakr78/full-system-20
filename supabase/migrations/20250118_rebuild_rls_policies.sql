-- ==============================================
-- REBUILD RLS POLICIES - STRICT TENANT ISOLATION
-- Migration: إعادة بناء صارمة لجميع سياسات RLS
-- ==============================================

-- ⚠️ IMPORTANT: هذا Migration يحذف جميع Policies القديمة ويستبدلها بـ policies صارمة
-- لضمان Data Isolation الكامل بين الـ Tenants

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- حذف جميع الـ policies القديمة (ماعدا tenants و user_tenant_mapping)
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename NOT IN ('tenants', 'user_tenant_mapping')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            policy_record.policyname,
            policy_record.schemaname,
            policy_record.tablename
        );
    END LOOP;

    RAISE NOTICE '🗑️ Deleted old RLS policies';
END $$;

-- ==============================================
-- STRICT TENANT ISOLATION POLICY TEMPLATE
-- ==============================================

-- دالة helper لإنشاء policies موحدة
CREATE OR REPLACE FUNCTION create_tenant_isolation_policies(table_name TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Policy للقراءة (SELECT)
    EXECUTE format('
        CREATE POLICY %I ON public.%I
        FOR SELECT
        TO public
        USING (tenant_id = current_tenant_id())
    ', 'tenant_isolation_select_' || table_name, table_name);

    -- Policy للإدراج (INSERT)
    EXECUTE format('
        CREATE POLICY %I ON public.%I
        FOR INSERT
        TO public
        WITH CHECK (tenant_id = current_tenant_id())
    ', 'tenant_isolation_insert_' || table_name, table_name);

    -- Policy للتحديث (UPDATE)
    EXECUTE format('
        CREATE POLICY %I ON public.%I
        FOR UPDATE
        TO public
        USING (tenant_id = current_tenant_id())
        WITH CHECK (tenant_id = current_tenant_id())
    ', 'tenant_isolation_update_' || table_name, table_name);

    -- Policy للحذف (DELETE)
    EXECUTE format('
        CREATE POLICY %I ON public.%I
        FOR DELETE
        TO public
        USING (tenant_id = current_tenant_id())
    ', 'tenant_isolation_delete_' || table_name, table_name);

    RAISE NOTICE '✅ Created strict isolation policies for: %', table_name;
END;
$$;

-- ==============================================
-- تطبيق Policies على جميع الجداول
-- ==============================================

-- ✅ Products and related tables
SELECT create_tenant_isolation_policies('products');
SELECT create_tenant_isolation_policies('product_images');
SELECT create_tenant_isolation_policies('product_videos');
SELECT create_tenant_isolation_policies('product_variants');
SELECT create_tenant_isolation_policies('product_sizes');
SELECT create_tenant_isolation_policies('product_size_groups');
SELECT create_tenant_isolation_policies('product_size_group_items');
SELECT create_tenant_isolation_policies('product_ratings');
SELECT create_tenant_isolation_policies('product_cost_tracking');
SELECT create_tenant_isolation_policies('product_location_thresholds');

-- ✅ Categories
SELECT create_tenant_isolation_policies('categories');
SELECT create_tenant_isolation_policies('store_categories');
SELECT create_tenant_isolation_policies('store_category_products');

-- ✅ Inventory
SELECT create_tenant_isolation_policies('inventory');
SELECT create_tenant_isolation_policies('branch_stocks');
SELECT create_tenant_isolation_policies('warehouse_stocks');
SELECT create_tenant_isolation_policies('warehouses');

-- ✅ Sales and Orders
SELECT create_tenant_isolation_policies('sales');
SELECT create_tenant_isolation_policies('sale_items');
SELECT create_tenant_isolation_policies('orders');
SELECT create_tenant_isolation_policies('order_items');

-- ✅ Customers and Suppliers
SELECT create_tenant_isolation_policies('customers');
SELECT create_tenant_isolation_policies('customer_groups');
SELECT create_tenant_isolation_policies('customer_payments');
SELECT create_tenant_isolation_policies('suppliers');
SELECT create_tenant_isolation_policies('supplier_groups');
SELECT create_tenant_isolation_policies('supplier_payments');

-- ✅ Purchases
SELECT create_tenant_isolation_policies('purchase_invoices');
SELECT create_tenant_isolation_policies('purchase_invoice_items');

-- ✅ Branches and Locations
SELECT create_tenant_isolation_policies('branches');
SELECT create_tenant_isolation_policies('shipping_areas');
SELECT create_tenant_isolation_policies('shipping_governorates');
SELECT create_tenant_isolation_policies('shipping_companies');

-- ✅ Finance
SELECT create_tenant_isolation_policies('expenses');
SELECT create_tenant_isolation_policies('cashbox_entries');
SELECT create_tenant_isolation_policies('payment_receipts');
SELECT create_tenant_isolation_policies('payment_methods');

-- ✅ Settings and Preferences
SELECT create_tenant_isolation_policies('system_settings');
SELECT create_tenant_isolation_policies('custom_sections');
SELECT create_tenant_isolation_policies('custom_currencies');
SELECT create_tenant_isolation_policies('store_theme_colors');

-- ✅ User-related
SELECT create_tenant_isolation_policies('user_profiles');
SELECT create_tenant_isolation_policies('user_roles');
SELECT create_tenant_isolation_policies('user_preferences');
SELECT create_tenant_isolation_policies('user_column_preferences');

-- ✅ Other
SELECT create_tenant_isolation_policies('records');
SELECT create_tenant_isolation_policies('pos_tabs_state');
SELECT create_tenant_isolation_policies('favorites');

-- ==============================================
-- SPECIAL CASE: Cart Items (يسمح للـ anonymous)
-- ==============================================

DROP POLICY IF EXISTS tenant_isolation_select_cart_items ON public.cart_items;
DROP POLICY IF EXISTS tenant_isolation_insert_cart_items ON public.cart_items;
DROP POLICY IF EXISTS tenant_isolation_update_cart_items ON public.cart_items;
DROP POLICY IF EXISTS tenant_isolation_delete_cart_items ON public.cart_items;
DROP POLICY IF EXISTS allow_all_cart_items ON public.cart_items;

-- Cart items: السماح للـ session (anonymous + authenticated)
CREATE POLICY "cart_items_tenant_isolation" ON public.cart_items
FOR ALL
TO public
USING (
    CASE
        WHEN auth.uid() IS NOT NULL THEN
            -- Authenticated users: must belong to tenant
            tenant_id = current_tenant_id()
        ELSE
            -- Anonymous users: allow if tenant matches session
            tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
    END
)
WITH CHECK (
    CASE
        WHEN auth.uid() IS NOT NULL THEN
            tenant_id = current_tenant_id()
        ELSE
            tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
    END
);

-- ==============================================
-- SPECIAL CASE: Tenants Table (Public Read)
-- ==============================================

-- حذف الـ policies القديمة أولاً
DROP POLICY IF EXISTS "Allow read access to all users" ON public.tenants;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.tenants;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.tenants;
DROP POLICY IF EXISTS tenant_isolation_tenants ON public.tenants;

-- السماح بالقراءة للجميع (للـ domain resolution)
CREATE POLICY "tenants_public_read" ON public.tenants
FOR SELECT
TO public
USING (is_active = true);

-- السماح بالإدراج للمصادقين فقط
CREATE POLICY "tenants_authenticated_insert" ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (true);

-- السماح بالتحديث للـ tenant owner فقط
CREATE POLICY "tenants_owner_update" ON public.tenants
FOR UPDATE
TO authenticated
USING (id = current_tenant_id())
WITH CHECK (id = current_tenant_id());

-- ==============================================
-- SPECIAL CASE: User Tenant Mapping
-- ==============================================

-- تم التعامل معها بالفعل في migration سابق، لكن نتأكد من وجودها
DROP POLICY IF EXISTS "Users can view their own tenant mappings" ON public.user_tenant_mapping;
DROP POLICY IF EXISTS "Allow creating tenant mappings" ON public.user_tenant_mapping;
DROP POLICY IF EXISTS "Allow updating tenant mappings" ON public.user_tenant_mapping;

-- المستخدم يشوف الـ mappings بتاعته بس
CREATE POLICY "user_tenant_mapping_own_read" ON public.user_tenant_mapping
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- السماح بإنشاء mappings (من خلال functions)
CREATE POLICY "user_tenant_mapping_insert" ON public.user_tenant_mapping
FOR INSERT
TO public
WITH CHECK (true);

-- السماح بالتحديث للـ mapping owner أو tenant admin
CREATE POLICY "user_tenant_mapping_update" ON public.user_tenant_mapping
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() OR
    verify_user_tenant_access(auth.uid(), tenant_id)
);

-- ==============================================
-- DROP OLD HELPER FUNCTION
-- ==============================================

DROP FUNCTION IF EXISTS create_tenant_isolation_policies(TEXT);

-- ==============================================
-- VERIFICATION
-- ==============================================

DO $$
DECLARE
    tables_with_rls INT;
    tables_total INT;
BEGIN
    -- عدد الجداول التي لديها RLS
    SELECT COUNT(*) INTO tables_with_rls
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
        SELECT tablename FROM pg_policies WHERE schemaname = 'public'
    );

    -- إجمالي الجداول
    SELECT COUNT(*) INTO tables_total
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS Policies Rebuild Complete!';
    RAISE NOTICE '📊 Tables with RLS: % / %', tables_with_rls, tables_total;
    RAISE NOTICE '🔒 Strict tenant isolation enabled';
    RAISE NOTICE '========================================';
END $$;
