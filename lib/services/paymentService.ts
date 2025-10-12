import { supabase } from '@/app/lib/supabase/client';

export interface PaymentReceipt {
  id: string;
  order_id: string;
  customer_id: string;
  receipt_image_url: string;
  detected_amount: number | null;
  detected_account_number: string | null;
  payment_status: 'pending' | 'verified' | 'rejected';
  verification_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyzeReceiptResult {
  success: boolean;
  amount: number | null;
  accountNumber: string | null;
  fullText?: string;
  error?: string;
}

class PaymentService {
  /**
   * Upload receipt image to Supabase Storage
   */
  async uploadReceiptImage(file: File, orderId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${orderId}-${Date.now()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { data, error } = await supabase.storage
      .from('payment-screen')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('payment-screen')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  /**
   * Analyze receipt using Cloud Vision API
   */
  async analyzeReceipt(file: File): Promise<AnalyzeReceiptResult> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/analyze-receipt', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      // If response is not ok, throw with actual error details
      if (!response.ok) {
        const errorMessage = result.details || result.error || 'Failed to analyze receipt';
        throw new Error(errorMessage);
      }

      return result;
    } catch (error: any) {
      console.error('Error in analyzeReceipt:', error);
      throw new Error(error.message || 'فشل الاتصال بخادم التحليل');
    }
  }

  /**
   * Create payment receipt record
   */
  async createPaymentReceipt(data: {
    orderId: string;
    customerId: string;
    receiptImageUrl: string;
    detectedAmount: number | null;
    detectedAccountNumber: string | null;
    transactionDate?: string | null;
  }): Promise<PaymentReceipt> {
    // Get current user for user_id
    const { data: { user } } = await supabase.auth.getUser();

    const { data: receipt, error } = await (supabase as any)
      .from('payment_receipts')
      .insert({
        order_id: data.orderId,
        user_id: user?.id || null,
        receipt_image_url: data.receiptImageUrl,
        detected_amount: data.detectedAmount,
        detected_account_number: data.detectedAccountNumber,
        transaction_date: data.transactionDate || null,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create payment receipt: ${error.message}`);
    }

    return receipt;
  }

  /**
   * Get all payment receipts for an order
   */
  async getOrderPaymentReceipts(orderId: string): Promise<PaymentReceipt[]> {
    const { data, error } = await (supabase as any)
      .from('payment_receipts')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch payment receipts: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Verify payment receipt (for staff)
   */
  async verifyPaymentReceipt(
    receiptId: string,
    verified: boolean,
    notes?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await (supabase as any)
      .from('payment_receipts')
      .update({
        payment_status: verified ? 'verified' : 'rejected',
        verification_notes: notes,
        verified_by: user.id,
        verified_at: new Date().toISOString()
      })
      .eq('id', receiptId);

    if (error) {
      throw new Error(`Failed to verify payment receipt: ${error.message}`);
    }
  }

  /**
   * Get order payment progress
   */
  async getOrderPaymentProgress(orderId: string): Promise<{
    totalAmount: number;
    totalPaid: number;
    paymentProgress: number;
    fullyPaid: boolean;
  }> {
    const { data, error } = await (supabase as any)
      .from('orders')
      .select('total_amount, total_paid, payment_progress, fully_paid')
      .eq('id', orderId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch payment progress: ${error.message}`);
    }

    return {
      totalAmount: data.total_amount || 0,
      totalPaid: data.total_paid || 0,
      paymentProgress: data.payment_progress || 0,
      fullyPaid: data.fully_paid || false
    };
  }
}

export const paymentService = new PaymentService();
