'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { useAuth } from '@/lib/useAuth';

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
    if (!isAuthenticated || !user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setError(error.message);
          setProfile(null);
        } else {
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

    fetchProfile();
  }, [user, isAuthenticated]);

  return {
    profile,
    loading,
    error,
    isAdmin: profile?.is_admin ?? false,
    hasProfile: !!profile
  };
}