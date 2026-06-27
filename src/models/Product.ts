export interface Product {
  id: number;
  productName: string;
  category: string;
  quantity: number;
  barcode: string;
  unit: string;
  price: number;
  minStock: number;
  expiryDate?: string | null;
  imageUri?: string | null;
  createdAt: string;
}

export interface ProductInput {
  productName: string;
  category: string;
  quantity: number;
  barcode: string;
  unit: string;
  price: number;
  minStock: number;
  expiryDate?: string | null;
  imageUri?: string | null;
}

export type TransactionType = 'IN' | 'OUT';

export interface Transaction {
  id: number;
  productId: number;
  type: TransactionType;
  quantity: number;
  createdAt: string;
  productName?: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalStockIn: number;
  totalStockOut: number;
  lowStockCount: number;
  expiringSoonCount: number;
  inventoryValue: number;
  todaySalesTotal: number;
  todaySalesCount: number;
}

export interface ActivityItem {
  id: number;
  productName: string;
  type: TransactionType;
  quantity: number;
  createdAt: string;
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  productName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Sale {
  id: number;
  subtotal: number;
  discount: number;
  total: number;
  received: number;
  change: number;
  itemCount: number;
  soldByName: string;
  createdAt: string;
  items?: SaleItem[];
}

/** สินค้าหนึ่งรายการในตะกร้า (เก็บใน state ของหน้า POS) */
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface RecordSaleInput {
  items: { productId: number; quantity: number }[];
  discount: number;
  received: number;
  soldByName: string;
}

export type UserRole = 'owner' | 'staff';

export interface User {
  id: number;
  username: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface UserRecord extends User {
  passwordHash: string;
  salt: string;
}

export interface CreateUserInput {
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
}
