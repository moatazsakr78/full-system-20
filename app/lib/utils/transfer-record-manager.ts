import { supabase } from '../supabase/client'

export const ensureTransferRecordExists = async () => {
  try {
    // Check if transfer record exists
    const { data: existingTransferRecord, error: checkError } = await supabase
      .from('records')
      .select('*')
      .eq('name', 'سجل النقل')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking transfer record:', checkError)
      return null
    }

    // If transfer record doesn't exist, create it
    if (!existingTransferRecord) {
      const { data: newRecord, error: insertError } = await supabase
        .from('records')
        .insert({
          name: 'سجل النقل',
          is_active: true,
          is_primary: true, // Make it undeletable like main record
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating transfer record:', insertError)
        return null
      }

      return newRecord
    }

    return existingTransferRecord
  } catch (error) {
    console.error('Error ensuring transfer record exists:', error)
    return null
  }
}

export const getTransferRecordId = async (): Promise<string | null> => {
  try {
    const { data: transferRecord, error } = await supabase
      .from('records')
      .select('id')
      .eq('name', 'سجل النقل')
      .single()

    if (error) {
      console.error('Error fetching transfer record ID:', error)
      return null
    }

    return transferRecord?.id || null
  } catch (error) {
    console.error('Error getting transfer record ID:', error)
    return null
  }
}

export const linkTransferInvoicesToRecord = async () => {
  try {
    // Get transfer record ID
    const transferRecordId = await getTransferRecordId()
    if (!transferRecordId) {
      console.error('Transfer record not found')
      return
    }

    // Update all transfer invoices to use transfer record
    const { error: updateError } = await supabase
      .from('purchase_invoices')
      .update({ record_id: transferRecordId })
      .ilike('notes', '%[TRANSFER]%')
      .is('record_id', null)

    if (updateError) {
      console.error('Error linking transfer invoices to transfer record:', updateError)
    } else {
      console.log('Transfer invoices successfully linked to transfer record')
    }
  } catch (error) {
    console.error('Error linking transfer invoices:', error)
  }
}