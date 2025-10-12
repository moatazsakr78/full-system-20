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

    // Recalculate order payment totals
    await this.recalculateOrderPayment(data.orderId);

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

  /**
   * Recalculate and update order payment totals
   */
  async recalculateOrderPayment(orderId: string): Promise<void> {
    // Get all receipts for this order (verified and pending, not rejected)
    const { data: receipts, error: receiptsError } = await (supabase as any)
      .from('payment_receipts')
      .select('detected_amount')
      .eq('order_id', orderId)
      .neq('payment_status', 'rejected');

    if (receiptsError) {
      throw new Error(`Failed to fetch receipts: ${receiptsError.message}`);
    }

    // Get order total
    const { data: order, error: orderError } = await (supabase as any)
      .from('orders')
      .select('total_amount')
      .eq('id', orderId)
      .single();

    if (orderError) {
      throw new Error(`Failed to fetch order: ${orderError.message}`);
    }

    // Calculate total paid from all receipts (except rejected ones)
    const totalPaid = (receipts || []).reduce((sum: number, receipt: any) => {
      return sum + (parseFloat(receipt.detected_amount) || 0);
    }, 0);

    const totalAmount = parseFloat(order.total_amount) || 0;
    const paymentProgress = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;
    const fullyPaid = totalPaid >= totalAmount;

    // Update order with new totals
    const { error: updateError } = await (supabase as any)
      .from('orders')
      .update({
        total_paid: totalPaid,
        payment_progress: paymentProgress,
        fully_paid: fullyPaid
      })
      .eq('id', orderId);

    if (updateError) {
      throw new Error(`Failed to update order payment: ${updateError.message}`);
    }
  }

  /**
   * Delete payment receipt
   */
  async deletePaymentReceipt(receiptId: string, imageUrl: string, orderId: string): Promise<void> {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const filePath = `receipts/${urlParts[urlParts.length - 1]}`;

    // Delete image from storage
    const { error: storageError } = await supabase.storage
      .from('payment-screen')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting image from storage:', storageError);
      // Continue even if storage deletion fails
    }

    // Delete receipt record from database
    const { error } = await (supabase as any)
      .from('payment_receipts')
      .delete()
      .eq('id', receiptId);

    if (error) {
      throw new Error(`Failed to delete payment receipt: ${error.message}`);
    }

    // Recalculate order payment totals
    await this.recalculateOrderPayment(orderId);
  }

  /**
   * Update payment receipt image
   */
  async updatePaymentReceipt(
    receiptId: string,
    oldImageUrl: string,
    newFile: File,
    orderId: string
  ): Promise<PaymentReceipt> {
    // Upload new image
    const newImageUrl = await this.uploadReceiptImage(newFile, orderId);

    // Analyze new receipt
    const analysis = await this.analyzeReceipt(newFile);

    // Update receipt record
    const { data: receipt, error } = await (supabase as any)
      .from('payment_receipts')
      .update({
        receipt_image_url: newImageUrl,
        detected_amount: analysis.amount,
        detected_account_number: analysis.accountNumber,
        payment_status: 'pending', // Reset to pending after update
        updated_at: new Date().toISOString()
      })
      .eq('id', receiptId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update payment receipt: ${error.message}`);
    }

    // Delete old image from storage
    const urlParts = oldImageUrl.split('/');
    const oldFilePath = `receipts/${urlParts[urlParts.length - 1]}`;

    await supabase.storage
      .from('payment-screen')
      .remove([oldFilePath]);

    // Recalculate order payment totals
    await this.recalculateOrderPayment(orderId);

    return receipt;
  }
}

export const paymentService = new PaymentService();
