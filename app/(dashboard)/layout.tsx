'use client';

import { usePageProtection } from '@/app/lib/hooks/useRoleAccess';
import UnauthorizedAccess from '@/app/components/auth/UnauthorizedAccess';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userRole, hasAccess, isLoading } = usePageProtection();

  // Check if user has admin access (موظف or أدمن رئيسي)
  const hasAdminAccess = userRole === 'موظف' || userRole === 'أدمن رئيسي';

  // Show unauthorized page if user is authenticated but doesn't have access
  // Only show this if we're not loading and the user is clearly unauthorized
  if (!isLoading && userRole && !hasAdminAccess) {
    return (
      <UnauthorizedAccess 
        userRole={userRole}
        message="هذه الصفحة للمشرفين فقط، غير مصرح لك بالدخول"
      />
    );
  }

  // Render children - let individual pages handle their own loading states
  // This includes the loading state while checking permissions
  return <>{children}</>;
}