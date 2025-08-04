'use client'

interface Product {
  id: number
  name: string
  category: string
  quantity: number
  price: number
  total: number
  status: 'active' | 'inactive'
  barcode: string
  code: string
  location: string
  salePrice1: number
  salePrice2: number
  salePrice3: number
  salePrice4: number
  wholesalePrice: number
}

const sampleProducts: Product[] = [
  {
    id: 1,
    name: 'كاست نوس',
    category: 'مستورد',
    quantity: 100,
    price: 110.00,
    total: 140.00,
    status: 'active',
    barcode: '112914353',
    code: '2529',
    location: '',
    salePrice1: 120.00,
    salePrice2: 0.00,
    salePrice3: 0.00,
    salePrice4: 0.00,
    wholesalePrice: 0.00
  },
  {
    id: 2,
    name: 'طقم حمام معز',
    category: 'مستورد',
    quantity: 65,
    price: 400.00,
    total: 600.00,
    status: 'active',
    barcode: '321893634',
    code: '2392935',
    location: '',
    salePrice1: 500.00,
    salePrice2: 0.00,
    salePrice3: 0.00,
    salePrice4: 0.00,
    wholesalePrice: 0.00
  },
  {
    id: 3,
    name: 'مع شهورية باقة خلون',
    category: 'مستورد',
    quantity: 80,
    price: 40.00,
    total: 50.00,
    status: 'active',
    barcode: '497320560',
    code: '23526',
    location: '',
    salePrice1: 0.00,
    salePrice2: 0.00,
    salePrice3: 0.00,
    salePrice4: 0.00,
    wholesalePrice: 0.00
  },
  {
    id: 4,
    name: 'شامبوو برغم طحون',
    category: 'مستورد',
    quantity: 100,
    price: 18.00,
    total: 29.00,
    status: 'active',
    barcode: '218296404',
    code: '23626',
    location: '',
    salePrice1: 30.00,
    salePrice2: 0.00,
    salePrice3: 0.00,
    salePrice4: 0.00,
    wholesalePrice: 0.00
  },
  {
    id: 5,
    name: 'منتج جديد',
    category: 'غير محدد',
    quantity: 0,
    price: 33.00,
    total: 33.00,
    status: 'inactive',
    barcode: '',
    code: '',
    location: '',
    salePrice1: 0.00,
    salePrice2: 0.00,
    salePrice3: 0.00,
    salePrice4: 0.00,
    wholesalePrice: 0.00
  },
  {
    id: 6,
    name: 'منتج جديدي',
    category: 'غير محدد',
    quantity: 0,
    price: 4.00,
    total: 4.00,
    status: 'inactive',
    barcode: '',
    code: '',
    location: '',
    salePrice1: 0.00,
    salePrice2: 0.00,
    salePrice3: 0.00,
    salePrice4: 0.00,
    wholesalePrice: 0.00
  },
  {
    id: 7,
    name: 'منتج سيف',
    category: 'غير محدد',
    quantity: 0,
    price: 44.00,
    total: 44.00,
    status: 'inactive',
    barcode: '',
    code: '',
    location: '',
    salePrice1: 0.00,
    salePrice2: 0.00,
    salePrice3: 0.00,
    salePrice4: 0.00,
    wholesalePrice: 0.00
  },
  {
    id: 8,
    name: 'زجاج ليرو',
    category: 'مستورد',
    quantity: 80,
    price: 70.00,
    total: 90.00,
    status: 'active',
    barcode: '178025009',
    code: '2359',
    location: '',
    salePrice1: 80.00,
    salePrice2: 0.00,
    salePrice3: 0.00,
    salePrice4: 0.00,
    wholesalePrice: 0.00
  }
]

interface ProductTableProps {
  showActions?: boolean
  showQuantityColumn?: boolean
}

export default function ProductTable({ showActions = false, showQuantityColumn = false }: ProductTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">#</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">المجموعة</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">اسم المنتج</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">الكمية الكلية</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">الحالة</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">سعر الفرد</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">سعر البيع</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">سعر الجملة</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">سعر 1</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">سعر 2</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">سعر 3</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">سعر 4</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">الموقع</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">الكود</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">الباركود</th>
            {showQuantityColumn && (
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">عدد الأطباق</th>
            )}
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">العدد الأدنى</th>
          </tr>
        </thead>
        <tbody>
          {sampleProducts.map((product) => (
            <tr key={product.id} className="border-b border-gray-700 hover:bg-gray-800">
              <td className="py-3 px-4 text-sm text-white">{product.id}</td>
              <td className="py-3 px-4 text-sm text-white">{product.category}</td>
              <td className="py-3 px-4 text-sm text-white">{product.name}</td>
              <td className="py-3 px-4 text-sm">
                <span className={`px-2 py-1 rounded text-xs ${
                  product.status === 'active' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-red-600 text-white'
                }`}>
                  {product.quantity}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    product.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className={`text-xs ${
                    product.status === 'active' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {product.status === 'active' ? `متاح ${product.quantity}` : `غير متاح 0`}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-white">{product.price.toFixed(2)}</td>
              <td className="py-3 px-4 text-sm text-white">{product.total.toFixed(2)}</td>
              <td className="py-3 px-4 text-sm text-white">{product.wholesalePrice.toFixed(2)}</td>
              <td className="py-3 px-4 text-sm text-white">{product.salePrice1.toFixed(2)}</td>
              <td className="py-3 px-4 text-sm text-white">{product.salePrice2.toFixed(2)}</td>
              <td className="py-3 px-4 text-sm text-white">{product.salePrice3.toFixed(2)}</td>
              <td className="py-3 px-4 text-sm text-white">{product.salePrice4.toFixed(2)}</td>
              <td className="py-3 px-4 text-sm text-gray-400">{product.location || '-'}</td>
              <td className="py-3 px-4 text-sm text-white">{product.code || '-'}</td>
              <td className="py-3 px-4 text-sm text-white">{product.barcode || '-'}</td>
              {showQuantityColumn && (
                <td className="py-3 px-4 text-sm">
                  <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                    0 مطابق
                  </span>
                </td>
              )}
              <td className="py-3 px-4 text-sm text-white">0</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}