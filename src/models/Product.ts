export interface Product {
  id: number;
  productName: string;
  category: string;
  quantity: number;
  barcode: string;
  unit: string;
  imageUri?: string | null;
  createdAt: string;
}

export interface ProductInput {
  productName: string;
  category: string;
  quantity: number;
  barcode: string;
  unit: string;
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
}

export interface ActivityItem {
  id: number;
  productName: string;
  type: TransactionType;
  quantity: number;
  createdAt: string;
}
