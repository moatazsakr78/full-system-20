'use client';

import { ShieldExclamationIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { getUnauthorizedRedirect, UserRole } from '@/app/lib/auth/roleBasedAccess';

interface UnauthorizedAccessProps {
  userRole: UserRole | null;
  message?: string;
}

export default function UnauthorizedAccess({ userRole, message }: UnauthorizedAccessProps) {
  const router = useRouter();

  const defaultMessage = 'هذه الصفحة للمشرفين فقط، غير مصرح لك بالدخول';
  const displayMessage = message || defaultMessage;
  
  const handleGoBack = () => {
    const redirectPath = getUnauthorizedRedirect(userRole);
    router.push(redirectPath);
  };

  return (
    <div className="min-h-screen bg-[#2B3544] flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <ShieldExclamationIcon className="mx-auto h-24 w-24 text-red-400 mb-6" />
        
        <h1 className="text-3xl font-bold text-white mb-4">
          غير مصرح بالوصول
        </h1>
        
        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
          {displayMessage}
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <HomeIcon className="h-5 w-5" />
            العودة للصفحة الرئيسية
          </button>
          
          <button
            onClick={() => router.back()}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            العودة للصفحة السابقة
          </button>
        </div>
        
        {/* Role Info */}
        {userRole && (
          <div className="mt-8 p-4 bg-[#374151] rounded-lg">
            <p className="text-gray-400 text-sm">
              دورك الحالي: <span className="text-white font-medium">{userRole}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}