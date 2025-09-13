'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { updateColumnWidth, updateColumnOrder, loadTableConfig } from '@/app/lib/utils/tableStorage'

const EMPTY_SENSORS: any[] = []

interface Column {
  id: string
  header: string
  accessor: string
  minWidth?: number
  width?: number
  render?: (value: any, item: any, rowIndex: number) => React.ReactNode
}

interface ResizableTableProps {
  columns: Column[]
  data: any[]
  className?: string
  onRowClick?: (item: any, index: number) => void
  onRowDoubleClick?: (item: any, index: number) => void
  selectedRowId?: string | null
  reportType?: 'MAIN_REPORT' | 'PRODUCTS_REPORT' // for localStorage key
  onColumnsChange?: (columns: Column[]) => void // callback for parent component
}

interface SortableHeaderProps {
  column: Column
  width: number
  onResize: (columnId: string, newWidth: number) => void
  onResizeStateChange: (isResizing: boolean) => void
}

function SortableHeader({ column, width, onResize, onResizeStateChange }: SortableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: column.id,
    data: { type: 'column' }
  })

  const [isResizing, setIsResizing] = useState(false)
  const resizeStartX = useRef(0)
  const resizeStartWidth = useRef(0)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: `${width}px`,
    minWidth: `${width}px`,
    maxWidth: `${width}px`,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Set resizing state immediately
    setIsResizing(true)
    onResizeStateChange(true)

    // Store initial values
    resizeStartX.current = e.clientX
    resizeStartWidth.current = width

    // Prevent text selection during resize
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }, [width, onResizeStateChange])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartX.current
      const newWidth = Math.max(20, resizeStartWidth.current - deltaX) // Minimum 20px width
      onResize(column.id, newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      onResizeStateChange(false)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, column.id, onResize, onResizeStateChange])

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="relative px-4 py-3 text-right font-medium bg-[#374151] border-b border-r border-gray-600 select-none"
      {...attributes}
    >
      {/* Resize areas - completely separate from draggable content */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-20"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleResizeStart(e)
        }}
        style={{ pointerEvents: 'auto' }}
      />
      <div
        className="absolute -left-2 top-0 bottom-0 w-4 cursor-col-resize z-10"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleResizeStart(e)
        }}
        style={{ pointerEvents: 'auto' }}
      />

      {/* Draggable header content */}
      <div
        className="flex items-center justify-between relative z-0"
        {...(isResizing ? {} : listeners)}
      >
        <span className="text-gray-200 truncate">{column.header}</span>
      </div>
    </th>
  )
}

export default function ResizableTable({
  columns: initialColumns,
  data,
  className = '',
  onRowClick,
  onRowDoubleClick,
  selectedRowId,
  reportType,
  onColumnsChange
}: ResizableTableProps) {
  const [columns, setColumns] = useState<Column[]>([])
  const [isAnyColumnResizing, setIsAnyColumnResizing] = useState(false)
  const [tableId, setTableId] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced save function - only saves after user stops resizing
  const debouncedSave = useCallback((
    action: 'resize' | 'reorder',
    updatedColumns: Column[],
    newOrder?: string[]
  ) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout to save after 500ms of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      if (!reportType) return

      const columnsForStorage = updatedColumns.map(col => ({
        id: col.id,
        width: col.width || 100,
        visible: true // assume visible since it's in the table
      }))

      if (action === 'reorder' && newOrder) {
        updateColumnOrder(reportType, newOrder, columnsForStorage)
        console.log(`🔄 Column order saved for ${reportType} (debounced)`)
      } else {
        // Find which column was resized by comparing with current columns
        const columnId = updatedColumns.find((col, index) =>
          col.width !== columns[index]?.width
        )?.id

        if (columnId) {
          const newWidth = updatedColumns.find(col => col.id === columnId)?.width || 100
          updateColumnWidth(reportType, columnId, newWidth, columnsForStorage)
          console.log(`📐 Column width saved for ${reportType}: ${columnId} = ${newWidth}px (debounced)`)
        }
      }
    }, 500) // Save after 500ms of no activity
  }, [reportType, columns])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Fix hydration mismatch by setting tableId on client side only
  useEffect(() => {
    setTableId(`table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  }, [])

  // Monitor container width to determine scrollbar visibility
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
      }
    }

    updateContainerWidth()
    window.addEventListener('resize', updateContainerWidth)

    return () => {
      window.removeEventListener('resize', updateContainerWidth)
    }
  }, [])

  // Initialize columns with saved configuration when reportType is available
  useEffect(() => {
    if (!reportType || isInitialized) return

    const initializeColumns = () => {
      try {
        // Load saved configuration from localStorage
        const savedConfig = loadTableConfig(reportType)

        if (savedConfig && savedConfig.columns.length > 0) {
          console.log(`🔄 Loading saved table config for ${reportType}:`, savedConfig)

          // Apply saved configuration: order, width, and visibility
          const configuredColumns = savedConfig.columns
            .sort((a, b) => a.order - b.order) // Sort by saved order
            .map(savedCol => {
              const originalCol = initialColumns.find(col => col.id === savedCol.id)
              if (!originalCol || !savedCol.visible) return null // Skip invisible or missing columns

              return {
                ...originalCol,
                width: savedCol.width // Apply saved width
              }
            })
            .filter(Boolean) as Column[] // Remove null values

          // Add any new columns that weren't in saved config (for backwards compatibility)
          const configuredIds = new Set(savedConfig.columns.map(col => col.id))
          const newColumns = initialColumns
            .filter(col => !configuredIds.has(col.id))
            .map(col => ({ ...col, width: col.width || col.minWidth || 100 }))

          const finalColumns = [...configuredColumns, ...newColumns]

          console.log(`✅ Applied saved config for ${reportType}:`, {
            totalColumns: finalColumns.length,
            visibleColumns: finalColumns.length,
            configuredFromStorage: configuredColumns.length,
            newColumns: newColumns.length
          })

          setColumns(finalColumns)
        } else {
          // No saved config, use initial columns with default widths
          const defaultColumns = initialColumns.map(col => ({
            ...col,
            width: col.width || col.minWidth || 100
          }))

          console.log(`📝 No saved config found for ${reportType}, using defaults`)
          setColumns(defaultColumns)
        }
      } catch (error) {
        console.error('Error initializing table columns:', error)
        // Fallback to initial columns
        setColumns(initialColumns.map(col => ({
          ...col,
          width: col.width || col.minWidth || 100
        })))
      }

      setIsInitialized(true)
    }

    initializeColumns()
  }, [initialColumns, reportType, isInitialized])

  // Update columns when initialColumns change (but only if not using saved config)
  useEffect(() => {
    if (!isInitialized || !reportType) {
      setColumns(initialColumns.map(col => ({
        ...col,
        width: col.width || col.minWidth || 100
      })))
    }
  }, [initialColumns, isInitialized, reportType])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setColumns((columns) => {
        const oldIndex = columns.findIndex(col => col.id === active.id)
        const newIndex = columns.findIndex(col => col.id === over.id)
        const reorderedColumns = arrayMove(columns, oldIndex, newIndex)

        // Use debounced save for reordering
        if (reportType) {
          const newOrder = reorderedColumns.map(col => col.id)
          debouncedSave('reorder', reorderedColumns, newOrder)
        }

        // Notify parent component of changes
        if (onColumnsChange) {
          onColumnsChange(reorderedColumns)
        }

        return reorderedColumns
      })
    }
  }, [reportType, onColumnsChange, debouncedSave])

  const emptyDragEnd = useCallback(() => {}, [])

  const handleColumnResize = useCallback((columnId: string, newWidth: number) => {
    setColumns(prev => {
      const updatedColumns = prev.map(col =>
        col.id === columnId ? { ...col, width: newWidth } : col
      )

      // Use debounced save for resizing - only saves after user stops resizing
      if (reportType) {
        debouncedSave('resize', updatedColumns)
      }

      // Notify parent component of changes immediately for UI responsiveness
      if (onColumnsChange) {
        onColumnsChange(updatedColumns)
      }

      return updatedColumns
    })
  }, [reportType, onColumnsChange, debouncedSave])

  // Update container width whenever columns change
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
      }
    }
    updateWidth()
  }, [columns])

  const totalWidth = columns.reduce((sum, col) => sum + (col.width || 100), 0)
  // Add some buffer for borders and padding
  const needsHorizontalScroll = totalWidth > (containerWidth - 20) && containerWidth > 0

  return (
    <div className={`h-full ${className}`} ref={containerRef}>
      <div 
        className={`h-full ${
          needsHorizontalScroll ? 'custom-scrollbar' : 'scrollbar-hide overflow-y-auto'
        }`}
        style={{ 
          overflowX: needsHorizontalScroll ? 'auto' : 'hidden'
        }}
      >
        <DndContext
          id={tableId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={isAnyColumnResizing ? emptyDragEnd : handleDragEnd}
        >
          <table className="text-sm w-full" style={{ minWidth: `${totalWidth}px`, tableLayout: 'fixed' }}>
          <thead className="bg-[#374151] border-b border-gray-600 sticky top-0">
            <SortableContext items={columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
              <tr>
                {columns.map((column) => (
                  <SortableHeader
                    key={column.id}
                    column={column}
                    width={column.width || 100}
                    onResize={handleColumnResize}
                    onResizeStateChange={setIsAnyColumnResizing}
                  />
                ))}
              </tr>
            </SortableContext>
          </thead>
          <tbody className="bg-[#2B3544]">
            {data.map((item, rowIndex) => (
              <tr
                key={item.id || rowIndex}
                className={`border-b border-gray-700 cursor-pointer transition-colors ${
                  selectedRowId === item.id 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'hover:bg-[#374151]'
                }`}
                onClick={() => onRowClick?.(item, rowIndex)}
                onDoubleClick={() => onRowDoubleClick?.(item, rowIndex)}
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className="px-4 py-3 text-gray-300 border-r border-gray-700"
                    style={{ 
                      width: `${column.width}px`, 
                      minWidth: `${column.width}px`,
                      maxWidth: `${column.width}px` 
                    }}
                  >
                    <div className="truncate">
                      {column.render 
                        ? column.render(item[column.accessor], item, rowIndex)
                        : column.accessor === '#' 
                        ? rowIndex + 1 
                        : item[column.accessor]
                      }
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          </table>
        </DndContext>
      </div>
    </div>
  )
}