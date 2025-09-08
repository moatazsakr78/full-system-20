'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/app/lib/supabase/client';
import { 
  hasPageAccess, 
  getUserRoleFromProfile, 
  UserRole, 
  getUnauthorizedMessage,
  getUnauthorizedRedirect 
} from '@/app/lib/auth/roleBasedAccess';

interface UseRoleAccessReturn {
  userRole: UserRole | null;
  hasAccess: boolean;
  isLoading: boolean;
  unauthorizedMessage: string;
  checkAccess: (path?: string) => boolean;
  redirectToAuthorized: () => void;
}

export const useRoleAccess = (requiredPath?: string): UseRoleAccessReturn => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  const currentPath = requiredPath || pathname;

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setUserRole(null);
          setIsLoading(false);
          return;
        }

        // Get user profile with role information
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role, is_admin')
          .eq('id', session.user.id)
          .single();

        if (error || !profile) {
          console.error('Error fetching user profile:', error);
          setUserRole(null);
        } else if (profile && 'role' in profile && 'is_admin' in profile) {
          const role = getUserRoleFromProfile(profile.role as string | null, profile.is_admin as boolean);
          setUserRole(role);
        } else {
          console.error('Invalid profile structure:', profile);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error in getUserRole:', error);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUserRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUserRole();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAccess = (path?: string): boolean => {
    const pathToCheck = path || currentPath;
    return userRole && pathToCheck ? hasPageAccess(userRole, pathToCheck) : false;
  };

  const redirectToAuthorized = () => {
    const redirectPath = getUnauthorizedRedirect(userRole);
    router.push(redirectPath);
  };

  const hasAccess = checkAccess();
  const unauthorizedMessage = getUnauthorizedMessage(userRole);

  return {
    userRole,
    hasAccess,
    isLoading,
    unauthorizedMessage,
    checkAccess,
    redirectToAuthorized
  };
};

// Hook specifically for protecting pages
export const usePageProtection = (redirectOnUnauthorized: boolean = false) => {
  const { userRole, hasAccess, isLoading, redirectToAuthorized } = useRoleAccess();

  useEffect(() => {
    if (!isLoading && !hasAccess && redirectOnUnauthorized) {
      redirectToAuthorized();
    }
  }, [isLoading, hasAccess, redirectOnUnauthorized, redirectToAuthorized]);

  return {
    userRole,
    hasAccess,
    isLoading,
    shouldRender: isLoading || hasAccess
  };
};