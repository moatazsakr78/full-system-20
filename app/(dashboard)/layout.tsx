'use client';

import { usePageProtection } from '@/app/lib/hooks/useRoleAccess';
import UnauthorizedAccess from '@/app/components/auth/UnauthorizedAccess';

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen bg-[#2B3544] flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
      <p className="text-gray-300">جاري التحقق من الصلاحيات...</p>
    </div>
  </div>
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userRole, hasAccess, isLoading } = usePageProtection();

  // Show loading screen while checking permissions
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Check if user has admin access (موظف or أدمن رئيسي)
  const hasAdminAccess = userRole === 'موظف' || userRole === 'أدمن رئيسي';

  // Show unauthorized page if no access
  if (!hasAdminAccess) {
    return (
      <UnauthorizedAccess 
        userRole={userRole}
        message="هذه الصفحة للمشرفين فقط، غير مصرح لك بالدخول"
      />
    );
  }

  // Render children only if authorized
  return <>{children}</>;
}