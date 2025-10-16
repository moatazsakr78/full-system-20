'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the code from URL params
        const code = searchParams?.get('code');

        if (code) {
          console.log('🔗 Processing auth code from URL');

          // Exchange code for session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('❌ Error exchanging code for session:', error);
            router.push('/?error=auth_error');
            return;
          }

          if (data.session) {
            console.log('✅ User authenticated successfully:', data.session.user.email);
            // Redirect to home page
            router.push('/');
          } else {
            console.log('⚠️ No session created, redirecting to home');
            router.push('/');
          }
        } else {
          // No code, try to get existing session
          console.log('📋 No code in URL, checking for existing session');
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error('❌ Error getting session:', error);
            router.push('/?error=auth_error');
            return;
          }

          if (data.session) {
            console.log('✅ Existing session found:', data.session.user.email);
            router.push('/');
          } else {
            console.log('⚠️ No session found, redirecting to home');
            router.push('/');
          }
        }
      } catch (error) {
        console.error('❌ Unexpected error in auth callback:', error);
        router.push('/?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#c0c0c0'}}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-['Cairo',Arial,sans-serif]">جاري تسجيل الدخول...</p>
      </div>
    </div>
  );
}