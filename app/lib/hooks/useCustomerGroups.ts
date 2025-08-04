'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../supabase/client'

export interface CustomerGroup {
  id: string
  name: string
  parent_id: string | null
  is_active: boolean | null
  sort_order: number | null
  created_at: string | null
  updated_at: string | null
  children?: CustomerGroup[]
  isExpanded?: boolean
  level?: number
  isDefault?: boolean
}

export function useCustomerGroups() {
  const [groups, setGroups] = useState<CustomerGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const buildHierarchy = (flatGroups: CustomerGroup[]): CustomerGroup[] => {
    console.log('Building customer groups hierarchy from:', flatGroups)
    
    // Find the "عملاء" category
    const customersCategory = flatGroups.find(group => group.name === 'عملاء' && group.is_active)
    console.log('Customers category found:', customersCategory)
    
    const groupMap = new Map<string, CustomerGroup>()
    const rootGroups: CustomerGroup[] = []

    // Initialize all groups in the map
    flatGroups.forEach(group => {
      groupMap.set(group.id, { 
        ...group, 
        children: [], 
        isExpanded: true,
        isDefault: group.name === 'عملاء'
      })
    })

    // Build hierarchy
    flatGroups.forEach(group => {
      const groupWithChildren = groupMap.get(group.id)!
      
      if (group.parent_id) {
        const parent = groupMap.get(group.parent_id)
        if (parent) {
          parent.children!.push(groupWithChildren)
        }
      } else {
        rootGroups.push(groupWithChildren)
      }
    })

    // If "عملاء" exists, ensure it's the root and expanded
    if (customersCategory) {
      const customersRoot = groupMap.get(customersCategory.id)
      if (customersRoot) {
        customersRoot.isExpanded = true
        customersRoot.isDefault = true
        console.log('Setting عملاء as root:', customersRoot)
        return [customersRoot]
      }
    } else {
      // If "عملاء" doesn't exist, create it as a virtual root
      const allOtherGroups = rootGroups.filter(group => group.name !== 'عملاء')
      const virtualCustomersRoot: CustomerGroup = {
        id: 'customers-root',
        name: 'عملاء',
        parent_id: null,
        is_active: true,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        children: allOtherGroups,
        isExpanded: true,
        isDefault: true
      }
      console.log('Creating virtual عملاء root:', virtualCustomersRoot)
      return [virtualCustomersRoot]
    }

    return rootGroups
  }

  const fetchGroups = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('customer_groups')
        .select('*')
        .or('is_active.is.null,is_active.eq.true')
        .order('sort_order', { ascending: true, nullsFirst: false })

      if (error) throw error

      const hierarchicalGroups = buildHierarchy(data || [])
      setGroups(hierarchicalGroups)
      setError(null)
    } catch (err) {
      console.error('Error fetching customer groups:', err)
      setError('فشل في تحميل مجموعات العملاء')
      setGroups([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGroupChange = (payload: any) => {
    console.log('🔄 Customer group real-time change detected:', payload)
    console.log('📊 Event type:', payload.eventType)
    console.log('📝 New data:', payload.new)
    console.log('🗑️ Old data:', payload.old)
    // Refetch to rebuild hierarchy properly
    fetchGroups()
  }

  useEffect(() => {
    console.log('🚀 Initializing customer groups hook')
    fetchGroups()

    // Subscribe to real-time changes
    console.log('📡 Setting up customer groups subscription')
    const subscription = supabase
      .channel('customer_groups_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'customer_groups' },
        handleGroupChange
      )
      .subscribe((status) => {
        console.log('🔗 Customer groups subscription status:', status)
      })

    return () => {
      console.log('🔌 Unsubscribing from customer groups')
      subscription.unsubscribe()
    }
  }, [])

  const toggleGroupExpansion = (groupId: string, groupsList: CustomerGroup[] = groups): CustomerGroup[] => {
    return groupsList.map(group => {
      if (group.id === groupId) {
        return { ...group, isExpanded: !group.isExpanded }
      }
      if (group.children && group.children.length > 0) {
        return { ...group, children: toggleGroupExpansion(groupId, group.children) }
      }
      return group
    })
  }

  const toggleGroup = (groupId: string) => {
    setGroups(prev => toggleGroupExpansion(groupId, prev))
  }

  // Function to flatten the hierarchy for dropdown usage
  const getFlatGroupsList = (groupsList: CustomerGroup[] = groups): CustomerGroup[] => {
    const flatList: CustomerGroup[] = []
    
    const traverse = (groups: CustomerGroup[], level = 0) => {
      groups.forEach(group => {
        flatList.push({ ...group, level })
        if (group.children && group.children.length > 0) {
          traverse(group.children, level + 1)
        }
      })
    }
    
    traverse(groupsList)
    return flatList
  }

  return {
    groups,
    isLoading,
    error,
    refetch: fetchGroups,
    toggleGroup,
    getFlatGroupsList
  }
}