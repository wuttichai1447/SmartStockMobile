export const COLORS = {
  primary: '#1565C0',
  primaryDark: '#0D47A1',
  primaryLight: '#42A5F5',
  secondary: '#00897B',
  secondaryDark: '#00695C',
  accent: '#FF6F00',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#1A237E',
  textSecondary: '#546E7A',
  textLight: '#FFFFFF',
  border: '#E0E0E0',
  error: '#D32F2F',
  success: '#2E7D32',
  warning: '#F57C00',
  cardShadow: '#000000',
  stockIn: '#2E7D32',
  stockOut: '#C62828',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const DEMO_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

export const PRODUCT_CATEGORIES = [
  'ผลไม้',
  'ผักสด',
  'เนื้อสัตว์',
  'อาหารทะเล',
  'ธัญพืช',
  'ของแห้ง',
  'เครื่องปรุง',
];

export const PRODUCT_UNITS = [
  'กก.',
  'ขีด',
  'ลัง',
  'กระสอบ',
  'มัด',
  'ชิ้น',
  'ถุง',
];

export const TRANSACTION_TYPES = {
  IN: 'IN' as const,
  OUT: 'OUT' as const,
};
