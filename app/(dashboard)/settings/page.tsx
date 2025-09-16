'use client';

import { useState, useEffect } from 'react';
import {
  CogIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  BellIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import TopHeader from '@/app/components/layout/TopHeader';
import Sidebar from '@/app/components/layout/Sidebar';

interface SettingsCategory {
  id: string;
  name: string;
  icon: any;
  description: string;
}

const settingsCategories: SettingsCategory[] = [
  {
    id: 'system',
    name: 'تصميم النظام',
    icon: CogIcon,
    description: 'إعدادات عامة للنظام والواجهة'
  },
  {
    id: 'language',
    name: 'اللغة',
    icon: GlobeAltIcon,
    description: 'إعدادات اللغة والترجمة'
  },
  {
    id: 'theme',
    name: 'المظهر',
    icon: PaintBrushIcon,
    description: 'إعدادات المظهر والألوان'
  },
  {
    id: 'notifications',
    name: 'الإشعارات',
    icon: BellIcon,
    description: 'إعدادات الإشعارات والتنبيهات'
  },
  {
    id: 'security',
    name: 'الأمان',
    icon: ShieldCheckIcon,
    description: 'إعدادات الأمان وكلمات المرور'
  }
];


export default function SettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('system');

  // System Settings State
  const [language, setLanguage] = useState('Arabic');
  const [direction, setDirection] = useState('rtl');
  const [theme, setTheme] = useState('dark');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [enableSounds, setEnableSounds] = useState(false);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [fontSize, setFontSize] = useState(100);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [showToday, setShowToday] = useState(true);
  const [position, setPosition] = useState('top');
  const [selectedColumns, setSelectedColumns] = useState({
    product: true,
    category: true,
    price: false,
    quantity: true,
    actions: false
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCheckboxChange = (column: string, checked: boolean) => {
    setSelectedColumns(prev => ({
      ...prev,
      [column]: checked
    }));
  };

  const renderSystemSettings = () => {
    return (
      <div className="space-y-6 max-w-4xl">

        {/* Settings Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Language Settings */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">اللغة</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-[#2B3544] border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="Arabic">Arabic</option>
                <option value="English">English</option>
              </select>
            </div>

            {/* Direction */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">اتجاه المحتوى</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full px-3 py-2 bg-[#2B3544] border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="rtl">من اليمين إلى اليسار</option>
                <option value="ltr">من اليسار إلى اليمين</option>
              </select>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">نظام الألوان</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-2 bg-[#2B3544] border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="dark">داكن عالي</option>
                <option value="light">فاتح ليالي</option>
              </select>
            </div>

            {/* Text Size */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">حجم النص / صف صغير</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSize(Math.max(50, fontSize - 10))}
                  className="px-2 py-1 bg-[#374151] hover:bg-gray-600 rounded text-white"
                >
                  -
                </button>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="flex-1"
                />
                <button
                  onClick={() => setFontSize(Math.min(150, fontSize + 10))}
                  className="px-2 py-1 bg-[#374151] hover:bg-gray-600 rounded text-white"
                >
                  +
                </button>
              </div>
              <div className="text-center text-white text-sm mt-1">{fontSize}%</div>
            </div>

            {/* Rows per page */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">عدد الصفوف / لصفحة</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRowsPerPage(Math.max(1, rowsPerPage - 1))}
                  className="px-2 py-1 bg-[#374151] hover:bg-gray-600 rounded text-white"
                >
                  -
                </button>
                <input
                  type="number"
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-[#2B3544] border border-gray-600 rounded text-white text-center"
                />
                <button
                  onClick={() => setRowsPerPage(rowsPerPage + 1)}
                  className="px-2 py-1 bg-[#374151] hover:bg-gray-600 rounded text-white"
                >
                  +
                </button>
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">موقع الإشعار</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 bg-[#2B3544] border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="top">أعلى</option>
                <option value="bottom">أسفل</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Animations Toggle */}
            <div className="flex justify-between items-center">
              <label className="text-white text-sm font-medium">إظهار الرسوم</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAnimations}
                  onChange={(e) => setEnableAnimations(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Sounds Toggle */}
            <div className="flex justify-between items-center">
              <label className="text-white text-sm font-medium">تبريج</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSounds}
                  onChange={(e) => setEnableSounds(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Show Line Numbers Toggle */}
            <div className="flex justify-between items-center">
              <label className="text-white text-sm font-medium">عرض الرقم عند بلن نظام</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLineNumbers}
                  onChange={(e) => setShowLineNumbers(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Show Today Toggle */}
            <div className="flex justify-between items-center">
              <label className="text-white text-sm font-medium">تحديد رقم يوم على بين نظام</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showToday}
                  onChange={(e) => setShowToday(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Columns Selection */}
            <div>
              <h4 className="text-white text-sm font-medium mb-3">الأعمدة في نهاية البيع</h4>
              <div className="text-xs text-gray-400 mb-3">اختر المرور عرضها في جهة اليسر "ولاية اليسار" جدي</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries({
                  product: 'بين *',
                  category: 'تحويل *',
                  price: 'حجم *',
                  quantity: 'ملطبة *',
                  actions: 'قائمة جديدة *'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      id={key}
                      checked={selectedColumns[key as keyof typeof selectedColumns]}
                      onChange={(e) => handleCheckboxChange(key, e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-[#2B3544] border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor={key} className="text-white text-sm cursor-pointer">
                      {label}
                    </label>
                  </div>
                ))}
                <div className="col-span-2 text-xs text-red-400 mt-2">
                  * يعتمد على مخططة "جهة اليسار" جدي
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlaceholderContent = (categoryId: string) => {
    const category = settingsCategories.find(c => c.id === categoryId);
    if (!category) return null;

    const Icon = category.icon;

    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
        <Icon className="h-24 w-24 text-gray-500 mb-6" />
        <h2 className="text-2xl font-medium text-white mb-3">{category.name}</h2>
        <p className="text-gray-400 mb-8 max-w-md">{category.description}</p>
        <div className="bg-[#374151] rounded-lg p-6 border border-gray-600">
          <p className="text-gray-300 text-sm">
            هذا القسم قيد التطوير. سيتم إضافة المزيد من الإعدادات قريباً.
          </p>
        </div>
      </div>
    );
  };

  const renderSettingsContent = () => {
    switch (selectedCategory) {
      case 'system':
        return renderSystemSettings();
      default:
        return renderPlaceholderContent(selectedCategory);
    }
  };

  return (
    <div className="h-screen bg-[#2B3544] overflow-hidden">
      <TopHeader onMenuClick={toggleSidebar} isMenuOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className="h-full pt-12 overflow-hidden flex flex-col">

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Settings Categories */}
          <div className="w-64 bg-[#374151] border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-600">
              <h3 className="text-white font-medium mb-3">إعدادات النظام</h3>
              <div className="space-y-2">
                {settingsCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Settings Stats */}
            <div className="p-4">
              <h4 className="text-gray-300 text-sm font-medium mb-3">معلومات الإعدادات</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white font-medium">{settingsCategories.length}</span>
                  <span className="text-gray-400">أقسام الإعدادات:</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-400 font-medium">1</span>
                  <span className="text-gray-400">الأقسام المكتملة:</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-400 font-medium">{settingsCategories.length - 1}</span>
                  <span className="text-gray-400">قيد التطوير:</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Settings Content Container */}
            <div className="flex-1 overflow-y-auto scrollbar-hide bg-[#2B3544] p-6">
              {renderSettingsContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}