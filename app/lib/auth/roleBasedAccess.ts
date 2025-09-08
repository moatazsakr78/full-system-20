// Role-based access control utility
export type UserRole = 'عميل' | 'جملة' | 'موظف' | 'أدمن رئيسي';

// Define allowed pages for each role
export const rolePermissions: Record<UserRole, string[]> = {
  'عميل': [
    '/', // الصفحة الرئيسية للمتجر
    '/my-orders', // طلباتي
    '/store', // المتجر
    '/products' // المنتجات (للعرض فقط)
  ],
  'جملة': [
    '/', // الصفحة الرئيسية للمتجر
    '/my-orders', // طلباتي
    '/store', // المتجر
    '/products' // المنتجات (للعرض فقط)
  ],
  'موظف': [
    // Store pages
    '/',
    '/store',
    '/products',
    '/my-orders',
    '/customer-orders',
    '/admin/products',
    '/shipping',
    // System pages
    '/dashboard',
    '/pos',
    '/inventory',
    '/customers',
    '/suppliers',
    '/records',
    '/reports',
    '/permissions',
    '/settings'
  ],
  'أدمن رئيسي': [
    // All pages - full access
    '/',
    '/store',
    '/products',
    '/my-orders',
    '/customer-orders',
    '/admin/products',
    '/shipping',
    '/dashboard',
    '/pos',
    '/inventory',
    '/customers',
    '/suppliers',
    '/records',
    '/reports',
    '/permissions',
    '/settings'
  ]
};

// Check if user has access to a specific page
export const hasPageAccess = (userRole: UserRole | null, pagePath: string): boolean => {
  if (!userRole) return false;
  
  const allowedPages = rolePermissions[userRole];
  if (!allowedPages) return false;
  
  // Check exact match first
  if (allowedPages.includes(pagePath)) return true;
  
  // Check if it's a dynamic route or sub-path
  return allowedPages.some(allowedPath => {
    // Handle dynamic routes like /admin/products/[id]
    if (pagePath.startsWith(allowedPath + '/')) return true;
    
    // Handle exact dashboard routes
    if (allowedPath === '/dashboard' && pagePath.startsWith('/dashboard')) return true;
    
    return false;
  });
};

// Get user role based on is_admin flag (for backwards compatibility)
export const getUserRoleFromProfile = (role: string | null, isAdmin: boolean): UserRole => {
  // If role is already set to one of our main roles, use it
  if (role && ['عميل', 'جملة', 'موظف', 'أدمن رئيسي'].includes(role)) {
    return role as UserRole;
  }
  
  // Otherwise, determine from is_admin flag
  return isAdmin ? 'أدمن رئيسي' : 'عميل';
};

// Check if user is admin (employee or main admin)
export const isAdminRole = (userRole: UserRole | null): boolean => {
  return userRole === 'موظف' || userRole === 'أدمن رئيسي';
};

// Check if user is customer (client or wholesale)
export const isCustomerRole = (userRole: UserRole | null): boolean => {
  return userRole === 'عميل' || userRole === 'جملة';
};

// Get redirect path for unauthorized users
export const getUnauthorizedRedirect = (userRole: UserRole | null): string => {
  if (isCustomerRole(userRole)) {
    return '/'; // Redirect customers to store homepage
  }
  return '/dashboard'; // Redirect admins to dashboard
};

// Error message for unauthorized access
export const getUnauthorizedMessage = (userRole: UserRole | null): string => {
  if (isCustomerRole(userRole)) {
    return 'هذه الصفحة للمشرفين فقط، غير مصرح لك بالدخول';
  }
  return 'ليس لديك صلاحية للوصول إلى هذه الصفحة';
};