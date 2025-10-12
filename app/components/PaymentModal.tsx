'use client';

import { useState, useRef } from 'react';
import {
  XMarkIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { paymentService } from '@/lib/services/paymentService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerId: string;
  orderAmount: number;
  currentPaid: number;
  onPaymentUploaded?: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  orderId,
  customerId,
  orderAmount,
  currentPaid,
  onPaymentUploaded,
}: PaymentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedAmount, setAnalyzedAmount] = useState<number | null>(null);
  const [analyzedAccount, setAnalyzedAccount] = useState<string | null>(null);
  const [analyzedDate, setAnalyzedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [editableAmount, setEditableAmount] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingAmount = orderAmount - currentPaid;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار صورة فقط');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('حجم الصورة كبير جداً. الحد الأقصى 10 ميجابايت');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setSuccess(false);
    setAnalyzedAmount(null);
    setAnalyzedAccount(null);
    setAnalyzedDate(null);
    setEditableAmount('');
    setShowConfirmation(false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Step 1: Analyze and preview results using Azure Document Intelligence
  const handleAnalyzeAndPreview = async () => {
    if (!selectedFile || !previewUrl) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('🔍 Starting image analysis with Azure Document Intelligence...');

      // Create FormData with the actual file
      const formData = new FormData();
      formData.append('image', selectedFile);

      // Call our API endpoint that uses Azure Document Intelligence
      const response = await fetch('/api/analyze-receipt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'فشل تحليل الصورة');
      }

      const result = await response.json();

      console.log('✅ Azure Document Intelligence responded');
      console.log('📄 Full text:', result.fullText?.substring(0, 500));
      console.log('✅ Extracted data:', {
        amount: result.amount,
        accountNumber: result.accountNumber,
        transactionDate: result.transactionDate
      });

      // Use results from Azure API directly
      const amount = result.amount || null;
      const accountNumber = result.accountNumber || null;
      const transactionDate = result.transactionDate || null;

      setAnalyzedAmount(amount);
      setAnalyzedAccount(accountNumber);
      setAnalyzedDate(transactionDate);
      setEditableAmount(amount ? amount.toString() : '');
      setShowConfirmation(true);

    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'فشل تحليل الصورة');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2: Confirm and upload
  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      // Use edited amount if provided
      const finalAmount = editableAmount ? parseFloat(editableAmount) : analyzedAmount;

      if (!finalAmount || finalAmount <= 0) {
        throw new Error('يرجى إدخال المبلغ المحول');
      }

      // Upload image to storage
      console.log('📤 Uploading image...');
      const imageUrl = await paymentService.uploadReceiptImage(selectedFile, orderId);
      console.log('✅ Image uploaded');

      // Create payment receipt record
      console.log('💾 Saving payment record...');
      await paymentService.createPaymentReceipt({
        orderId,
        customerId,
        receiptImageUrl: imageUrl,
        detectedAmount: finalAmount,
        detectedAccountNumber: analyzedAccount,
        transactionDate: analyzedDate,
      });
      console.log('✅ Payment record saved and order payment recalculated automatically');

      setSuccess(true);
      setTimeout(() => {
        onPaymentUploaded?.();
        handleClose();
      }, 2000);

    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'فشل رفع صورة التحويل');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalyzedAmount(null);
    setAnalyzedAccount(null);
    setAnalyzedDate(null);
    setEditableAmount('');
    setShowConfirmation(false);
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#2B3544] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-bold text-white">رفع إيصال الدفع</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Payment Info */}
          <div className="bg-[#374151] rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">المبلغ الإجمالي:</span>
              <span className="text-white font-bold text-lg">{orderAmount.toFixed(2)} جنيه</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">المدفوع:</span>
              <span className="text-green-400 font-bold">{currentPaid.toFixed(2)} جنيه</span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-600 pt-3">
              <span className="text-gray-300">المتبقي:</span>
              <span className="text-orange-400 font-bold text-lg">{remainingAmount.toFixed(2)} جنيه</span>
            </div>
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <label className="text-white font-medium block">صورة إيصال التحويل</label>

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
              >
                <CloudArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 mb-2">اضغط لاختيار صورة أو اسحبها هنا</p>
                <p className="text-gray-500 text-sm">PNG, JPG, JPEG (حد أقصى 10MB)</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="w-full max-h-96 object-contain bg-gray-800"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setAnalyzedAmount(null);
                      setAnalyzedAccount(null);
                      setAnalyzedDate(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Analyzing State */}
                {isAnalyzing && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                    <p className="text-gray-300">جاري تحليل الصورة...</p>
                  </div>
                )}

                {/* Confirmation Dialog */}
                {showConfirmation && !isAnalyzing && (
                  <div className="bg-[#374151] rounded-lg p-5 space-y-5">
                    <div className="flex items-center justify-center gap-2 text-blue-400 mb-4">
                      <CheckCircleIcon className="w-6 h-6" />
                      <span className="font-bold text-lg">البيانات المستخرجة</span>
                    </div>

                    {/* 1. المبلغ المحول (الأهم) */}
                    <div className="space-y-2 bg-[#2B3544] p-4 rounded-lg border-2 border-blue-500">
                      <label className="text-blue-300 font-semibold text-base block">💰 المبلغ المحول (جنيه):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editableAmount}
                        onChange={(e) => setEditableAmount(e.target.value)}
                        placeholder="أدخل المبلغ"
                        className="w-full px-4 py-3 bg-[#1F2937] border border-gray-500 rounded-lg text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      {!analyzedAmount && (
                        <p className="text-yellow-400 text-sm flex items-center gap-2">
                          ⚠️ لم يتم استخراج المبلغ تلقائياً. أدخله يدوياً من الإيصال
                        </p>
                      )}
                      {analyzedAmount && (
                        <p className="text-green-400 text-sm flex items-center gap-2">
                          ✓ تم استخراج المبلغ تلقائياً - يمكنك تعديله إذا كان خاطئاً
                        </p>
                      )}
                    </div>

                    {/* 2. الرقم المحول عليه */}
                    <div className="flex justify-between items-center bg-[#2B3544] p-4 rounded-lg">
                      <span className="text-gray-300 font-medium">📱 الرقم المحول عليه:</span>
                      <span className={`font-mono text-lg font-bold ${analyzedAccount ? 'text-green-400' : 'text-gray-500'}`}>
                        {analyzedAccount || 'لم يتم العثور عليه'}
                      </span>
                    </div>

                    {/* 3. تاريخ المعاملة */}
                    <div className="flex justify-between items-center bg-[#2B3544] p-4 rounded-lg">
                      <span className="text-gray-300 font-medium">📅 تاريخ المعاملة:</span>
                      <span className={`text-base ${analyzedDate ? 'text-white' : 'text-gray-500'}`}>
                        {analyzedDate || 'لم يتم العثور عليه'}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-600">
                      <p className="text-center text-yellow-400 text-sm font-medium">
                        ⚠️ تأكد من صحة المبلغ قبل الحفظ
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
              <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-400">
              <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
              <span>تم رفع الإيصال بنجاح! جاري التحديث...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-600">
          <button
            onClick={handleClose}
            className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            disabled={isUploading || isAnalyzing}
          >
            إلغاء
          </button>

          {!showConfirmation ? (
            <button
              onClick={handleAnalyzeAndPreview}
              disabled={!selectedFile || isAnalyzing || isUploading || success}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? 'جاري التحليل...' : 'تحليل الإيصال'}
            </button>
          ) : (
            <button
              onClick={handleConfirmUpload}
              disabled={isUploading || success}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'جاري الحفظ...' : 'تأكيد وحفظ'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
