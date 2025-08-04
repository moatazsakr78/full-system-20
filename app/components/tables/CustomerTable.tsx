'use client'

import { useState } from 'react'

interface Customer {
  id: number
  name: string
  phone: string
  email: string
  address: string
  city: string
  accountBalance: number
  createdAt: string
}

interface CustomerTableProps {
  showActions?: boolean
}

const mockCustomers: Customer[] = [
  {
    id: 1,
    name: 'عميل',
    phone: '',
    email: '',
    address: '',
    city: 'bronze',
    accountBalance: 0,
    createdAt: 'Jul 9, 2025'
  }
]

export default function CustomerTable({ showActions = false }: CustomerTableProps) {
  const [selectedRows, setSelectedRows] = useState<number[]>([])

  const toggleRowSelection = (id: number) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    )
  }

  const toggleAllSelection = () => {
    setSelectedRows(prev => 
      prev.length === mockCustomers.length ? [] : mockCustomers.map(c => c.id)
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-right">
        <thead className="bg-gray-700 text-gray-300">
          <tr>
            <th className="p-3 text-center">
              <input
                type="checkbox"
                checked={selectedRows.length === mockCustomers.length}
                onChange={toggleAllSelection}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </th>
            <th className="p-3 text-right font-medium">#</th>
            <th className="p-3 text-right font-medium">الاسم</th>
            <th className="p-3 text-right font-medium">الفئة</th>
            <th className="p-3 text-right font-medium">الحساب</th>
            <th className="p-3 text-right font-medium">الراتب</th>
            <th className="p-3 text-right font-medium">رقم الهاتف</th>
            <th className="p-3 text-right font-medium">المدينة</th>
            <th className="p-3 text-right font-medium">العنوان</th>
            <th className="p-3 text-right font-medium">تاريخ الإنشاء</th>
          </tr>
        </thead>
        <tbody className="bg-pos-darker divide-y divide-gray-700">
          {mockCustomers.map((customer) => (
            <tr 
              key={customer.id}
              className={`hover:bg-gray-700 transition-colors ${
                selectedRows.includes(customer.id) ? 'bg-blue-900/20' : ''
              }`}
            >
              <td className="p-3 text-center">
                <input
                  type="checkbox"
                  checked={selectedRows.includes(customer.id)}
                  onChange={() => toggleRowSelection(customer.id)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </td>
              <td className="p-3 text-white font-medium">{customer.id}</td>
              <td className="p-3 text-white font-medium">{customer.name}</td>
              <td className="p-3 text-white">{customer.email || 'عميل'}</td>
              <td className="p-3 text-white">{customer.accountBalance}</td>
              <td className="p-3 text-white">{customer.city}</td>
              <td className="p-3 text-white">{customer.phone || '-'}</td>
              <td className="p-3 text-white">{customer.city}</td>
              <td className="p-3 text-white">{customer.address || '-'}</td>
              <td className="p-3 text-gray-400">{customer.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}