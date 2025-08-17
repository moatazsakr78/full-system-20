'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { useAuth } from '../useAuth';

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  branch_id: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
  is_admin: boolean;
  email: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useUserProfile() {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clear profile immediately when user logs out
    if (!isAuthenticated || !user) {
      console.log('🚪 User logged out or not authenticated, clearing profile');
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 useUserProfile: Fetching profile for user ID:', user.id);
        console.log('🔍 useUserProfile: User email:', user.email);

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('❌ Error fetching user profile:', error);
          setError(error.message);
          setProfile(null);
        } else {
          console.log('✅ User profile fetched:', data);
          console.log('🔒 Role:', (data as any)?.role);
          console.log('🔒 Is Admin:', (data as any)?.is_admin);
          console.log('🔒 Full profile data:', JSON.stringify(data, null, 2));
          // Type assertion to ensure we have the correct data structure
          setProfile(data as UserProfile);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to fetch user profile');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    // Always fetch profile when user changes (including on fresh login)
    fetchProfile();
  }, [user?.id, isAuthenticated]); // Use user.id specifically to trigger on user change

  const isAdmin = profile ? profile.is_admin === true : false;

  return {
    profile,
    loading,
    error,
    isAdmin,
    hasProfile: !!profile
  };
}