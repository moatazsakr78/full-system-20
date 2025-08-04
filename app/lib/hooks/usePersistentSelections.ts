'use client'

import { useState, useEffect } from 'react'

export interface SelectionData {
  record: any | null
  customer: any | null
  branch: any | null
}

const STORAGE_KEY = 'pos_selections'

export function usePersistentSelections() {
  const [selections, setSelections] = useState<SelectionData>({
    record: null,
    customer: null,
    branch: null
  })

  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedSelections = JSON.parse(stored)
        setSelections(parsedSelections)
      }
    } catch (error) {
      console.error('Error loading selections from localStorage:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save to localStorage whenever selections change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selections))
      } catch (error) {
        console.error('Error saving selections to localStorage:', error)
      }
    }
  }, [selections, isLoaded])

  const setRecord = (record: any) => {
    setSelections(prev => ({ ...prev, record }))
  }

  const setCustomer = (customer: any) => {
    setSelections(prev => ({ ...prev, customer }))
  }

  const setBranch = (branch: any) => {
    setSelections(prev => ({ ...prev, branch }))
  }

  const clearSelections = () => {
    setSelections({
      record: null,
      customer: null,
      branch: null
    })
  }

  const isComplete = () => {
    return selections.record && selections.customer && selections.branch
  }

  const hasRequiredForCart = () => {
    // At minimum, branch must be selected for cart operations
    return selections.branch !== null
  }

  const hasRequiredForSale = () => {
    // All three selections required for completing sale
    return selections.record && selections.customer && selections.branch
  }

  return {
    selections,
    isLoaded,
    setRecord,
    setCustomer,
    setBranch,
    clearSelections,
    isComplete,
    hasRequiredForCart,
    hasRequiredForSale
  }
}