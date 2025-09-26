'use client'

import { useState } from 'react'
import { Customer } from '../lib/hooks/useCustomers'
import { ranks } from '@/app/lib/data/ranks'
import Image from 'next/image'
import {
  UserCircleIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  StarIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'

interface CustomersGridViewProps {
  customers: Customer[]
  selectedCustomer: Customer | null
  onCustomerClick: (customer: Customer) => void
  onCustomerDoubleClick: (customer: Customer) => void
  isDefaultCustomer: (customerId: string) => boolean
}

export default function CustomersGridView({
  customers,
  selectedCustomer,
  onCustomerClick,
  onCustomerDoubleClick,
  isDefaultCustomer
}: CustomersGridViewProps) {

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-SA')
  }

  const getRankInfo = (rankId: string | null) => {
    if (!rankId) return null
    return ranks.find(r => r.id === rankId)
  }

  // دالة لتوليد صور Avatar بناءً على البريد الإلكتروني أو الاسم
  const getAvatarUrl = (customer: Customer, size: number = 80) => {
    // إذا كان العميل لديه بريد إلكتروني، استخدم UI Avatars
    if (customer.email) {
      const name = encodeURIComponent(customer.name)
      const email = encodeURIComponent(customer.email)
      return `https://ui-avatars.com/api/?name=${name}&email=${email}&size=${size}&background=random&color=fff&format=png&rounded=true`
    }

    // إذا لم يكن لديه بريد، استخدم الاسم فقط
    const name = encodeURIComponent(customer.name)
    return `https://ui-avatars.com/api/?name=${name}&size=${size}&background=random&color=fff&format=png&rounded=true`
  }

  // دالة بديلة لتوليد صور الأفاتار بناءً على الاسم
  const getInitialsAvatar = (name: string) => {
    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase()

    // ألوان متنوعة للأفاتار
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ]

    const colorIndex = name.length % colors.length
    const backgroundColor = colors[colorIndex]

    return {
      initials,
      backgroundColor
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 p-4">
      {customers.map((customer) => {
        const isSelected = selectedCustomer?.id === customer.id
        const isDefault = isDefaultCustomer(customer.id)
        const rankInfo = getRankInfo(customer.rank)
        const avatarUrl = getAvatarUrl(customer, 80)
        const initialsAvatar = getInitialsAvatar(customer.name)

        return (
          <div
            key={customer.id}
            onClick={() => onCustomerClick(customer)}
            onDoubleClick={() => onCustomerDoubleClick(customer)}
            className={`
              relative bg-[#374151] rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg
              ${isSelected
                ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                : 'border-gray-600 hover:border-gray-500'
              }
            `}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-600">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <img
                        src={avatarUrl}
                        alt={customer.name}
                        className="h-12 w-12 rounded-full object-cover border-2 border-gray-600"
                        onError={(e) => {
                          // في حالة فشل تحميل الصورة، استخدم الأحرف الأولى
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            const fallback = document.createElement('div')
                            fallback.className = 'h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-gray-600'
                            fallback.style.backgroundColor = initialsAvatar.backgroundColor
                            fallback.textContent = initialsAvatar.initials
                            parent.appendChild(fallback)
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Name and Default Badge */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold text-lg truncate">
                        {customer.name}
                      </h3>
                      {isDefault && (
                        <StarIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>

                    {/* Category */}
                    <p className="text-gray-300 text-sm truncate">
                      {customer.category || 'غير محدد'}
                    </p>
                  </div>
                </div>

                {/* Rank Badge */}
                {rankInfo && (
                  <div className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded-full flex-shrink-0">
                    <div className="w-4 h-4 relative">
                      <Image
                        src={rankInfo.icon}
                        alt={rankInfo.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-xs text-white font-medium">
                      {rankInfo.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Loyalty Points */}
              <div className="flex items-center gap-2">
                <TrophyIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span className="text-sm text-gray-300">النقاط:</span>
                <span className="text-white font-medium">
                  {(customer.loyalty_points || 0).toLocaleString()}
                </span>
              </div>

              {/* Phone */}
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm font-mono truncate">
                    {customer.phone}
                  </span>
                </div>
              )}

              {/* City */}
              {customer.city && (
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm truncate">
                    {customer.city}
                  </span>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-purple-400 flex-shrink-0" />
                <span className="text-sm text-gray-300">منذ:</span>
                <span className="text-gray-400 text-sm">
                  {formatDate(customer.created_at)}
                </span>
              </div>
            </div>

            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
            )}
          </div>
        )
      })}
    </div>
  )
}