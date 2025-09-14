'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import Toast from './Toast'

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

interface ToastState {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  isVisible: boolean
  duration: number
}

export default function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', duration: number = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`

    const newToast: ToastState = {
      id,
      message,
      type,
      isVisible: true,
      duration
    }

    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Render active toasts */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              transform: `translateY(${index * 60}px)`,
              zIndex: 100 - index
            }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              isVisible={toast.isVisible}
              duration={0} // Duration handled by provider
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}