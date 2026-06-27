import { DEFAULT_MIN_STOCK, EXPIRY_WARNING_DAYS } from './constants';
import { Product } from '../models/Product';

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatCurrency = (amount: number): string => {
  return `฿${amount.toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export const formatPriceWithUnit = (price: number, unit: string): string => {
  return `${formatCurrency(price)}/${unit}`;
};

export const getTodayISO = (): string => new Date().toISOString();

export const getTodayDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export const toISODateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const daysUntilExpiry = (expiryDate?: string | null): number | null => {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const isLowStock = (product: Pick<Product, 'quantity' | 'minStock'>): boolean => {
  const threshold = product.minStock ?? DEFAULT_MIN_STOCK;
  return product.quantity <= threshold;
};

export const isExpiringSoon = (product: Pick<Product, 'expiryDate'>): boolean => {
  const days = daysUntilExpiry(product.expiryDate);
  return days !== null && days >= 0 && days <= EXPIRY_WARNING_DAYS;
};

export const isExpired = (product: Pick<Product, 'expiryDate'>): boolean => {
  const days = daysUntilExpiry(product.expiryDate);
  return days !== null && days < 0;
};

export const getExpiryLabel = (expiryDate?: string | null): string | null => {
  const days = daysUntilExpiry(expiryDate);
  if (days === null) return null;
  if (days < 0) return 'หมดอายุแล้ว';
  if (days === 0) return 'หมดอายุวันนี้';
  if (days <= EXPIRY_WARNING_DAYS) return `เหลือ ${days} วัน`;
  return `หมดอายุ ${formatDateShort(expiryDate!)}`;
};

export const validateLogin = (
  username: string,
  password: string
): { valid: boolean; error?: string } => {
  if (!username.trim()) {
    return { valid: false, error: 'กรุณากรอกชื่อผู้ใช้' };
  }
  if (!password.trim()) {
    return { valid: false, error: 'กรุณากรอกรหัสผ่าน' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' };
  }
  return { valid: true };
};

export const validateProduct = (data: {
  productName: string;
  category: string;
  quantity: string;
  barcode: string;
  unit: string;
  price: string;
  minStock: string;
  expiryDate?: string;
}): { valid: boolean; error?: string } => {
  if (!data.productName.trim()) {
    return { valid: false, error: 'กรุณากรอกชื่อสินค้า' };
  }
  if (!data.category.trim()) {
    return { valid: false, error: 'กรุณาเลือกหมวดหมู่' };
  }
  if (!data.barcode.trim()) {
    return { valid: false, error: 'กรุณากรอกบาร์โค้ด' };
  }
  if (!data.unit.trim()) {
    return { valid: false, error: 'กรุณาเลือกหน่วย' };
  }

  const quantity = Number(data.quantity);
  if (Number.isNaN(quantity) || quantity < 0) {
    return { valid: false, error: 'จำนวนต้องเป็นตัวเลขที่ไม่ติดลบ' };
  }

  const price = Number(data.price);
  if (Number.isNaN(price) || price < 0) {
    return { valid: false, error: 'ราคาต้องเป็นตัวเลขที่ไม่ติดลบ' };
  }

  const minStock = Number(data.minStock);
  if (Number.isNaN(minStock) || minStock < 0) {
    return { valid: false, error: 'สต็อกขั้นต่ำต้องเป็นตัวเลขที่ไม่ติดลบ' };
  }

  if (data.expiryDate?.trim()) {
    const expiry = new Date(data.expiryDate);
    if (Number.isNaN(expiry.getTime())) {
      return { valid: false, error: 'รูปแบบวันหมดอายุไม่ถูกต้อง (YYYY-MM-DD)' };
    }
  }

  return { valid: true };
};

export const generateBarcode = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `SMM${timestamp}${random}`;
};

export const computeInventoryStats = (
  products: Pick<Product, 'quantity' | 'price' | 'minStock' | 'expiryDate'>[]
): { lowStockCount: number; expiringSoonCount: number; inventoryValue: number } => ({
  lowStockCount: products.filter(isLowStock).length,
  expiringSoonCount: products.filter(isExpiringSoon).length,
  inventoryValue: products.reduce(
    (total, product) => total + product.quantity * (product.price ?? 0),
    0
  ),
});

export const isSameDay = (dateA: string, dateB: string): boolean => {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};
