export const COLORS = {
  primary: '#2E7D32',
  primaryDark: '#1B5E20',
  primaryLight: '#66BB6A',
  secondary: '#00897B',
  secondaryDark: '#00695C',
  accent: '#FF6F00',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#1B5E20',
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
  expiry: '#E65100',
};

export const DEFAULT_OWNER = {
  username: 'admin',
  password: 'admin123',
  displayName: 'เจ้าของร้าน',
};

export const ROLE_LABELS: Record<'owner' | 'staff', string> = {
  owner: 'เจ้าของร้าน',
  staff: 'พนักงาน',
};

export const DEFAULT_MIN_STOCK = 10;

export const EXPIRY_WARNING_DAYS = 3;

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

export const LABELS = {
  appName: 'Smart Stock',
  marketName: 'ตลาด',
  login: 'เข้าสู่ระบบ',
  logout: 'ออกจากระบบ',
  dashboard: 'ภาพรวม',
  products: 'สินค้า',
  scanner: 'สแกน',
  history: 'ประวัติ',
  pos: 'ขายสินค้า',
  sell: 'ขาย',
  salesHistory: 'ประวัติการขาย',
  stockIn: 'รับเข้า',
  stockOut: 'จ่ายออก',
  addProduct: 'เพิ่มสินค้า',
  editProduct: 'แก้ไขสินค้า',
  save: 'บันทึก',
  delete: 'ลบ',
  cancel: 'ยกเลิก',
  search: 'ค้นหาสินค้า...',
  exportCsv: 'ส่งออก CSV',
  printBarcode: 'พิมพ์บาร์โค้ด',
  previewBarcode: 'ดูบาร์โค้ด',
  settings: 'ตั้งค่า',
  account: 'บัญชีผู้ใช้',
  changePassword: 'เปลี่ยนรหัสผ่าน',
  userManagement: 'จัดการผู้ใช้',
  backup: 'สำรอง/กู้คืนข้อมูล',
  cloudSync: 'ซิงค์ข้อมูลคลาวด์',
};
