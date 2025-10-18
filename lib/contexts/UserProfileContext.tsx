'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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

interface UserProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  hasProfile: boolean;
  refetch: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track the last user ID we fetched to prevent duplicate fetches
  const lastFetchedUserId = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchProfile = async (userId: string) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      console.log('🔍 UserProfileContext: Fetching profile for user ID:', userId);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        setError(error.message);
        setProfile(null);
        lastFetchedUserId.current = null;
      } else {
        console.log('✅ User profile fetched:', data);
        console.log('🔒 Role:', data?.role);
        console.log('🔒 Is Admin:', data?.is_admin);
        setProfile(data as UserProfile);
        lastFetchedUserId.current = userId;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to fetch user profile');
      setProfile(null);
      lastFetchedUserId.current = null;
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    // Clear profile immediately when user logs out
    if (!isAuthenticated || !user) {
      console.log('🚪 User logged out or not authenticated, clearing profile');
      setProfile(null);
      setLoading(false);
      setError(null);
      lastFetchedUserId.current = null;
      return;
    }

    const userId = user.id;

    // Skip if we've already fetched this user
    if (lastFetchedUserId.current === userId) {
      // Data already loaded, set loading to false
      setLoading(false);
      return;
    }

    // Fetch profile when user ID changes
    fetchProfile(userId);
  }, [user?.id, isAuthenticated]);

  // ✨ Real-time subscription for profile changes
  useEffect(() => {
    if (!user?.id) return;

    console.log('👂 Setting up real-time subscription for user profile:', user.id);

    const subscription = supabase
      .channel(`user_profile_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Profile updated in real-time:', payload);

          if (payload.eventType === 'DELETE') {
            setProfile(null);
          } else {
            // Update profile with new data
            setProfile(payload.new as UserProfile);
            console.log('✅ Profile updated:', payload.new);
            console.log('🔒 New Role:', payload.new.role);
            console.log('🔒 New Is Admin:', payload.new.is_admin);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 Cleaning up real-time subscription');
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const refetch = async () => {
    if (user?.id) {
      lastFetchedUserId.current = null; // Force refetch
      await fetchProfile(user.id);
    }
  };

  const isAdmin = profile ? profile.is_admin === true : false;

  const value: UserProfileContextValue = {
    profile,
    loading,
    error,
    isAdmin,
    hasProfile: !!profile,
    refetch
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
