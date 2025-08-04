import { supabase } from '../supabase/client'

/**
 * Mark a sale as updated in the database
 * @param saleId - The ID of the sale to mark as updated
 * @returns Promise<boolean> - Success status
 */
export async function markSaleAsUpdated(saleId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sales')
      .update({ 
        is_updated: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', saleId)

    if (error) {
      console.error('Error marking sale as updated:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error marking sale as updated:', error)
    return false
  }
}

/**
 * Reset the updated status of a sale
 * @param saleId - The ID of the sale to reset
 * @returns Promise<boolean> - Success status
 */
export async function resetSaleUpdatedStatus(saleId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sales')
      .update({ 
        is_updated: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', saleId)

    if (error) {
      console.error('Error resetting sale updated status:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error resetting sale updated status:', error)
    return false
  }
}

/**
 * Update sale data and mark as updated
 * @param saleId - The ID of the sale to update
 * @param updateData - The data to update
 * @returns Promise<boolean> - Success status
 */
export async function updateSaleAndMarkUpdated(
  saleId: string, 
  updateData: Record<string, any>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sales')
      .update({ 
        ...updateData,
        is_updated: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', saleId)

    if (error) {
      console.error('Error updating sale:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating sale:', error)
    return false
  }
}

/**
 * Get update history for a sale
 * @param saleId - The ID of the sale
 * @returns Promise<any[]> - Update history array
 */
export async function getSaleUpdateHistory(saleId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('update_history')
      .eq('id', saleId)
      .single()

    if (error) {
      console.error('Error fetching sale update history:', error)
      return []
    }

    return Array.isArray(data?.update_history) ? data.update_history : []
  } catch (error) {
    console.error('Error fetching sale update history:', error)
    return []
  }
}

/**
 * Add an entry to sale update history
 * @param saleId - The ID of the sale
 * @param updateInfo - Information about the update
 * @returns Promise<boolean> - Success status
 */
export async function addToSaleUpdateHistory(
  saleId: string, 
  updateInfo: { 
    field: string
    oldValue: any
    newValue: any
    timestamp: string
    user?: string
  }
): Promise<boolean> {
  try {
    // First get current history
    const currentHistory = await getSaleUpdateHistory(saleId)
    
    // Add new entry
    const newHistory = [...currentHistory, updateInfo]
    
    // Update the history
    const { error } = await supabase
      .from('sales')
      .update({ 
        update_history: newHistory,
        is_updated: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', saleId)

    if (error) {
      console.error('Error updating sale history:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating sale history:', error)
    return false
  }
}