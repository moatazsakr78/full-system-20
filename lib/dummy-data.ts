import { Product, Category } from '../components/website/shared/types';

export const categories: Category[] = [
  {
    id: 1,
    name: 'إلكترونيات',
    description: 'أحدث الأجهزة الإلكترونية والتقنية',
    icon: '📱',
    image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop',
    productCount: 25
  },
  {
    id: 2,
    name: 'ملابس',
    description: 'أزياء رجالية ونسائية عصرية',
    icon: '👕',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    productCount: 45
  },
  {
    id: 3,
    name: 'منزل وحديقة',
    description: 'كل ما تحتاجه لمنزلك وحديقتك',
    icon: '🏠',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    productCount: 35
  },
  {
    id: 4,
    name: 'رياضة ولياقة',
    description: 'معدات رياضية وأدوات اللياقة البدنية',
    icon: '⚽',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    productCount: 20
  },
  {
    id: 5,
    name: 'جمال وعناية',
    description: 'منتجات التجميل والعناية الشخصية',
    icon: '💄',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
    productCount: 30
  },
  {
    id: 6,
    name: 'كتب ومكتبة',
    description: 'كتب ومواد تعليمية ومكتبية',
    icon: '📚',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
    productCount: 15
  },
  {
    id: 7,
    name: 'ألعاب وهوايات',
    description: 'ألعاب ومستلزمات الهوايات',
    icon: '🎮',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop',
    productCount: 18
  },
  {
    id: 8,
    name: 'طعام ومشروبات',
    description: 'منتجات غذائية ومشروبات طازجة',
    icon: '🍎',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop',
    productCount: 40
  }
];

export const products: Product[] = [
  // Electronics
  {
    id: 1,
    name: 'هاتف ذكي أندرويد',
    description: 'هاتف ذكي بمواصفات عالية وكاميرا احترافية',
    price: 1299.99,
    originalPrice: 1499.99,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
    category: 'إلكترونيات',
    brand: 'Samsung',
    stock: 15,
    rating: 4.5,
    reviews: 128,
    isOnSale: true,
    discount: 13,
    tags: ['جديد', 'مميز', 'أندرويد']
  },
  {
    id: 2,
    name: 'سماعات لاسلكية',
    description: 'سماعات بلوتوث عالية الجودة مع إلغاء الضوضاء',
    price: 299.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    category: 'إلكترونيات',
    brand: 'Sony',
    stock: 25,
    rating: 4.8,
    reviews: 95,
    tags: ['بلوتوث', 'لاسلكي']
  },
  {
    id: 3,
    name: 'لابتوب العمل',
    description: 'لابتوب قوي مناسب للعمل والدراسة',
    price: 2499.99,
    originalPrice: 2799.99,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop',
    category: 'إلكترونيات',
    brand: 'Lenovo',
    stock: 8,
    rating: 4.6,
    reviews: 67,
    isOnSale: true,
    discount: 11,
    tags: ['عمل', 'مكتبي']
  },

  // Clothing
  {
    id: 4,
    name: 'قميص رجالي كلاسيكي',
    description: 'قميص قطني أنيق مناسب للمناسبات الرسمية',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop',
    category: 'ملابس',
    brand: 'Fashion Brand',
    stock: 30,
    rating: 4.3,
    reviews: 42,
    tags: ['رجالي', 'كلاسيكي', 'قطن']
  },
  {
    id: 5,
    name: 'فستان نسائي أنيق',
    description: 'فستان عصري مناسب للمناسبات المختلفة',
    price: 199.99,
    originalPrice: 249.99,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop',
    category: 'ملابس',
    brand: 'Elegant',
    stock: 20,
    rating: 4.7,
    reviews: 58,
    isOnSale: true,
    discount: 20,
    tags: ['نسائي', 'أنيق', 'مناسبات']
  },

  // Home & Garden
  {
    id: 6,
    name: 'طقم أكواب قهوة',
    description: 'طقم أكواب قهوة فاخر من السيراميك',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop',
    category: 'منزل وحديقة',
    brand: 'Home Collection',
    stock: 50,
    rating: 4.4,
    reviews: 73,
    tags: ['قهوة', 'سيراميك', 'منزل']
  },
  {
    id: 7,
    name: 'نبتة زينة داخلية',
    description: 'نبتة خضراء جميلة لتزيين المنزل والمكتب',
    price: 45.99,
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
    category: 'منزل وحديقة',
    brand: 'Green Life',
    stock: 35,
    rating: 4.6,
    reviews: 29,
    tags: ['نبات', 'زينة', 'أخضر']
  },

  // Sports & Fitness
  {
    id: 8,
    name: 'دمبل رياضي قابل للتعديل',
    description: 'دمبل متعدد الأوزان للتمارين المنزلية',
    price: 159.99,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
    category: 'رياضة ولياقة',
    brand: 'FitnessPro',
    stock: 18,
    rating: 4.5,
    reviews: 34,
    tags: ['دمبل', 'تمارين', 'منزلي']
  },
  {
    id: 9,
    name: 'حصيرة يوغا احترافية',
    description: 'حصيرة يوغا مضادة للانزلاق وصديقة للبيئة',
    price: 89.99,
    originalPrice: 109.99,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
    category: 'رياضة ولياقة',
    brand: 'YogaLife',
    stock: 22,
    rating: 4.8,
    reviews: 51,
    isOnSale: true,
    discount: 18,
    tags: ['يوغا', 'حصيرة', 'رياضة']
  },

  // Beauty & Care
  {
    id: 10,
    name: 'كريم مرطب للوجه',
    description: 'كريم مرطب طبيعي لجميع أنواع البشرة',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
    category: 'جمال وعناية',
    brand: 'Natural Beauty',
    stock: 40,
    rating: 4.7,
    reviews: 86,
    tags: ['كريم', 'مرطب', 'طبيعي']
  },

  // Books & Stationery
  {
    id: 11,
    name: 'كتاب تطوير الذات',
    description: 'كتاب ملهم لتطوير الشخصية والنجاح',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
    category: 'كتب ومكتبة',
    brand: 'Knowledge House',
    stock: 60,
    rating: 4.9,
    reviews: 124,
    tags: ['كتاب', 'تطوير', 'تعلم']
  },

  // Games & Hobbies
  {
    id: 12,
    name: 'لعبة ألغاز خشبية',
    description: 'لعبة ألغاز تعليمية من الخشب الطبيعي',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=400&fit=crop',
    category: 'ألعاب وهوايات',
    brand: 'Puzzle World',
    stock: 25,
    rating: 4.4,
    reviews: 33,
    tags: ['ألغاز', 'خشبي', 'تعليمي']
  },

  // Food & Beverages
  {
    id: 13,
    name: 'عسل طبيعي أصلي',
    description: 'عسل طبيعي من أفضل المناحل العربية',
    price: 55.99,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop',
    category: 'طعام ومشروبات',
    brand: 'Pure Honey',
    stock: 45,
    rating: 4.6,
    reviews: 78,
    tags: ['عسل', 'طبيعي', 'أصلي']
  },
  {
    id: 14,
    name: 'قهوة عربية فاخرة',
    description: 'قهوة عربية محمصة بعناية من أجود الحبوب',
    price: 89.99,
    originalPrice: 99.99,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
    category: 'طعام ومشروبات',
    brand: 'Arabian Coffee',
    stock: 30,
    rating: 4.8,
    reviews: 92,
    isOnSale: true,
    discount: 10,
    tags: ['قهوة', 'عربية', 'فاخرة']
  },

  // Additional products for better variety
  {
    id: 15,
    name: 'ساعة ذكية رياضية',
    description: 'ساعة ذكية لتتبع اللياقة البدنية والصحة',
    price: 399.99,
    originalPrice: 499.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    category: 'إلكترونيات',
    brand: 'SmartTech',
    stock: 12,
    rating: 4.5,
    reviews: 156,
    isOnSale: true,
    discount: 20,
    tags: ['ساعة', 'ذكية', 'رياضة']
  },
  {
    id: 16,
    name: 'حقيبة ظهر عصرية',
    description: 'حقيبة ظهر أنيقة ومقاومة للماء',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    category: 'ملابس',
    brand: 'Urban Style',
    stock: 28,
    rating: 4.4,
    reviews: 64,
    tags: ['حقيبة', 'ظهر', 'مقاومة للماء']
  }
];

export const featuredProducts = products.filter(product => product.isOnSale || (product.rating && product.rating >= 4.5));

export const getProductsByCategory = (categoryName: string): Product[] => {
  return products.filter(product => product.category === categoryName);
};

export const searchProducts = (query: string): Product[] => {
  const lowercaseQuery = query.toLowerCase();
  return products.filter(product =>
    product.name.toLowerCase().includes(lowercaseQuery) ||
    (product.description && product.description.toLowerCase().includes(lowercaseQuery)) ||
    (product.category && product.category.toLowerCase().includes(lowercaseQuery)) ||
    product.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};