'use client';

import { useState, useEffect } from 'react';
import {
  CogIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  BellIcon,
  ShieldCheckIcon,
  XMarkIcon,
  CheckIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  ListBulletIcon,
  Squares2X2Icon
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
    id: 'currency',
    name: 'العملة',
    icon: CurrencyDollarIcon,
    description: 'إعدادات العملة الافتراضية والتحويل'
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

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const predefinedCurrencies: CurrencyOption[] = [
  { code: 'SAR', name: 'الريال السعودي', symbol: 'ر.س', flag: '🇸🇦' },
  { code: 'EGP', name: 'الجنيه المصري', symbol: 'ج.م', flag: '🇪🇬' },
  { code: 'USD', name: 'الدولار الأمريكي', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'اليورو', symbol: '€', flag: '🇪🇺' },
  { code: 'AED', name: 'الدرهم الإماراتي', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'KWD', name: 'الدينار الكويتي', symbol: 'د.ك', flag: '🇰🇼' }
];

export default function SettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('currency');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Currency Settings State
  const [selectedCurrency, setSelectedCurrency] = useState<string>('SAR');
  const [customCurrencyName, setCustomCurrencyName] = useState('');
  const [customCurrencySymbol, setCustomCurrencySymbol] = useState('');
  const [isCustomCurrency, setIsCustomCurrency] = useState(false);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSaveCurrencySettings = async () => {
    setIsSavingCurrency(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Currency settings saved:', {
        isCustom: isCustomCurrency,
        currency: isCustomCurrency ? {
          name: customCurrencyName,
          symbol: customCurrencySymbol
        } : predefinedCurrencies.find(c => c.code === selectedCurrency)
      });

      // Show success message (you can implement toast notifications)
      alert('تم حفظ إعدادات العملة بنجاح!');
    } catch (error) {
      console.error('Error saving currency settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSavingCurrency(false);
    }
  };

  const renderCurrencySettings = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-600">
          <CurrencyDollarIcon className="h-6 w-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-medium text-white">إعدادات العملة</h2>
            <p className="text-gray-400 text-sm">قم بتحديد العملة التي ستظهر في المتجر والنظام</p>
          </div>
        </div>

        {/* Currency Type Selection */}
        <div className="space-y-4">
          <h3 className="text-white font-medium">نوع العملة</h3>

          {/* Predefined Currencies Option */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="currencyType"
                value="predefined"
                checked={!isCustomCurrency}
                onChange={() => setIsCustomCurrency(false)}
                className="w-4 h-4 text-blue-600 bg-[#2B3544] border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <span className="text-white font-medium">اختيار من العملات المحددة مسبقاً</span>
                <p className="text-gray-400 text-sm">اختر من قائمة العملات الشائعة</p>
              </div>
            </label>

            {!isCustomCurrency && (
              <div className="mr-7 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  {predefinedCurrencies.map((currency) => (
                    <label key={currency.code} className="flex items-center gap-3 p-3 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700/30 transition-colors">
                      <input
                        type="radio"
                        name="selectedCurrency"
                        value={currency.code}
                        checked={selectedCurrency === currency.code}
                        onChange={() => setSelectedCurrency(currency.code)}
                        className="w-4 h-4 text-blue-600 bg-[#2B3544] border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-2xl">{currency.flag}</span>
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">{currency.name}</div>
                        <div className="text-gray-400 text-xs">{currency.code} - {currency.symbol}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom Currency Option */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="currencyType"
                value="custom"
                checked={isCustomCurrency}
                onChange={() => setIsCustomCurrency(true)}
                className="w-4 h-4 text-blue-600 bg-[#2B3544] border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <span className="text-white font-medium">إدخال عملة مخصصة</span>
                <p className="text-gray-400 text-sm">أدخل اسم ورمز العملة يدوياً</p>
              </div>
            </label>

            {isCustomCurrency && (
              <div className="mr-7 mt-3 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2 text-right">
                      اسم العملة *
                    </label>
                    <input
                      type="text"
                      value={customCurrencyName}
                      onChange={(e) => setCustomCurrencyName(e.target.value)}
                      placeholder="مثال: الجنيه المصري"
                      className="w-full px-3 py-2 bg-[#2B3544] border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2 text-right">
                      رمز العملة *
                    </label>
                    <input
                      type="text"
                      value={customCurrencySymbol}
                      onChange={(e) => setCustomCurrencySymbol(e.target.value)}
                      placeholder="مثال: ج.م"
                      className="w-full px-3 py-2 bg-[#2B3544] border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-[#374151] rounded-lg p-4 border border-gray-600">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <span>معاينة</span>
            <div className="h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="h-2 w-2 bg-white rounded-full"></div>
            </div>
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white font-medium">
                {isCustomCurrency && customCurrencySymbol ? customCurrencySymbol :
                 predefinedCurrencies.find(c => c.code === selectedCurrency)?.symbol || 'ر.س'} 150.00
              </span>
              <span className="text-gray-300">سعر المنتج:</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white">
                {isCustomCurrency && customCurrencyName ? customCurrencyName :
                 predefinedCurrencies.find(c => c.code === selectedCurrency)?.name || 'الريال السعودي'}
              </span>
              <span className="text-gray-300">العملة المستخدمة:</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSaveCurrencySettings}
            disabled={isSavingCurrency || (isCustomCurrency && (!customCurrencyName.trim() || !customCurrencySymbol.trim()))}
            className={`px-6 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
              isSavingCurrency || (isCustomCurrency && (!customCurrencyName.trim() || !customCurrencySymbol.trim()))
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSavingCurrency ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                <span>حفظ الإعدادات</span>
              </>
            )}
          </button>
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
      case 'currency':
        return renderCurrencySettings();
      default:
        return renderPlaceholderContent(selectedCategory);
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
            <button className="flex flex-col items-center p-2 min-w-[80px] text-gray-600 cursor-not-allowed">
              <CogIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">إعدادات جديدة</span>
            </button>
            <button className="flex flex-col items-center p-2 min-w-[80px] text-gray-600 cursor-not-allowed">
              <ArrowRightIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">تصدير</span>
            </button>
            <button className="flex flex-col items-center p-2 min-w-[80px] text-gray-600 cursor-not-allowed">
              <ArrowRightIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">استيراد</span>
            </button>
          </div>
        </div>

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
                      placeholder="البحث في الإعدادات..."
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

                {/* Current Settings Title */}
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-medium">
                    {settingsCategories.find(c => c.id === selectedCategory)?.name || 'الإعدادات'}
                  </h2>
                  <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                    إعدادات
                  </span>
                </div>
              </div>
            </div>

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