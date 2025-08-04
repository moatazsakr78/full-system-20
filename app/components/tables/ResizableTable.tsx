'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
    setIsResizing(true)
    onResizeStateChange(true)
    resizeStartX.current = e.clientX
    resizeStartWidth.current = width
    document.body.style.userSelect = 'none'
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
        onMouseDown={handleResizeStart}
      />
      <div
        className="absolute -left-2 top-0 bottom-0 w-4 cursor-col-resize z-10"
        onMouseDown={handleResizeStart}
      />
      
      {/* Draggable header content */}
      <div 
        className="flex items-center justify-between relative z-0"
        {...listeners}
      >
        <span className="text-gray-200 truncate">{column.header}</span>
      </div>
    </th>
  )
}

export default function ResizableTable({ columns: initialColumns, data, className = '', onRowClick, onRowDoubleClick, selectedRowId }: ResizableTableProps) {
  const [columns, setColumns] = useState(() => 
    initialColumns.map(col => ({ 
      ...col, 
      width: col.width || col.minWidth || 100 
    }))
  )
  const [isAnyColumnResizing, setIsAnyColumnResizing] = useState(false)
  const [tableId, setTableId] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  
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

  // Update columns when initialColumns change
  useEffect(() => {
    setColumns(initialColumns.map(col => ({ 
      ...col, 
      width: col.width || col.minWidth || 100 
    })))
  }, [initialColumns])

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
        return arrayMove(columns, oldIndex, newIndex)
      })
    }
  }, [])

  const handleColumnResize = useCallback((columnId: string, newWidth: number) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, width: newWidth } : col
    ))
  }, [])

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
          sensors={isAnyColumnResizing ? [] : sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
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