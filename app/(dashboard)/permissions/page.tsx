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
  ClipboardDocumentListIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import TopHeader from '@/app/components/layout/TopHeader';
import Sidebar from '@/app/components/layout/Sidebar';
import TreeView, { TreeNode } from '@/app/components/TreeView';
import ResizableTable from '@/app/components/tables/ResizableTable';
import AddPermissionModal from '@/app/components/AddPermissionModal';
import PermissionDetails from '@/app/components/PermissionDetails';
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
  permissions: string[];
  createdAt: string;
  lastModified: string;
  roleType: 'حقل رئيسي' | string;
  parentRole?: string;
  priceLevel?: number;
}

interface User {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
  lastLogin: string | null;
  createdAt: string | null;
}

interface ActionButton {
  icon: any;
  label: string;
  action: () => void;
  disabled?: boolean;
}

export default function PermissionsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'roles' | 'users' | 'permissions'>('roles');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedPermissionPage, setSelectedPermissionPage] = useState<{id: string, name: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [realUsers, setRealUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isAddPermissionModalOpen, setIsAddPermissionModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [derivedRoles, setDerivedRoles] = useState<Role[]>([]);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRolePriceLevel, setNewRolePriceLevel] = useState<number>(1);

  // Add new derived role function
  const handleAddDerivedRole = () => {
    if (!newRoleName.trim() || !newRoleDescription.trim()) return;
    
    const newRole: Role = {
      id: `derived_${Date.now()}`,
      name: newRoleName,
      description: newRoleDescription,
      userCount: 0,
      permissions: ['1', '5'], // Same as جملة role
      createdAt: new Date().toLocaleDateString('en-CA'),
      lastModified: new Date().toLocaleDateString('en-CA'),
      roleType: 'جملة',
      parentRole: 'جملة',
      priceLevel: newRolePriceLevel
    };
    
    setDerivedRoles(prev => [...prev, newRole]);
    
    // Clear form
    setNewRoleName('');
    setNewRoleDescription('');
    setNewRolePriceLevel(1);
    setIsAddRoleModalOpen(false);
  };

  // Edit derived role function
  const handleEditDerivedRole = (roleId: string) => {
    const roleToEdit = derivedRoles.find(role => role.id === roleId);
    if (roleToEdit) {
      setEditingRoleId(roleId);
      setNewRoleName(roleToEdit.name);
      setNewRoleDescription(roleToEdit.description);
      setNewRolePriceLevel(roleToEdit.priceLevel || 1);
      setIsEditRoleModalOpen(true);
    }
  };

  // Save edited role function
  const handleSaveEditedRole = () => {
    if (!newRoleName.trim() || !newRoleDescription.trim() || !editingRoleId) return;
    
    setDerivedRoles(prev => prev.map(role => 
      role.id === editingRoleId 
        ? {
            ...role,
            name: newRoleName,
            description: newRoleDescription,
            priceLevel: newRolePriceLevel,
            lastModified: new Date().toLocaleDateString('en-CA')
          }
        : role
    ));
    
    // Clear form and close modal
    setNewRoleName('');
    setNewRoleDescription('');
    setNewRolePriceLevel(1);
    setEditingRoleId(null);
    setIsEditRoleModalOpen(false);
  };

  // Delete derived role function
  const handleDeleteDerivedRole = (roleId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الدور؟\nسيتم حذف الدور نهائياً ولا يمكن التراجع عن هذا الإجراء.')) {
      setDerivedRoles(prev => prev.filter(role => role.id !== roleId));
      // إلغاء التحديد إذا كان الدور المحذوف محدداً
      if (selectedRoleId === roleId) {
        setSelectedRoleId(null);
      }
    }
  };

  // Cancel edit role function
  const handleCancelEditRole = () => {
    setNewRoleName('');
    setNewRoleDescription('');
    setNewRolePriceLevel(1);
    setEditingRoleId(null);
    setIsEditRoleModalOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };


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

  // تحديث أدوار المستخدمين حسب is_admin
  const updateUserRoles = async () => {
    try {
      // تحديث المستخدمين الذين is_admin = false ليصبح دورهم 'عميل'
      await supabase
        .from('user_profiles')
        .update({ role: 'عميل' })
        .eq('is_admin', false);

      // تحديث المستخدمين الذين is_admin = true ليصبح دورهم 'أدمن رئيسي'
      await supabase
        .from('user_profiles')
        .update({ role: 'أدمن رئيسي' })
        .eq('is_admin', true);

      console.log('✅ تم تحديث أدوار المستخدمين بنجاح');
    } catch (error) {
      console.error('❌ خطأ في تحديث الأدوار:', error);
    }
  };

  // تحديث دور مستخدم معين
  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdatingRole(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('❌ خطأ في تحديث الدور:', error);
        return false;
      }

      // تحديث البيانات محلياً
      setRealUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      setEditingUserId(null);
      console.log('✅ تم تحديث دور المستخدم بنجاح');
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث الدور:', error);
      return false;
    } finally {
      setUpdatingRole(false);
    }
  };

  // قائمة الأدوار المتاحة
  const availableRoles = ['عميل', 'جملة', 'موظف', 'أدمن رئيسي'];

  // جلب جميع المستخدمين من قاعدة البيانات
  useEffect(() => {
    const fetchRealUsers = async () => {
      setUsersLoading(true);
      try {
        // فحص حالة المصادقة أولاً
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔐 حالة المصادقة:', !!session);
        console.log('👤 المستخدم الحالي:', session?.user?.id);

        // تحديث الأدوار أولاً قبل جلب البيانات
        await updateUserRoles();

        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, full_name, role, is_admin, created_at')
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

  // Main 4 roles - Fixed roles that cannot be edited or deleted
  const mainRoles: Role[] = [
    {
      id: 'client',
      name: 'عميل',
      description: 'صلاحيات محدودة للوصول للمتجر وطلباته فقط',
      userCount: realUsers.filter(u => u.role === 'عميل').length,
      permissions: ['1', '5'], // Home page, view orders
      createdAt: '2024-01-01',
      lastModified: '2024-01-01',
      roleType: 'حقل رئيسي'
    },
    {
      id: 'wholesale',
      name: 'جملة',
      description: 'صلاحيات محدودة للوصول للمتجر وطلباته فقط مع أسعار الجملة',
      userCount: realUsers.filter(u => u.role === 'جملة').length,
      permissions: ['1', '5'], // Home page, view orders
      createdAt: '2024-01-01',
      lastModified: '2024-01-01',
      roleType: 'حقل رئيسي'
    },
    {
      id: 'employee',
      name: 'موظف',
      description: 'صلاحيات كاملة لجميع صفحات النظام والمتجر',
      userCount: realUsers.filter(u => u.role === 'موظف').length,
      permissions: permissions.map(p => p.id),
      createdAt: '2024-01-01',
      lastModified: '2024-01-01',
      roleType: 'حقل رئيسي'
    },
    {
      id: 'main_admin',
      name: 'أدمن رئيسي',
      description: 'صلاحيات كاملة لجميع صفحات النظام والمتجر مع إدارة كاملة',
      userCount: realUsers.filter(u => u.role === 'أدمن رئيسي').length,
      permissions: permissions.map(p => p.id),
      createdAt: '2024-01-01',
      lastModified: '2024-01-01',
      roleType: 'حقل رئيسي'
    }
  ];

  // Combine main roles with derived roles
  const roles = [...mainRoles, ...derivedRoles];



  const [permissionTreeData, setPermissionTreeData] = useState<TreeNode[]>([
    {
      id: 'admin-pages',
      name: 'صفحات الإدارة',
      isExpanded: true,
      children: [
        { id: 'pos', name: 'نقطة البيع' },
        { id: 'products', name: 'المنتجات' },
        { id: 'inventory', name: 'المخزون' },
        { id: 'customers', name: 'العملاء' },
        { id: 'suppliers', name: 'الموردين' },
        { id: 'customer-orders', name: 'طلبات العملاء' },
        { id: 'records', name: 'السجلات' },
        { id: 'reports', name: 'التقارير (غير مكتملة)' },
        { id: 'permissions', name: 'الصلاحيات' }
      ]
    },
    {
      id: 'store-pages',
      name: 'صفحات المتجر',
      isExpanded: false,
      children: [
        { id: 'store-customer-orders', name: 'طلبات العملاء' },
        { id: 'store-products', name: 'إدارة المنتجات' },
        { id: 'store-management', name: 'إدارة المتجر' },
        { id: 'shipping-details', name: 'تفاصيل الشحن' }
      ]
    }
  ]);




  const roleColumns = [
    {
      id: 'name',
      header: 'اسم الدور',
      accessor: 'name' as keyof Role,
      width: 200,
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
      width: 350,
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
      id: 'roleType',
      header: 'نوع الدور',
      accessor: 'roleType' as keyof Role,
      width: 150,
      render: (value: any, role: Role) => (
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            role.roleType === 'حقل رئيسي' 
              ? 'bg-purple-600/20 text-purple-300 border border-purple-600/30' 
              : 'bg-blue-600/20 text-blue-300 border border-blue-600/30'
          }`}>
            {role.roleType === 'حقل رئيسي' ? 'حقل رئيسي' : role.parentRole}
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
      width: 200,
      render: (value: any, user: User) => (
        <div className="flex items-center gap-2">
          {editingUserId === user.id ? (
            <div className="flex items-center gap-2 w-full">
              <select
                className="bg-[#2B3544] border border-gray-600 rounded-md px-2 py-1 text-white text-xs flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={value || 'عميل'}
                onChange={(e) => updateUserRole(user.id, e.target.value)}
                disabled={updatingRole}
              >
                {availableRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              {updatingRole && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              )}
              <button
                onClick={() => setEditingUserId(null)}
                className="text-gray-400 hover:text-gray-300 text-xs"
                disabled={updatingRole}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <span className={`px-2 py-1 text-white text-xs rounded-full ${
                value === 'عميل' || value === 'جملة' ? 'bg-green-600' :
                value === 'موظف' ? 'bg-blue-600' :
                value === 'أدمن رئيسي' ? 'bg-purple-600' : 'bg-gray-600'
              }`}>
                {value || 'غير محدد'}
              </span>
              <button
                onClick={() => setEditingUserId(user.id)}
                className="text-gray-400 hover:text-blue-400 text-xs"
              >
                <PencilIcon className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
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

  const getCurrentData = () => {
    switch (activeView) {
      case 'roles':
        return roles;
      case 'users':
        return realUsers;
      case 'permissions':
        return [];
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
        return [];
      default:
        return [];
    }
  };

  const getActionButtons = (): ActionButton[] => {
    switch (activeView) {
      case 'roles':
        const selectedRole = roles.find(r => r.id === selectedRoleId);
        
        if (!selectedRole) {
          // لا يوجد دور محدد
          return [
            { icon: UserGroupIcon, label: 'دور جديد', action: () => {}, disabled: true },
            { icon: PencilIcon, label: 'تعديل', action: () => {}, disabled: true },
            { icon: TrashIcon, label: 'حذف', action: () => {}, disabled: true },
            { icon: ClipboardDocumentListIcon, label: 'تصدير', action: () => {} }
          ];
        } else if (selectedRole.roleType === 'حقل رئيسي') {
          // دور رئيسي محدد
          if (selectedRole.name === 'جملة') {
            // دور الجملة يمكن إنشاء أدوار فرعية منه
            return [
              { 
                icon: UserGroupIcon, 
                label: 'دور جديد', 
                action: () => setIsAddRoleModalOpen(true), 
                disabled: false 
              },
              { icon: PencilIcon, label: 'تعديل', action: () => {}, disabled: true },
              { icon: TrashIcon, label: 'حذف', action: () => {}, disabled: true },
              { icon: ClipboardDocumentListIcon, label: 'تصدير', action: () => {} }
            ];
          } else {
            // باقي الأدوار الرئيسية لا يمكن تعديلها أو حذفها أو إنشاء أدوار منها
            return [
              { icon: UserGroupIcon, label: 'دور جديد', action: () => {}, disabled: true },
              { icon: PencilIcon, label: 'تعديل', action: () => {}, disabled: true },
              { icon: TrashIcon, label: 'حذف', action: () => {}, disabled: true },
              { icon: ClipboardDocumentListIcon, label: 'تصدير', action: () => {} }
            ];
          }
        } else {
          // دور فرعي محدد - يمكن تعديله وحذفه لكن لا يمكن إنشاء أدوار منه
          return [
            { icon: UserGroupIcon, label: 'دور جديد', action: () => {}, disabled: true },
            { 
              icon: PencilIcon, 
              label: 'تعديل', 
              action: () => handleEditDerivedRole(selectedRole.id), 
              disabled: false 
            },
            { 
              icon: TrashIcon, 
              label: 'حذف', 
              action: () => handleDeleteDerivedRole(selectedRole.id), 
              disabled: false 
            },
            { icon: ClipboardDocumentListIcon, label: 'تصدير', action: () => {} }
          ];
        }
      case 'users':
        return [
          { icon: UserPlusIcon, label: 'مستخدم جديد', action: () => {} },
          { icon: PencilIcon, label: 'تعديل', action: () => {} },
          { icon: LockClosedIcon, label: 'إعادة تعيين كلمة مرور', action: () => {} },
          { icon: TrashIcon, label: 'حذف', action: () => {} }
        ];
      case 'permissions':
        return [
          { icon: KeyIcon, label: 'صلاحية جديدة', action: () => setIsAddPermissionModalOpen(true) },
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
                disabled={button.disabled}
                className={`flex flex-col items-center p-2 min-w-[80px] transition-colors ${
                  button.disabled 
                    ? 'text-gray-600 cursor-not-allowed' 
                    : 'text-gray-300 hover:text-white cursor-pointer'
                }`}
                title={button.disabled ? 'الأدوار الأساسية لا يمكن تعديلها' : ''}
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
                    selectedId={selectedPermissionPage?.id}
                    onItemClick={(item) => {
                      if (item.children) {
                        toggleTreeNode(item.id);
                      } else {
                        // إذا كانت الصفحة محددة بالفعل، قم بإلغاء التحديد
                        if (selectedPermissionPage && selectedPermissionPage.id === item.id) {
                          setSelectedPermissionPage(null);
                        } else {
                          // إذا لم تكن محددة، قم بتحديدها
                          setSelectedPermissionPage({
                            id: item.id,
                            name: item.name
                          });
                        }
                      }
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
                    <span className="text-gray-400">الأدوار الرئيسية:</span>
                    <span className="text-green-400 font-medium">
                      {roles.filter(r => r.roleType === 'حقل رئيسي').length}
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
              {activeView === 'permissions' && selectedPermissionPage ? (
                <div className="p-6">
                  <PermissionDetails
                    pageName={selectedPermissionPage.name}
                    pageId={selectedPermissionPage.id}
                    onClose={() => setSelectedPermissionPage(null)}
                    isSelected={true}
                  />
                </div>
              ) : activeView === 'permissions' ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <KeyIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">إدارة الصلاحيات</h3>
                    <p className="text-gray-400 mb-6 max-w-md">
                      اختر صفحة من شجرة الصلاحيات على اليمين لعرض وإدارة الصلاحيات الخاصة بها
                    </p>
                    <div className="bg-[#374151] rounded-lg p-6 border border-gray-600 max-w-md mx-auto">
                      <h4 className="text-white font-medium mb-3">الصفحات المتاحة:</h4>
                      <div className="text-right space-y-2 text-sm text-gray-300">
                        <div>• نقطة البيع</div>
                        <div>• المنتجات</div>
                        <div>• المخزون</div>
                        <div>• العملاء والموردين</div>
                        <div>• طلبات العملاء والسجلات</div>
                        <div>• صفحات المتجر الإلكتروني</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <ResizableTable
                  columns={getCurrentColumns()}
                  data={getCurrentData()}
                  selectedRowId={activeView === 'roles' ? selectedRoleId : undefined}
                  onRowClick={(item) => {
                    if (activeView === 'roles') {
                      // إذا كان الصف محدد بالفعل، قم بإلغاء التحديد
                      if (selectedRoleId === item.id) {
                        setSelectedRoleId(null);
                      } else {
                        // وإلا حدد الصف الجديد
                        setSelectedRoleId(item.id);
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Permission Modal */}
      <AddPermissionModal
        isOpen={isAddPermissionModalOpen}
        onClose={() => setIsAddPermissionModalOpen(false)}
        onPermissionAdded={(permission) => {
          console.log('New permission added:', permission);
          // Here you would typically save to database
        }}
      />

      {/* Add Role Modal - Side Panel */}
      <>
        {/* Backdrop */}
        {isAddRoleModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsAddRoleModalOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed top-12 right-0 h-[calc(100vh-3rem)] w-[500px] bg-[#3A4553] z-50 transform transition-transform duration-300 ease-in-out ${
          isAddRoleModalOpen ? 'translate-x-0' : 'translate-x-full'
        } shadow-2xl`}>
          
          {/* Header */}
          <div className="bg-[#3A4553] px-4 py-3 flex items-center justify-start border-b border-[#4A5568]">
            <h2 className="text-white text-lg font-medium flex-1 text-right">إضافة دور جديد</h2>
            <button
              onClick={() => setIsAddRoleModalOpen(false)}
              className="text-white hover:text-gray-200 transition-colors ml-4"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Tab Navigation Bar */}
          <div className="bg-[#3A4553] border-b border-[#4A5568]">
            <div className="flex">
              <button className="relative px-6 py-3 text-sm font-medium text-[#5DADE2]">
                تفاصيل الدور
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5DADE2]"></div>
              </button>
            </div>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-4">
            
            {/* Role Name */}
            <div className="space-y-2">
              <label className="block text-white text-sm font-medium text-right">
                اسم الدور *
              </label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="أدخل اسم الدور"
                className="w-full px-3 py-2 bg-[#2B3441] border border-[#4A5568] rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5DADE2] focus:border-[#5DADE2] text-right text-sm"
              />
            </div>

            {/* Price Level */}
            <div className="space-y-2">
              <label className="block text-white text-sm font-medium text-right">
                مستوى السعر *
              </label>
              <select
                value={newRolePriceLevel}
                onChange={(e) => setNewRolePriceLevel(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#2B3441] border border-[#4A5568] rounded text-white focus:outline-none focus:ring-1 focus:ring-[#5DADE2] focus:border-[#5DADE2] text-right text-sm"
              >
                <option value={1}>سعر 1</option>
                <option value={2}>سعر 2</option>
                <option value={3}>سعر 3</option>
                <option value={4}>سعر 4</option>
              </select>
              <p className="text-gray-400 text-xs text-right">
                حدد مستوى السعر الذي سيربط بهذا الدور
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-white text-sm font-medium text-right">
                وصف الدور *
              </label>
              <textarea
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="أدخل وصف مفصل للدور"
                rows={4}
                className="w-full px-3 py-2 bg-[#2B3441] border border-[#4A5568] rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5DADE2] focus:border-[#5DADE2] text-right text-sm resize-none"
              />
            </div>

            {/* Role Info */}
            <div className="bg-blue-50/10 border border-blue-600/30 rounded-lg p-4">
              <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2 justify-end">
                <span>معلومات الدور</span>
                <ShieldCheckIcon className="h-4 w-4" />
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-300">فرعي</span>
                  <span className="text-gray-300">نوع الدور:</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-300">جملة</span>
                  <span className="text-gray-300">مشتق من:</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-300">نفس صلاحيات الجملة</span>
                  <span className="text-gray-300">الصلاحيات:</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#3A4553] border-t border-[#4A5568]">
            <div className="flex gap-2">
              <div className="flex-1"></div>
              
              {/* Cancel and Save buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddRoleModalOpen(false)}
                  className="bg-transparent hover:bg-gray-600/10 text-gray-300 border border-gray-600 hover:border-gray-500 px-4 py-2 text-sm font-medium transition-all duration-200 min-w-[80px] flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  إلغاء
                </button>
                <button
                  onClick={handleAddDerivedRole}
                  disabled={!newRoleName.trim() || !newRoleDescription.trim()}
                  className={`bg-transparent border px-4 py-2 text-sm font-medium transition-all duration-200 min-w-[80px] flex items-center gap-2 ${
                    !newRoleName.trim() || !newRoleDescription.trim()
                      ? 'border-gray-600 text-gray-500 cursor-not-allowed' 
                      : 'hover:bg-gray-600/10 text-gray-300 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  حفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      </>

      {/* Edit Role Modal - Side Panel */}
      <>
        {/* Backdrop */}
        {isEditRoleModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => handleCancelEditRole()}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed top-12 right-0 h-[calc(100vh-3rem)] w-[500px] bg-[#3A4553] z-50 transform transition-transform duration-300 ease-in-out ${
          isEditRoleModalOpen ? 'translate-x-0' : 'translate-x-full'
        } shadow-2xl`}>
          
          {/* Header */}
          <div className="bg-[#3A4553] px-4 py-3 flex items-center justify-start border-b border-[#4A5568]">
            <h2 className="text-white text-lg font-medium flex-1 text-right">تعديل الدور</h2>
            <button
              onClick={() => handleCancelEditRole()}
              className="text-white hover:text-gray-200 transition-colors ml-4"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Tab Navigation Bar */}
          <div className="bg-[#3A4553] border-b border-[#4A5568]">
            <div className="flex">
              <button className="relative px-6 py-3 text-sm font-medium text-[#5DADE2]">
                تفاصيل الدور
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5DADE2]"></div>
              </button>
            </div>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-4">
            
            {/* Role Name */}
            <div className="space-y-2">
              <label className="block text-white text-sm font-medium text-right">
                اسم الدور *
              </label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="أدخل اسم الدور"
                className="w-full px-3 py-2 bg-[#2B3441] border border-[#4A5568] rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5DADE2] focus:border-[#5DADE2] text-right text-sm"
              />
            </div>

            {/* Price Level */}
            <div className="space-y-2">
              <label className="block text-white text-sm font-medium text-right">
                مستوى السعر *
              </label>
              <select
                value={newRolePriceLevel}
                onChange={(e) => setNewRolePriceLevel(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#2B3441] border border-[#4A5568] rounded text-white focus:outline-none focus:ring-1 focus:ring-[#5DADE2] focus:border-[#5DADE2] text-right text-sm"
              >
                <option value={1}>سعر 1</option>
                <option value={2}>سعر 2</option>
                <option value={3}>سعر 3</option>
                <option value={4}>سعر 4</option>
              </select>
              <p className="text-gray-400 text-xs text-right">
                حدد مستوى السعر الذي سيربط بهذا الدور
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-white text-sm font-medium text-right">
                وصف الدور *
              </label>
              <textarea
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="أدخل وصف مفصل للدور"
                rows={4}
                className="w-full px-3 py-2 bg-[#2B3441] border border-[#4A5568] rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5DADE2] focus:border-[#5DADE2] text-right text-sm resize-none"
              />
            </div>

            {/* Role Info */}
            <div className="bg-blue-50/10 border border-blue-600/30 rounded-lg p-4">
              <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2 justify-end">
                <span>معلومات الدور</span>
                <ShieldCheckIcon className="h-4 w-4" />
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-300">فرعي</span>
                  <span className="text-gray-300">نوع الدور:</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-300">جملة</span>
                  <span className="text-gray-300">مشتق من:</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-300">نفس صلاحيات الجملة</span>
                  <span className="text-gray-300">الصلاحيات:</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#3A4553] border-t border-[#4A5568]">
            <div className="flex gap-2">
              <div className="flex-1"></div>
              
              {/* Cancel and Save buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCancelEditRole()}
                  className="bg-transparent hover:bg-gray-600/10 text-gray-300 border border-gray-600 hover:border-gray-500 px-4 py-2 text-sm font-medium transition-all duration-200 min-w-[80px] flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  إلغاء
                </button>
                <button
                  onClick={handleSaveEditedRole}
                  disabled={!newRoleName.trim() || !newRoleDescription.trim()}
                  className={`bg-transparent border px-4 py-2 text-sm font-medium transition-all duration-200 min-w-[80px] flex items-center gap-2 ${
                    !newRoleName.trim() || !newRoleDescription.trim()
                      ? 'border-gray-600 text-gray-500 cursor-not-allowed' 
                      : 'hover:bg-gray-600/10 text-gray-300 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  حفظ التعديل
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    </div>
  );
}