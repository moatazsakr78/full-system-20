// ==============================================
// NEXT.JS MIDDLEWARE - MULTI-TENANT ROUTING
// ==============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// قاعدة الدومين الأساسية
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'mysystem.com';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // تجاهل الطلبات للملفات الثابتة والـ API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // ملفات مثل favicon.ico, robots.txt
  ) {
    return NextResponse.next();
  }

  const hostname = request.headers.get('host') || '';
  const domain = hostname.split(':')[0]; // إزالة الـ port

  // تحديد نوع الدومين
  const isCustomDomain = !domain.endsWith(`.${BASE_DOMAIN}`) && domain !== BASE_DOMAIN;

  let tenantDomain: string;

  if (isCustomDomain) {
    // Custom domain
    tenantDomain = domain;
  } else {
    // Subdomain - استخراج الـ subdomain
    const parts = domain.split('.');
    if (parts.length < 2 || domain === BASE_DOMAIN) {
      // لا يوجد subdomain - توجيه لصفحة اختيار المتجر أو landing page
      return NextResponse.rewrite(new URL('/select-store', request.url));
    }
    tenantDomain = parts[0];
  }

  try {
    // جلب الـ tenant من database
    const supabase = createClient();

    const { data: tenant, error } = await supabase
      .rpc(
        isCustomDomain ? 'get_tenant_by_custom_domain' : 'get_tenant_by_subdomain',
        isCustomDomain
          ? { domain_param: tenantDomain }
          : { subdomain_param: tenantDomain }
      )
      .single();

    if (error || !tenant) {
      console.error('Tenant not found:', tenantDomain, error);

      // المتجر غير موجود - عرض صفحة 404 مخصصة
      return new NextResponse(
        `<html dir="rtl">
          <head><title>المتجر غير موجود</title></head>
          <body style="font-family: Cairo, sans-serif; text-align: center; padding: 50px;">
            <h1>عذراً، المتجر غير موجود</h1>
            <p>الدومين: <strong>${tenantDomain}</strong></p>
            <p>تأكد من صحة الرابط أو تواصل مع الدعم الفني</p>
          </body>
        </html>`,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }

    // التحقق من أن الـ tenant نشط
    if (!tenant.is_active) {
      return new NextResponse(
        `<html dir="rtl">
          <head><title>المتجر غير نشط</title></head>
          <body style="font-family: Cairo, sans-serif; text-align: center; padding: 50px;">
            <h1>المتجر غير نشط حالياً</h1>
            <p>يرجى التواصل مع مالك المتجر</p>
          </body>
        </html>`,
        {
          status: 403,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }

    // تعيين tenant context في Supabase
    await supabase.rpc('set_current_tenant', { tenant_uuid: tenant.id });

    // إضافة tenant info في الـ headers للصفحات
    const response = NextResponse.next();
    response.headers.set('x-tenant-id', tenant.id);
    response.headers.set('x-tenant-name', tenant.name);
    response.headers.set('x-tenant-subdomain', tenant.subdomain);

    return response;

  } catch (error) {
    console.error('Middleware error:', error);

    return new NextResponse(
      `<html dir="rtl">
        <head><title>خطأ</title></head>
        <body style="font-family: Cairo, sans-serif; text-align: center; padding: 50px;">
          <h1>حدث خطأ</h1>
          <p>يرجى المحاولة مرة أخرى</p>
        </body>
      </html>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}

// تكوين الـ matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
