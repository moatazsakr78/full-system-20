'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';

interface CustomerProfile {
  id?: string;
  name: string;
  phone: string;
  altPhone: string;
  governorate: string;
  address: string;
  profile_image_url?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<CustomerProfile>({
    name: '',
    phone: '',
    altPhone: '',
    governorate: '',
    address: '',
    profile_image_url: ''
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Load user and profile data on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        // Not logged in, redirect to login
        router.push('/auth/login');
        return;
      }

      setUser(currentUser);

      // Load customer profile from customers table
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (customerError && customerError.code !== 'PGRST116') {
        console.error('Error loading customer profile:', customerError);
      }

      if (customerData) {
        const customer = customerData as any;
        setProfileData({
          id: customer.id,
          name: customer.name || '',
          phone: customer.phone || '',
          altPhone: customer.backup_phone || '',
          governorate: customer.governorate || '',
          address: customer.address || '',
          profile_image_url: customer.profile_image_url || currentUser.user_metadata?.avatar_url || ''
        });
      } else {
        // No customer record yet, use user metadata
        setProfileData({
          name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || '',
          phone: '',
          altPhone: '',
          governorate: '',
          address: '',
          profile_image_url: currentUser.user_metadata?.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CustomerProfile, value: string) => {
    // Phone number validation for Egyptian numbers (11 digits starting with 01)
    if (field === 'phone' || field === 'altPhone') {
      // Only allow digits
      const digits = value.replace(/\D/g, '');
      // Limit to 11 digits
      const limitedDigits = digits.slice(0, 11);

      setProfileData(prev => ({
        ...prev,
        [field]: limitedDigits
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار صورة فقط');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('customer-profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('customer-profiles')
        .getPublicUrl(filePath);

      setProfileData(prev => ({
        ...prev,
        profile_image_url: publicUrl
      }));

      alert('تم رفع الصورة بنجاح!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Validate required fields
      if (!profileData.name.trim()) {
        alert('يرجى إدخال الاسم');
        return;
      }

      if (!profileData.phone.trim()) {
        alert('يرجى إدخال رقم الهاتف');
        return;
      }

      // Validate phone number format (11 digits starting with 01)
      if (profileData.phone.length !== 11) {
        alert('رقم الهاتف يجب أن يكون 11 رقم');
        return;
      }

      if (!profileData.phone.startsWith('01')) {
        alert('رقم الهاتف يجب أن يبدأ بـ 01');
        return;
      }

      // Validate alternative phone if provided
      if (profileData.altPhone.trim()) {
        if (profileData.altPhone.length !== 11) {
          alert('رقم الهاتف الثاني يجب أن يكون 11 رقم');
          return;
        }

        if (!profileData.altPhone.startsWith('01')) {
          alert('رقم الهاتف الثاني يجب أن يبدأ بـ 01');
          return;
        }
      }

      setIsSaving(true);

      if (profileData.id) {
        // Update existing customer record
        const { error } = await supabase
          .from('customers')
          .update({
            name: profileData.name,
            phone: profileData.phone,
            backup_phone: profileData.altPhone,
            governorate: profileData.governorate,
            address: profileData.address,
            profile_image_url: profileData.profile_image_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', profileData.id);

        if (error) throw error;
      } else {
        // Create new customer record
        const { error } = await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            name: profileData.name,
            phone: profileData.phone,
            backup_phone: profileData.altPhone,
            governorate: profileData.governorate,
            address: profileData.address,
            email: user.email,
            profile_image_url: profileData.profile_image_url,
            is_active: true,
            loyalty_points: 0,
            account_balance: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      alert('تم حفظ البيانات بنجاح!');

      // Reload profile data
      await loadUserProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-gray-600 text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-[#3B82F6] shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="text-white hover:text-gray-200 transition-colors flex items-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>رجوع</span>
            </button>

            <h1 className="text-white text-xl font-bold">الملف الشخصي</h1>

            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Profile Form */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Profile Image */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-blue-500">
                {profileData.profile_image_url ? (
                  <img
                    src={profileData.profile_image_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                    👤
                  </div>
                )}
              </div>

              {/* Upload button */}
              <label
                htmlFor="profile-image-upload"
                className={`absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 cursor-pointer transition-colors ${
                  isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  id="profile-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            <p className="text-sm text-gray-500 mt-3">اضغط على الكاميرا لتغيير الصورة</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الاسم <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="أدخل الاسم الكامل"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white placeholder-gray-400"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف (يفضل واتساب) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="أدخل رقم الهاتف (يفضل أن يكون عليه واتساب)"
                maxLength={11}
                pattern="^01[0-9]{9}$"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 mt-1">رقم مصري يبدأ بـ 01 ومكون من 11 رقم</p>
            </div>

            {/* Alternative Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم هاتف احتياطي
              </label>
              <input
                type="tel"
                value={profileData.altPhone}
                onChange={(e) => handleInputChange('altPhone', e.target.value)}
                placeholder="أدخل رقم هاتف آخر (اختياري)"
                maxLength={11}
                pattern="^01[0-9]{9}$"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white placeholder-gray-400"
              />
            </div>

            {/* Governorate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المحافظة
              </label>
              <input
                type="text"
                value={profileData.governorate}
                onChange={(e) => handleInputChange('governorate', e.target.value)}
                placeholder="أدخل المحافظة"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white placeholder-gray-400"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان
              </label>
              <textarea
                value={profileData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="أدخل العنوان التفصيلي"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-900 bg-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8">
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                isSaving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </button>
          </div>

          {/* Info Note */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">فائدة حفظ البيانات:</p>
                <p>عند حفظ بياناتك هنا، سيتم ملء معلوماتك تلقائياً في السلة عند إتمام أي طلب، مما يوفر عليك الوقت في كل مرة.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
