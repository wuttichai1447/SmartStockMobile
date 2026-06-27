import { ProductInput } from '../models/Product';

export const MARKET_SAMPLE_PRODUCTS: ProductInput[] = [
  {
    productName: 'มะม่วงน้ำดอกไม้',
    category: 'ผลไม้',
    quantity: 45,
    barcode: 'SMM40010001',
    unit: 'กก.',
    price: 45,
    minStock: 20,
    expiryDate: '2026-06-28',
    imageUri:
      'https://images.unsplash.com/photo-1553279768-8650fa32c908?w=400&h=400&fit=crop',
  },
  {
    productName: 'ทุเรียนหมอนทอง',
    category: 'ผลไม้',
    quantity: 28,
    barcode: 'SMM40010002',
    unit: 'กก.',
    price: 180,
    minStock: 15,
    expiryDate: '2026-06-25',
    imageUri:
      'https://images.unsplash.com/photo-1599599810769-74c47e06279c?w=400&h=400&fit=crop',
  },
  {
    productName: 'กุ้งกุลาดาสด',
    category: 'อาหารทะเล',
    quantity: 8,
    barcode: 'SMM40010003',
    unit: 'กก.',
    price: 320,
    minStock: 15,
    expiryDate: '2026-06-22',
    imageUri:
      'https://images.unsplash.com/photo-1565680018434-b3d4b5b4d4bb?w=400&h=400&fit=crop',
  },
  {
    productName: 'หมูสามชั้นสด',
    category: 'เนื้อสัตว์',
    quantity: 32,
    barcode: 'SMM40010004',
    unit: 'กก.',
    price: 150,
    minStock: 20,
    expiryDate: '2026-06-23',
    imageUri:
      'https://images.unsplash.com/photo-1602474461744-2885439c247e?w=400&h=400&fit=crop',
  },
  {
    productName: 'ผักกาดขาว',
    category: 'ผักสด',
    quantity: 60,
    barcode: 'SMM40010005',
    unit: 'กก.',
    price: 25,
    minStock: 30,
    expiryDate: '2026-06-24',
    imageUri:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop',
  },
  {
    productName: 'ข้าวหอมมะลิ',
    category: 'ธัญพืช',
    quantity: 120,
    barcode: 'SMM40010006',
    unit: 'กระสอบ',
    price: 950,
    minStock: 20,
    expiryDate: null,
    imageUri:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
  },
];

export const DEMO_BARCODES = MARKET_SAMPLE_PRODUCTS.map((product) => product.barcode);
