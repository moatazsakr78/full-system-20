'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../supabase/client'

export interface Branch {
  id: string
  name: string
  name_en: string | null
  address: string
  phone: string
  manager_id: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  allow_variants: boolean
}

export interface BranchInventory {
  branch_id: string
  product_id: string
  quantity: number
  min_stock?: number
}

export interface ProductVariant {
  id: string
  product_id: string
  branch_id: string
  variant_type: 'color' | 'shape' | 'size'
  name: string
  value: string
  quantity: number
  created_at: string
  updated_at: string
}

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBranches = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error

      setBranches(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching branches:', err)
      setError('فشل في تحميل الفروع')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBranchInventory = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('branch_id, quantity, min_stock')
        .eq('product_id', productId)

      if (error) throw error

      return (data || []).reduce((acc, item) => {
        acc[item.branch_id] = {
          quantity: item.quantity,
          min_stock: item.min_stock || 0
        }
        return acc
      }, {} as Record<string, { quantity: number, min_stock: number }>)
    } catch (err) {
      console.error('Error fetching branch inventory:', err)
      return {}
    }
  }

  const fetchProductVariants = async (productId: string, branchId?: string) => {
    try {
      let query = supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)

      if (branchId) {
        query = query.eq('branch_id', branchId)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (err) {
      console.error('Error fetching product variants:', err)
      return []
    }
  }

  const handleBranchChange = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setBranches(prev => [...prev, payload.new])
    } else if (payload.eventType === 'UPDATE') {
      setBranches(prev => prev.map(branch => 
        branch.id === payload.new.id ? payload.new : branch
      ))
    } else if (payload.eventType === 'DELETE') {
      setBranches(prev => prev.filter(branch => branch.id !== payload.old.id))
    }
  }

  useEffect(() => {
    fetchBranches()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('branches')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'branches' },
        handleBranchChange
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    branches,
    isLoading,
    error,
    refetch: fetchBranches,
    fetchBranchInventory,
    fetchProductVariants
  }
}