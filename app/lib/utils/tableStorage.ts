// Utility functions for saving and loading table configurations
// Supports column widths, order, and visibility with 1 year expiry

interface ColumnConfig {
  id: string
  width: number
  order: number
  visible: boolean
}

interface TableConfig {
  columns: ColumnConfig[]
  timestamp: number
  version: string
}

// Storage keys for different report types
const STORAGE_KEYS = {
  MAIN_REPORT: 'pos-reports-main-table-config',
  PRODUCTS_REPORT: 'pos-reports-products-table-config',
} as const

// Configuration expiry: 1 year in milliseconds
const CONFIG_EXPIRY = 365 * 24 * 60 * 60 * 1000 // 1 year

// Current version for handling future migrations
const CONFIG_VERSION = '1.0.0'

/**
 * Save table configuration to localStorage with enhanced logging
 */
export function saveTableConfig(
  reportType: keyof typeof STORAGE_KEYS,
  columns: { id: string; width?: number; visible?: boolean }[],
  columnOrder?: string[]
): void {
  try {
    if (typeof window === 'undefined') return // SSR safety

    // Create column config with order, width, and visibility
    const columnConfigs: ColumnConfig[] = columns.map((col, index) => ({
      id: col.id,
      width: col.width || 100,
      order: columnOrder ? columnOrder.indexOf(col.id) : index,
      visible: col.visible !== false // default to true if not specified
    }))

    const config: TableConfig = {
      columns: columnConfigs,
      timestamp: Date.now(),
      version: CONFIG_VERSION
    }

    const storageKey = STORAGE_KEYS[reportType]
    localStorage.setItem(storageKey, JSON.stringify(config))

    // Dispatch custom event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tableConfigChanged', {
        detail: { reportType, config, source: 'tableStorage' }
      }))
    }

    // Calculate expiration date for user information
    const expirationDate = new Date(Date.now() + CONFIG_EXPIRY)

    console.log(`💾 Table config saved for ${reportType}:`, {
      columns: config.columns.length,
      visibleColumns: config.columns.filter(col => col.visible).length,
      hiddenColumns: config.columns.filter(col => !col.visible).length,
      savedAt: new Date(config.timestamp).toLocaleString('en-GB'),
      expiresAt: expirationDate.toLocaleString('en-GB'),
      validFor: '365 days (1 year)',
      storageKey,
      dataSize: new Blob([JSON.stringify(config)]).size + ' bytes'
    })

    // Force save to localStorage (sometimes there are quotas)
    try {
      const testRead = localStorage.getItem(storageKey)
      if (!testRead) {
        console.warn('⚠️  Warning: Config may not have been saved properly to localStorage')
      }
    } catch (readError) {
      console.error('❌ Error verifying save:', readError)
    }
  } catch (error) {
    console.error('❌ Failed to save table config:', error)

    // Try to provide helpful error information
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        console.error('💾 LocalStorage quota exceeded. Consider clearing old data.')
      } else {
        console.error('Error details:', error.message)
      }
    }
  }
}

/**
 * Load table configuration from localStorage with enhanced validation
 */
export function loadTableConfig(
  reportType: keyof typeof STORAGE_KEYS
): TableConfig | null {
  try {
    if (typeof window === 'undefined') return null // SSR safety

    const storageKey = STORAGE_KEYS[reportType]
    const storedConfig = localStorage.getItem(storageKey)

    if (!storedConfig) {
      console.log(`📭 No saved table config found for ${reportType}`)
      return null
    }

    const config: TableConfig = JSON.parse(storedConfig)

    // Validate config structure
    if (!config.columns || !Array.isArray(config.columns) || !config.timestamp) {
      console.warn(`🚫 Invalid config structure for ${reportType}, removing`)
      localStorage.removeItem(storageKey)
      return null
    }

    // Check if config has expired (1 year)
    const ageInMs = Date.now() - config.timestamp
    const ageInDays = Math.round(ageInMs / (1000 * 60 * 60 * 24))
    const isExpired = ageInMs > CONFIG_EXPIRY

    if (isExpired) {
      localStorage.removeItem(storageKey)
      console.log(`⏰ Expired table config removed for ${reportType} (${ageInDays} days old)`)
      return null
    }

    // Version check for future migrations
    if (config.version !== CONFIG_VERSION) {
      console.warn(`🔄 Version mismatch for ${reportType} config (saved: ${config.version}, expected: ${CONFIG_VERSION}), using defaults`)
      return null
    }

    // Calculate remaining time
    const remainingMs = CONFIG_EXPIRY - ageInMs
    const remainingDays = Math.round(remainingMs / (1000 * 60 * 60 * 24))

    console.log(`✅ Table config loaded successfully for ${reportType}:`, {
      columns: config.columns.length,
      visibleColumns: config.columns.filter(col => col.visible).length,
      hiddenColumns: config.columns.filter(col => !col.visible).length,
      savedOn: new Date(config.timestamp).toLocaleString('en-GB'),
      ageInDays: `${ageInDays} days ago`,
      remainingDays: `${remainingDays} days remaining`,
      validUntil: new Date(config.timestamp + CONFIG_EXPIRY).toLocaleString('en-GB'),
      storageKey,
      dataSize: new Blob([storedConfig]).size + ' bytes'
    })

    return config

  } catch (error) {
    console.error('❌ Failed to load table config:', error)

    // Clean up corrupted config
    try {
      const storageKey = STORAGE_KEYS[reportType]
      localStorage.removeItem(storageKey)
      console.log(`🧹 Removed corrupted config for ${reportType}`)
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError)
    }

    return null
  }
}

/**
 * Get column configuration for specific column
 */
export function getColumnConfig(
  reportType: keyof typeof STORAGE_KEYS,
  columnId: string
): ColumnConfig | null {
  const config = loadTableConfig(reportType)
  if (!config) return null

  return config.columns.find(col => col.id === columnId) || null
}

/**
 * Update specific column width
 */
export function updateColumnWidth(
  reportType: keyof typeof STORAGE_KEYS,
  columnId: string,
  newWidth: number,
  allColumns: { id: string; width?: number; visible?: boolean }[]
): void {
  try {
    console.log(`📐 updateColumnWidth called:`, {
      reportType,
      columnId,
      newWidth,
      totalColumns: allColumns.length,
      allColumnWidths: allColumns.map(col => ({ id: col.id, width: col.width }))
    })

    // Update the column width in the provided array
    const updatedColumns = allColumns.map(col =>
      col.id === columnId
        ? { ...col, width: newWidth }
        : col
    )

    console.log(`💾 About to save config with updated widths:`,
      updatedColumns.map(col => ({ id: col.id, width: col.width, visible: col.visible }))
    )

    saveTableConfig(reportType, updatedColumns)

    console.log(`✅ Column width update completed for ${columnId}`)
  } catch (error) {
    console.warn('Failed to update column width:', error)
  }
}

/**
 * Update column order
 */
export function updateColumnOrder(
  reportType: keyof typeof STORAGE_KEYS,
  newOrder: string[],
  allColumns: { id: string; width?: number; visible?: boolean }[]
): void {
  try {
    saveTableConfig(reportType, allColumns, newOrder)
  } catch (error) {
    console.warn('Failed to update column order:', error)
  }
}

/**
 * Update column visibility
 */
export function updateColumnVisibility(
  reportType: keyof typeof STORAGE_KEYS,
  visibilityMap: { [columnId: string]: boolean },
  allColumns: { id: string; width?: number; visible?: boolean }[]
): void {
  try {
    const updatedColumns = allColumns.map(col => ({
      ...col,
      visible: visibilityMap[col.id] !== false
    }))

    saveTableConfig(reportType, updatedColumns)
  } catch (error) {
    console.warn('Failed to update column visibility:', error)
  }
}

/**
 * Clear all table configurations (useful for reset/debugging)
 */
export function clearAllTableConfigs(): void {
  try {
    if (typeof window === 'undefined') return

    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })

    console.log('All table configurations cleared')
  } catch (error) {
    console.warn('Failed to clear table configs:', error)
  }
}

/**
 * Get comprehensive storage info for debugging and monitoring
 */
export function getStorageInfo() {
  if (typeof window === 'undefined') return null

  try {
    const storageStats = {
      mainReport: null as any,
      productsReport: null as any,
      totalStorageSize: 0,
      tableConfigsSize: 0,
      isHealthy: true,
      errors: [] as string[]
    }

    // Analyze main report config
    try {
      const mainRaw = localStorage.getItem(STORAGE_KEYS.MAIN_REPORT)
      if (mainRaw) {
        const mainConfig = JSON.parse(mainRaw)
        const mainAge = Date.now() - mainConfig.timestamp
        storageStats.mainReport = {
          exists: true,
          size: new Blob([mainRaw]).size,
          columns: mainConfig.columns?.length || 0,
          age: Math.round(mainAge / (1000 * 60 * 60 * 24)),
          expires: Math.round((CONFIG_EXPIRY - mainAge) / (1000 * 60 * 60 * 24)),
          isExpired: mainAge > CONFIG_EXPIRY,
          version: mainConfig.version
        }
        storageStats.tableConfigsSize += storageStats.mainReport.size
      } else {
        storageStats.mainReport = { exists: false }
      }
    } catch (error) {
      storageStats.errors.push(`Main report config error: ${error}`)
      storageStats.isHealthy = false
    }

    // Analyze products report config
    try {
      const productsRaw = localStorage.getItem(STORAGE_KEYS.PRODUCTS_REPORT)
      if (productsRaw) {
        const productsConfig = JSON.parse(productsRaw)
        const productsAge = Date.now() - productsConfig.timestamp
        storageStats.productsReport = {
          exists: true,
          size: new Blob([productsRaw]).size,
          columns: productsConfig.columns?.length || 0,
          age: Math.round(productsAge / (1000 * 60 * 60 * 24)),
          expires: Math.round((CONFIG_EXPIRY - productsAge) / (1000 * 60 * 60 * 24)),
          isExpired: productsAge > CONFIG_EXPIRY,
          version: productsConfig.version
        }
        storageStats.tableConfigsSize += storageStats.productsReport.size
      } else {
        storageStats.productsReport = { exists: false }
      }
    } catch (error) {
      storageStats.errors.push(`Products report config error: ${error}`)
      storageStats.isHealthy = false
    }

    // Calculate total localStorage usage
    try {
      let totalSize = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length
        }
      }
      storageStats.totalStorageSize = totalSize
    } catch (error) {
      storageStats.errors.push(`Storage size calculation error: ${error}`)
    }

    return storageStats
  } catch (error) {
    return {
      isHealthy: false,
      errors: [`Critical storage info error: ${error}`],
      mainReport: { exists: false },
      productsReport: { exists: false },
      totalStorageSize: 0,
      tableConfigsSize: 0
    }
  }
}

/**
 * Validate and repair table configurations if needed
 */
export function validateAndRepairConfigs(): { repaired: boolean; issues: string[] } {
  const issues: string[] = []
  let repaired = false

  if (typeof window === 'undefined') {
    return { repaired: false, issues: ['Not in browser environment'] }
  }

  // Check each config
  Object.entries(STORAGE_KEYS).forEach(([reportType, storageKey]) => {
    try {
      const config = loadTableConfig(reportType as keyof typeof STORAGE_KEYS)
      if (!config) {
        issues.push(`No valid config found for ${reportType}`)
        return
      }

      // Validate column structure
      const invalidColumns = config.columns.filter(col =>
        !col.id || typeof col.width !== 'number' || typeof col.visible !== 'boolean'
      )

      if (invalidColumns.length > 0) {
        issues.push(`Invalid columns found in ${reportType}: ${invalidColumns.length}`)

        // Try to repair
        const repairedColumns = config.columns.map(col => ({
          id: col.id || `col-${Date.now()}`,
          width: typeof col.width === 'number' ? col.width : 100,
          order: typeof col.order === 'number' ? col.order : 0,
          visible: typeof col.visible === 'boolean' ? col.visible : true
        }))

        localStorage.setItem(storageKey, JSON.stringify({
          ...config,
          columns: repairedColumns,
          timestamp: Date.now() // Update timestamp to reset expiry
        }))

        repaired = true
        issues.push(`Repaired ${reportType} config`)
      }

    } catch (error) {
      issues.push(`Error validating ${reportType}: ${error}`)
    }
  })

  return { repaired, issues }
}