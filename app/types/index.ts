import { Tables } from './database'

// Database table types for easy import
export type Product = Tables<'products'>
export type Customer = Tables<'customers'>
export type Supplier = Tables<'suppliers'>
export type Sale = Tables<'sales'>
export type SaleItem = Tables<'sale_items'>
export type Inventory = Tables<'inventory'>
export type Branch = Tables<'branches'>
export type Category = Tables<'categories'>
export type Record = Tables<'records'>
export type UserProfile = Tables<'user_profiles'>

// Common UI Types
export interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
  visible?: boolean
  width?: number
  id?: string
}

export interface DataTableProps {
  columns: TableColumn[]
  data: any[]
  loading?: boolean
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  currentSort?: { key: string; direction: 'asc' | 'desc' }
  className?: string
}

export interface SearchInputProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  className?: string
}

export interface StatusDotProps {
  active: boolean
  size?: 'sm' | 'md' | 'lg'
}

// Real-time subscription status
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error'

export interface RealTimeStatus {
  status: ConnectionStatus
  lastUpdated: Date
  error?: string
}

// Cache related types
export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum cache size
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}

// Form related types  
export interface FormField {
  name: string
  type: 'text' | 'number' | 'email' | 'tel' | 'textarea' | 'select'
  label: string
  required?: boolean
  options?: { value: string; label: string }[]
  validation?: (value: any) => string | undefined
}

// Filter and pagination types
export interface FilterOption {
  key: string
  value: any
  label: string
}

export interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface TableState {
  filters: FilterOption[]
  pagination: PaginationInfo
  sort: { key: string; direction: 'asc' | 'desc' } | null
  search: string
}