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
import { Currency, DEFAULT_SYSTEM_CURRENCY, DEFAULT_WEBSITE_CURRENCY, DEFAULT_UNIFIED_CURRENCY, CURRENCY_MODES } from '@/lib/constants/currencies';
import { useCurrencySettings } from '@/lib/hooks/useCurrency';
import { useCurrencySettings as useDbCurrencySettings } from '@/lib/hooks/useSystemSettings';

// Custom dropdown component with delete buttons
const CurrencyDropdownWithDelete = ({
  value,
  onChange,
  isCustom,
  onCustomToggle,
  customValue,
  onCustomChange,
  placeholder,
  arabicCurrencies,
  onDeleteCurrency
}: {
  value: string;
  onChange: (value: string) => void;
  isCustom: boolean;
  onCustomToggle: (custom: boolean) => void;
  customValue: string;
  onCustomChange: (value: string) => void;
  placeholder: string;
  arabicCurrencies: string[];
  onDeleteCurrency: (currency: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Main dropdown button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-[#2B3544] border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right flex items-center justify-between"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        <span>{isCustom ? 'كتابة مخصصة...' : value || 'اختر العملة'}</span>
      </button>

      {/* Custom dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#2B3544] border border-gray-600 rounded shadow-lg z-50 max-h-60 overflow-y-auto scrollbar-hide">
          {/* Currency options */}
          {arabicCurrencies.map((currency, index) => (
            <div
              key={currency}
              className="flex items-center justify-between p-2 hover:bg-[#374151] group"
            >
              <div className="flex items-center gap-2">
                {index > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCurrency(currency);
                    }}
                    className="text-red-400 hover:text-red-300 p-1 hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                    title={`حذف ${currency}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  onCustomToggle(false);
                  onChange(currency);
                  setIsOpen(false);
                }}
                className="flex-1 text-right text-white text-sm py-1 px-2 hover:bg-[#374151] rounded"
              >
                {currency}
              </button>
            </div>
          ))}

          {/* Custom option */}
          <div className="border-t border-gray-600 p-2">
            <button
              onClick={() => {
                onCustomToggle(true);
                setIsOpen(false);
              }}
              className="w-full text-right text-white text-sm py-1 px-2 hover:bg-[#374151] rounded"
            >
              كتابة مخصصة...
            </button>
          </div>
        </div>
      )}

      {/* Custom input field */}
      {isCustom && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder={placeholder}
          className="w-full mt-2 px-3 py-2 bg-[#2B3544] border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right"
        />
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

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

  // Currency Settings using database hook
  const {
    currencyMode: dbCurrencyMode,
    systemCurrency: dbSystemCurrency,
    websiteCurrency: dbWebsiteCurrency,
    unifiedCurrency: dbUnifiedCurrency,
    updateCurrencySettings: updateDbCurrencySettings,
    isLoading: isCurrencyLoading,
    availableCurrencies,
    addNewCustomCurrency,
    deleteCustomCurrency
  } = useDbCurrencySettings();

  // Local state for pending changes (not saved until user clicks save)
  const [pendingCurrencyMode, setPendingCurrencyMode] = useState<'separate' | 'unified'>(dbCurrencyMode);
  const [pendingSystemCurrency, setPendingSystemCurrency] = useState(dbSystemCurrency);
  const [pendingWebsiteCurrency, setPendingWebsiteCurrency] = useState(dbWebsiteCurrency);
  const [pendingUnifiedCurrency, setPendingUnifiedCurrency] = useState(dbUnifiedCurrency);

  const [isCustomSystemCurrency, setIsCustomSystemCurrency] = useState(false);
  const [isCustomWebsiteCurrency, setIsCustomWebsiteCurrency] = useState(false);
  const [isCustomUnifiedCurrency, setIsCustomUnifiedCurrency] = useState(false);
  const [customSystemCurrency, setCustomSystemCurrency] = useState('');
  const [customWebsiteCurrency, setCustomWebsiteCurrency] = useState('');
  const [customUnifiedCurrency, setCustomUnifiedCurrency] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Update pending state when database values change
  useEffect(() => {
    setPendingCurrencyMode(dbCurrencyMode);
    setPendingSystemCurrency(dbSystemCurrency);
    setPendingWebsiteCurrency(dbWebsiteCurrency);
    setPendingUnifiedCurrency(dbUnifiedCurrency);
  }, [dbCurrencyMode, dbSystemCurrency, dbWebsiteCurrency, dbUnifiedCurrency]);

  // Use dynamic currency list from database
  const arabicCurrencies = availableCurrencies;

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
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
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
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
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
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
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
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Columns Selection */}
            <div>
              <h4 className="text-white text-sm font-medium mb-3">الأعمدة في نهاية البيع</h4>
              <div className="text-xs text-gray-400 mb-3">اختر المرور عرضها في جهة اليسر &quot;ولاية اليسار&quot; جدي</div>
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
                  * يعتمد على مخططة &quot;جهة اليسار&quot; جدي
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

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Prepare currency settings from pending state
      const newCurrencySettings = {
        currency_mode: pendingCurrencyMode,
        system_currency: isCustomSystemCurrency ? customSystemCurrency : pendingSystemCurrency,
        website_currency: isCustomWebsiteCurrency ? customWebsiteCurrency : pendingWebsiteCurrency,
        unified_currency: isCustomUnifiedCurrency ? customUnifiedCurrency : pendingUnifiedCurrency
      };

      // Update currency settings in database
      await updateDbCurrencySettings(newCurrencySettings);

      console.log('Settings saved:', newCurrencySettings);

      // Reset custom currency states
      setIsCustomSystemCurrency(false);
      setIsCustomWebsiteCurrency(false);
      setIsCustomUnifiedCurrency(false);
      setCustomSystemCurrency('');
      setCustomWebsiteCurrency('');
      setCustomUnifiedCurrency('');

      alert('تم حفظ الإعدادات بنجاح!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSettings = () => {
    // Reset to current database values
    setPendingCurrencyMode(dbCurrencyMode);
    setPendingSystemCurrency(dbSystemCurrency);
    setPendingWebsiteCurrency(dbWebsiteCurrency);
    setPendingUnifiedCurrency(dbUnifiedCurrency);

    setIsCustomSystemCurrency(false);
    setIsCustomWebsiteCurrency(false);
    setIsCustomUnifiedCurrency(false);
    setCustomSystemCurrency('');
    setCustomWebsiteCurrency('');
    setCustomUnifiedCurrency('');
  };

  const handleDeleteCurrency = async (currency: string) => {
    try {
      const confirmDelete = window.confirm(`هل تريد حذف العملة "${currency}" نهائياً؟`);
      if (!confirmDelete) return;

      await deleteCustomCurrency(currency);

      // If the deleted currency was selected in pending state, reset to default
      if (pendingSystemCurrency === currency) {
        setPendingSystemCurrency(dbSystemCurrency);
      }
      if (pendingWebsiteCurrency === currency) {
        setPendingWebsiteCurrency(dbWebsiteCurrency);
      }
      if (pendingUnifiedCurrency === currency) {
        setPendingUnifiedCurrency(dbUnifiedCurrency);
      }

      alert(`تم حذف العملة "${currency}" بنجاح!`);
    } catch (error) {
      console.error('Error deleting currency:', error);
      alert('حدث خطأ أثناء حذف العملة');
    }
  };


  const renderThemeSettings = () => {
    return (
      <div className="space-y-6 max-w-6xl">
        {/* Currency Settings */}
        <div className="space-y-6">
          <h3 className="text-white font-medium text-lg">إعدادات العملة</h3>

          {/* Currency Mode Selection */}
          <div className="space-y-3">
            <label className="block text-white text-sm font-medium">نطاق العملة</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="currencyMode"
                  value={CURRENCY_MODES.SEPARATE}
                  checked={pendingCurrencyMode === CURRENCY_MODES.SEPARATE}
                  onChange={(e) => setPendingCurrencyMode(e.target.value as 'separate' | 'unified')}
                  className="w-4 h-4 text-blue-600 bg-[#2B3544] border-gray-600 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-white text-sm">منفصل</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="currencyMode"
                  value={CURRENCY_MODES.UNIFIED}
                  checked={pendingCurrencyMode === CURRENCY_MODES.UNIFIED}
                  onChange={(e) => setPendingCurrencyMode(e.target.value as 'separate' | 'unified')}
                  className="w-4 h-4 text-blue-600 bg-[#2B3544] border-gray-600 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-white text-sm">كلاهما</span>
              </label>
            </div>
          </div>

          {/* Currency Fields - Horizontal Layout */}
          {pendingCurrencyMode === CURRENCY_MODES.UNIFIED && (
            <div className="space-y-3">
              <label className="block text-white text-sm font-medium">عملة النظام و الموقع</label>
              <CurrencyDropdownWithDelete
                value={pendingUnifiedCurrency}
                onChange={setPendingUnifiedCurrency}
                isCustom={isCustomUnifiedCurrency}
                onCustomToggle={setIsCustomUnifiedCurrency}
                customValue={customUnifiedCurrency}
                onCustomChange={setCustomUnifiedCurrency}
                placeholder="اكتب العملة..."
                arabicCurrencies={arabicCurrencies}
                onDeleteCurrency={handleDeleteCurrency}
              />
            </div>
          )}

          {pendingCurrencyMode === CURRENCY_MODES.SEPARATE && (
            <div className="grid grid-cols-2 gap-6">
              {/* System Currency */}
              <div className="space-y-3">
                <label className="block text-white text-sm font-medium">عملة النظام</label>
                <CurrencyDropdownWithDelete
                  value={pendingSystemCurrency}
                  onChange={setPendingSystemCurrency}
                  isCustom={isCustomSystemCurrency}
                  onCustomToggle={setIsCustomSystemCurrency}
                  customValue={customSystemCurrency}
                  onCustomChange={setCustomSystemCurrency}
                  placeholder="اكتب العملة..."
                  arabicCurrencies={arabicCurrencies}
                  onDeleteCurrency={handleDeleteCurrency}
                />
              </div>

              {/* Website Currency */}
              <div className="space-y-3">
                <label className="block text-white text-sm font-medium">عملة الموقع</label>
                <CurrencyDropdownWithDelete
                  value={pendingWebsiteCurrency}
                  onChange={setPendingWebsiteCurrency}
                  isCustom={isCustomWebsiteCurrency}
                  onCustomToggle={setIsCustomWebsiteCurrency}
                  customValue={customWebsiteCurrency}
                  onCustomChange={setCustomWebsiteCurrency}
                  placeholder="اكتب العملة..."
                  arabicCurrencies={arabicCurrencies}
                  onDeleteCurrency={handleDeleteCurrency}
                />
              </div>
            </div>
          )}


        </div>

      </div>
    );
  };

  const renderSettingsContent = () => {
    switch (selectedCategory) {
      case 'system':
        return renderSystemSettings();
      case 'theme':
        return renderThemeSettings();
      default:
        return renderPlaceholderContent(selectedCategory);
    }
  };

  return (
    <div className="h-screen bg-[#2B3544] overflow-hidden relative">
      <TopHeader onMenuClick={toggleSidebar} isMenuOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className="h-full pt-12 overflow-hidden flex flex-col relative">

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
          <div className="flex-1 flex flex-col overflow-hidden relative">

            {/* Settings Content Container */}
            <div className="flex-1 overflow-y-auto scrollbar-hide bg-[#2B3544] p-6 pb-20">
              {renderSettingsContent()}
            </div>

            {/* Settings Action Bar - Limited to main content area width */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#2B3544] border-t border-gray-600/30">
              <div className="flex gap-2 justify-end">
                {/* Cancel and Save buttons - exact styling from ProductSidebar */}
                <button
                  onClick={handleCancelSettings}
                  className="bg-transparent hover:bg-gray-600/10 text-gray-300 border border-gray-600 hover:border-gray-500 px-4 py-2 text-sm font-medium transition-all duration-200 min-w-[80px] flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  إلغاء
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 min-w-[80px] flex items-center gap-2 ${
                    isSaving
                      ? 'bg-gray-600/50 text-gray-400 border border-gray-600 cursor-not-allowed'
                      : 'bg-transparent hover:bg-gray-600/10 text-gray-300 border border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      حفظ الإعدادات
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}