'use client';

import { useState, useEffect } from 'react';
import { 
  UserGroupIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  ShieldCheckIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  UsersIcon,
  CogIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import TopHeader from '@/app/components/layout/TopHeader';
import Sidebar from '@/app/components/layout/Sidebar';
import ResizableTable from '@/app/components/tables/ResizableTable';
import TreeView, { TreeNode } from '@/app/components/TreeView';
import { supabase } from '@/app/lib/supabase/client';

interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  status: 'active' | 'inactive';
  permissions: string[];
  createdAt: string;
  lastModified: string;
}

interface User {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
  lastLogin: string | null;
  createdAt: string | null;
}

export default function PermissionsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'roles' | 'users' | 'permissions'>('roles');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [realUsers, setRealUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // جلب جميع المستخدمين من قاعدة البيانات
  useEffect(() => {
    const fetchRealUsers = async () => {
      setUsersLoading(true);
      try {
        // فحص حالة المصادقة أولاً
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔐 حالة المصادقة:', !!session);
        console.log('👤 المستخدم الحالي:', session?.user?.id);

        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, full_name, role, created_at')
          .order('created_at', { ascending: false });

        console.log('📊 البيانات المسترجعة:', data);
        console.log('❌ خطأ في الاستعلام:', error);
        console.log('🔢 عدد المستخدمين:', data?.length || 0);

        if (error) {
          console.error('❌ خطأ في جلب المستخدمين:', error);
          console.error('📋 تفاصيل الخطأ:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          setRealUsers([]);
        } else if (data && Array.isArray(data)) {
          const formattedUsers: User[] = data.map((user: any) => ({
            id: user.id || 'غير متوفر',
            name: user.full_name || user.name || 'مستخدم غير معروف',
            email: 'غير متوفر', // العمود غير موجود في قاعدة البيانات
            role: user.role || 'غير محدد',
            lastLogin: 'غير متوفر',
            createdAt: user.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : null
          }));
          
          console.log('✅ المستخدمين المنسقين:', formattedUsers);
          setRealUsers(formattedUsers);
        }
      } catch (err) {
        console.error('💥 خطأ عام:', err);
        setRealUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchRealUsers();
  }, []);

  const toggleTreeNode = (nodeId: string) => {
    const updateNode = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };
    
    setPermissionTreeData(updateNode(permissionTreeData));
  };

  // Sample permissions data
  const permissions: Permission[] = [
    { id: '1', module: 'المبيعات', action: 'قراءة', description: 'عرض بيانات المبيعات' },
    { id: '2', module: 'المبيعات', action: 'إضافة', description: 'إنشاء مبيعات جديدة' },
    { id: '3', module: 'المبيعات', action: 'تعديل', description: 'تعديل المبيعات الموجودة' },
    { id: '4', module: 'المبيعات', action: 'حذف', description: 'حذف المبيعات' },
    { id: '5', module: 'المنتجات', action: 'قراءة', description: 'عرض كتالوج المنتجات' },
    { id: '6', module: 'المنتجات', action: 'إضافة', description: 'إضافة منتجات جديدة' },
    { id: '7', module: 'المنتجات', action: 'تعديل', description: 'تعديل تفاصيل المنتجات' },
    { id: '8', module: 'المنتجات', action: 'حذف', description: 'حذف المنتجات' },
    { id: '9', module: 'المخزون', action: 'قراءة', description: 'عرض مستويات المخزون' },
    { id: '10', module: 'المخزون', action: 'تعديل', description: 'تحديث كميات المخزون' },
    { id: '11', module: 'العملاء', action: 'قراءة', description: 'عرض بيانات العملاء' },
    { id: '12', module: 'العملاء', action: 'إضافة', description: 'إضافة عملاء جدد' },
    { id: '13', module: 'العملاء', action: 'تعديل', description: 'تعديل بيانات العملاء' },
    { id: '14', module: 'الموردين', action: 'قراءة', description: 'عرض بيانات الموردين' },
    { id: '15', module: 'الموردين', action: 'إضافة', description: 'إضافة موردين جدد' },
    { id: '16', module: 'التقارير', action: 'قراءة', description: 'عرض التقارير المالية' },
    { id: '17', module: 'التقارير', action: 'تصدير', description: 'تصدير التقارير' },
    { id: '18', module: 'الإعدادات', action: 'قراءة', description: 'عرض الإعدادات' },
    { id: '19', module: 'الإعدادات', action: 'تعديل', description: 'تعديل إعدادات النظام' },
    { id: '20', module: 'الصلاحيات', action: 'إدارة', description: 'إدارة صلاحيات المستخدمين' },
  ];

  // Sample roles data
  const roles: Role[] = [
    {
      id: '1',
      name: 'المدير العام',
      description: 'صلاحيات كاملة لجميع وظائف النظام',
      userCount: 2,
      status: 'active',
      permissions: permissions.map(p => p.id),
      createdAt: '2024-01-15',
      lastModified: '2024-07-20'
    },
    {
      id: '2',
      name: 'مدير المبيعات',
      description: 'إدارة المبيعات والعملاء والتقارير التجارية',
      userCount: 5,
      status: 'active',
      permissions: ['1', '2', '3', '5', '11', '12', '13', '16', '17'],
      createdAt: '2024-01-20',
      lastModified: '2024-07-18'
    },
    {
      id: '3',
      name: 'أمين المخزن',
      description: 'إدارة المخزون والمنتجات والموردين',
      userCount: 3,
      status: 'active',
      permissions: ['5', '6', '7', '9', '10', '14', '15'],
      createdAt: '2024-02-01',
      lastModified: '2024-07-15'
    },
    {
      id: '4',
      name: 'كاشير',
      description: 'عمليات البيع الأساسية فقط',
      userCount: 8,
      status: 'active',
      permissions: ['1', '2', '5', '11'],
      createdAt: '2024-02-10',
      lastModified: '2024-07-10'
    },
    {
      id: '5',
      name: 'مراجع مالي',
      description: 'عرض التقارير المالية وتصديرها',
      userCount: 1,
      status: 'inactive',
      permissions: ['1', '16', '17'],
      createdAt: '2024-03-01',
      lastModified: '2024-06-30'
    }
  ];


  const [permissionTreeData, setPermissionTreeData] = useState<TreeNode[]>([
    {
      id: 'sales',
      name: 'المبيعات',
      isExpanded: false,
      children: [
        { id: 'sales-read', name: 'عرض المبيعات' },
        { id: 'sales-create', name: 'إنشاء مبيعات' },
        { id: 'sales-edit', name: 'تعديل المبيعات' },
        { id: 'sales-delete', name: 'حذف المبيعات' }
      ]
    },
    {
      id: 'products',
      name: 'المنتجات',
      isExpanded: false,
      children: [
        { id: 'products-read', name: 'عرض المنتجات' },
        { id: 'products-create', name: 'إضافة منتجات' },
        { id: 'products-edit', name: 'تعديل المنتجات' },
        { id: 'products-delete', name: 'حذف المنتجات' }
      ]
    },
    {
      id: 'inventory',
      name: 'المخزون',
      isExpanded: false,
      children: [
        { id: 'inventory-read', name: 'عرض المخزون' },
        { id: 'inventory-edit', name: 'تحديث المخزون' }
      ]
    },
    {
      id: 'customers',
      name: 'العملاء',
      isExpanded: false,
      children: [
        { id: 'customers-read', name: 'عرض العملاء' },
        { id: 'customers-create', name: 'إضافة عملاء' },
        { id: 'customers-edit', name: 'تعديل العملاء' }
      ]
    },
    {
      id: 'suppliers',
      name: 'الموردين',
      isExpanded: false,
      children: [
        { id: 'suppliers-read', name: 'عرض الموردين' },
        { id: 'suppliers-create', name: 'إضافة موردين' }
      ]
    },
    {
      id: 'reports',
      name: 'التقارير',
      isExpanded: false,
      children: [
        { id: 'reports-read', name: 'عرض التقارير' },
        { id: 'reports-export', name: 'تصدير التقارير' }
      ]
    },
    {
      id: 'settings',
      name: 'الإعدادات',
      isExpanded: false,
      children: [
        { id: 'settings-read', name: 'عرض الإعدادات' },
        { id: 'settings-edit', name: 'تعديل الإعدادات' }
      ]
    }
  ]);


  const roleColumns = [
    {
      id: 'name',
      header: 'اسم الدور',
      accessor: 'name' as keyof Role,
      width: 180,
      render: (value: any, role: Role) => (
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="h-4 w-4 text-blue-400" />
          <span className="font-medium text-white">{value}</span>
        </div>
      )
    },
    {
      id: 'description',
      header: 'الوصف',
      accessor: 'description' as keyof Role,
      width: 300,
      render: (value: any) => (
        <span className="text-gray-300 text-sm">{value}</span>
      )
    },
    {
      id: 'userCount',
      header: 'عدد المستخدمين',
      accessor: 'userCount' as keyof Role,
      width: 120,
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <UsersIcon className="h-4 w-4 text-gray-400" />
          <span className="text-white">{value}</span>
        </div>
      )
    },
    {
      id: 'status',
      header: 'الحالة',
      accessor: 'status' as keyof Role,
      width: 100,
      render: (value: any, role: Role) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${role.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-sm ${role.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
            {role.status === 'active' ? 'نشط' : 'غير نشط'}
          </span>
        </div>
      )
    },
    {
      id: 'lastModified',
      header: 'آخر تعديل',
      accessor: 'lastModified' as keyof Role,
      width: 120,
      render: (value: any) => (
        <span className="text-gray-400 text-sm">{value}</span>
      )
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      accessor: 'id' as keyof Role,
      width: 120,
      render: (value: any, role: Role) => (
        <div className="flex items-center gap-1">
          <button className="p-1 text-gray-400 hover:text-blue-400 transition-colors">
            <EyeIcon className="h-4 w-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-yellow-400 transition-colors">
            <PencilIcon className="h-4 w-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-red-400 transition-colors">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const userColumns = [
    {
      id: 'name',
      header: 'اسم المستخدم',
      accessor: 'name' as keyof User,
      width: 200,
      render: (value: any, user: User) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">{value?.charAt(0) || 'U'}</span>
          </div>
          <div>
            <div className="text-white font-medium">{value || 'غير محدد'}</div>
            <div className="text-gray-400 text-xs">{user.email || 'لا يوجد إيميل'}</div>
          </div>
        </div>
      )
    },
    {
      id: 'role',
      header: 'الدور',
      accessor: 'role' as keyof User,
      width: 150,
      render: (value: any) => (
        <span className={`px-2 py-1 text-white text-xs rounded-full ${
          value ? 'bg-blue-600' : 'bg-gray-600'
        }`}>
          {value || 'غير محدد'}
        </span>
      )
    },
    {
      id: 'lastLogin',
      header: 'آخر تسجيل دخول',
      accessor: 'lastLogin' as keyof User,
      width: 150,
      render: (value: any) => (
        <span className="text-gray-400 text-sm">{value || 'غير متوفر'}</span>
      )
    },
    {
      id: 'createdAt',
      header: 'تاريخ الإنشاء',
      accessor: 'createdAt' as keyof User,
      width: 120,
      render: (value: any) => (
        <span className="text-gray-400 text-sm">{value || 'غير متوفر'}</span>
      )
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      accessor: 'id' as keyof User,
      width: 120,
      render: (value: any, user: User) => (
        <div className="flex items-center gap-1">
          <button className="p-1 text-gray-400 hover:text-blue-400 transition-colors">
            <EyeIcon className="h-4 w-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-yellow-400 transition-colors">
            <PencilIcon className="h-4 w-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-red-400 transition-colors">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const permissionColumns = [
    {
      id: 'module',
      header: 'الوحدة',
      accessor: 'module' as keyof Permission,
      width: 150,
      render: (value: any) => (
        <span className="font-medium text-blue-400">{value}</span>
      )
    },
    {
      id: 'action',
      header: 'الإجراء',
      accessor: 'action' as keyof Permission,
      width: 120,
      render: (value: any) => (
        <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded-full">{value}</span>
      )
    },
    {
      id: 'description',
      header: 'الوصف',
      accessor: 'description' as keyof Permission,
      width: 300,
      render: (value: any) => (
        <span className="text-gray-300 text-sm">{value}</span>
      )
    }
  ];

  const getCurrentData = () => {
    switch (activeView) {
      case 'roles':
        return roles;
      case 'users':
        return realUsers;
      case 'permissions':
        return permissions;
      default:
        return [];
    }
  };

  const getCurrentColumns = () => {
    switch (activeView) {
      case 'roles':
        return roleColumns;
      case 'users':
        return userColumns;
      case 'permissions':
        return permissionColumns;
      default:
        return [];
    }
  };

  const getActionButtons = () => {
    switch (activeView) {
      case 'roles':
        return [
          { icon: UserGroupIcon, label: 'دور جديد', action: () => {} },
          { icon: PencilIcon, label: 'تعديل', action: () => {} },
          { icon: TrashIcon, label: 'حذف', action: () => {} },
          { icon: ClipboardDocumentListIcon, label: 'تصدير', action: () => {} }
        ];
      case 'users':
        return [
          { icon: UserPlusIcon, label: 'مستخدم جديد', action: () => {} },
          { icon: PencilIcon, label: 'تعديل', action: () => {} },
          { icon: LockClosedIcon, label: 'إعادة تعيين كلمة مرور', action: () => {} },
          { icon: TrashIcon, label: 'حذف', action: () => {} }
        ];
      case 'permissions':
        return [
          { icon: KeyIcon, label: 'صلاحية جديدة', action: () => {} },
          { icon: CogIcon, label: 'إعدادات', action: () => {} },
          { icon: ClipboardDocumentListIcon, label: 'تصدير', action: () => {} }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="h-screen bg-[#2B3544] overflow-hidden">
      <TopHeader onMenuClick={toggleSidebar} isMenuOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      <div className="h-full pt-12 overflow-hidden flex flex-col">
        {/* Top Action Buttons Toolbar */}
        <div className="bg-[#374151] border-b border-gray-600 px-4 py-2 w-full">
          <div className="flex items-center justify-start gap-1">
            {getActionButtons().map((button, index) => (
              <button
                key={index}
                onClick={button.action}
                className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px] transition-colors"
              >
                <button.icon className="h-5 w-5 mb-1" />
                <span className="text-sm">{button.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - View Selector and Tree */}
          <div className="w-64 bg-[#374151] border-l border-gray-700 flex flex-col">
            {/* View Selector */}
            <div className="p-4 border-b border-gray-600">
              <h3 className="text-white font-medium mb-3">إدارة الصلاحيات</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveView('roles')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    activeView === 'roles' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                  }`}
                >
                  <ShieldCheckIcon className="h-4 w-4" />
                  الأدوار
                </button>
                <button
                  onClick={() => setActiveView('users')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    activeView === 'users' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                  }`}
                >
                  <UsersIcon className="h-4 w-4" />
                  المستخدمين
                </button>
                <button
                  onClick={() => setActiveView('permissions')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    activeView === 'permissions' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                  }`}
                >
                  <KeyIcon className="h-4 w-4" />
                  الصلاحيات
                </button>
              </div>
            </div>

            {/* Permissions Tree - Only show when viewing permissions */}
            {activeView === 'permissions' && (
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="p-4">
                  <h4 className="text-gray-300 text-sm font-medium mb-3">شجرة الصلاحيات</h4>
                  <TreeView 
                    data={permissionTreeData}
                    onItemClick={(item) => {
                      console.log('Permission clicked:', item);
                    }}
                    onToggle={toggleTreeNode}
                  />
                </div>
              </div>
            )}

            {/* Role Statistics - Only show when viewing roles */}
            {activeView === 'roles' && (
              <div className="p-4">
                <h4 className="text-gray-300 text-sm font-medium mb-3">إحصائيات الأدوار</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">إجمالي الأدوار:</span>
                    <span className="text-white font-medium">{roles.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">الأدوار النشطة:</span>
                    <span className="text-green-400 font-medium">
                      {roles.filter(r => r.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">إجمالي المستخدمين:</span>
                    <span className="text-blue-400 font-medium">
                      {roles.reduce((sum, role) => sum + role.userCount, 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* User Statistics - Only show when viewing users */}
            {activeView === 'users' && (
              <div className="p-4">
                <h4 className="text-gray-300 text-sm font-medium mb-3">إحصائيات المستخدمين</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">إجمالي المستخدمين:</span>
                    <span className="text-white font-medium">{realUsers.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">لديهم أدوار:</span>
                    <span className="text-blue-400 font-medium">
                      {realUsers.filter(u => u.role && u.role !== 'غير محدد').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">بدون أدوار:</span>
                    <span className="text-orange-400 font-medium">
                      {realUsers.filter(u => !u.role || u.role === 'غير محدد').length}
                    </span>
                  </div>
                  {usersLoading && (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                      <span className="mr-2 text-gray-400 text-xs">جاري التحميل...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Secondary Toolbar - Search and Controls */}
            <div className="bg-[#374151] border-b border-gray-600 px-6 py-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Search Input */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-80 pl-4 pr-10 py-2 bg-[#2B3544] border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder={`البحث في ${
                        activeView === 'roles' ? 'الأدوار' : 
                        activeView === 'users' ? 'المستخدمين' : 'الصلاحيات'
                      }...`}
                    />
                  </div>

                  {/* View Toggle */}
                  <div className="flex bg-[#2B3544] rounded-md overflow-hidden">
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-2 transition-colors ${
                        viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600'
                      }`}
                    >
                      <ListBulletIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-2 transition-colors ${
                        viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600'
                      }`}
                    >
                      <Squares2X2Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Current View Title */}
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-medium">
                    {activeView === 'roles' ? 'إدارة الأدوار' : 
                     activeView === 'users' ? 'إدارة المستخدمين' : 'إدارة الصلاحيات'}
                  </h2>
                  <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                    {getCurrentData().length}
                  </span>
                </div>
              </div>
            </div>

            {/* Data Table Container */}
            <div className="flex-1 overflow-hidden bg-[#2B3544]">
              <ResizableTable
                columns={getCurrentColumns()}
                data={getCurrentData()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}