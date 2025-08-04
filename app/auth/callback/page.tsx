'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error in auth callback:', error);
          router.push('/?error=auth_error');
          return;
        }

        if (data.session) {
          console.log('User authenticated successfully:', data.session.user.email);
          // Redirect to home page or where the user was before
          router.push('/');
        } else {
          console.log('No session found, redirecting to home');
          router.push('/');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        router.push('/?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#c0c0c0'}}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-['Cairo',Arial,sans-serif]">جاري تسجيل الدخول...</p>
      </div>
    </div>
  );
}