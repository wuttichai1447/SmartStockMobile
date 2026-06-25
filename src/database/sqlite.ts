import * as SQLite from 'expo-sqlite';
import {
  ActivityItem,
  DashboardStats,
  Product,
  ProductInput,
  Transaction,
  TransactionType,
} from '../models/Product';
import { MARKET_SAMPLE_PRODUCTS } from '../utils/sampleProducts';

const DATABASE_NAME = 'smart_stock.db';

let db: SQLite.SQLiteDatabase | null = null;

const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    db = SQLite.openDatabaseSync(DATABASE_NAME);
  }
  return db;
};

const ensureImageUriColumn = (database: SQLite.SQLiteDatabase): void => {
  const columns = database.getAllSync<{ name: string }>('PRAGMA table_info(products)');
  if (!columns.some((column) => column.name === 'imageUri')) {
    database.execSync('ALTER TABLE products ADD COLUMN imageUri TEXT');
  }
};

const resetLegacyDemoData = (database: SQLite.SQLiteDatabase): void => {
  const legacy = database.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM products WHERE barcode LIKE 'SSM100100%'`
  );

  if (legacy && legacy.count > 0) {
    database.execSync('DELETE FROM transactions');
    database.execSync('DELETE FROM products');
  }
};

export const initDatabase = async (): Promise<void> => {
  const database = getDatabase();

  database.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productName TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      barcode TEXT NOT NULL UNIQUE,
      unit TEXT NOT NULL,
      imageUri TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('IN', 'OUT')),
      quantity REAL NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  ensureImageUriColumn(database);
  resetLegacyDemoData(database);

  const count = database.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM products'
  );

  if (count && count.count === 0) {
    seedSampleData(database);
  }
};

const seedSampleData = (database: SQLite.SQLiteDatabase): void => {
  const now = new Date().toISOString();

  for (const sample of MARKET_SAMPLE_PRODUCTS) {
    database.runSync(
      `INSERT INTO products (productName, category, quantity, barcode, unit, imageUri, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sample.productName,
        sample.category,
        sample.quantity,
        sample.barcode,
        sample.unit,
        sample.imageUri ?? null,
        now,
      ]
    );
  }

  database.runSync(
    `INSERT INTO transactions (productId, type, quantity, createdAt) VALUES (1, 'IN', 45, ?)`,
    [now]
  );
  database.runSync(
    `INSERT INTO transactions (productId, type, quantity, createdAt) VALUES (2, 'IN', 28, ?)`,
    [now]
  );
  database.runSync(
    `INSERT INTO transactions (productId, type, quantity, createdAt) VALUES (3, 'OUT', 5, ?)`,
    [now]
  );
  database.runSync(
    `INSERT INTO transactions (productId, type, quantity, createdAt) VALUES (4, 'IN', 32, ?)`,
    [now]
  );
};

export const getAllProducts = (): Product[] => {
  const database = getDatabase();
  return database.getAllSync<Product>(
    'SELECT * FROM products ORDER BY productName ASC'
  );
};

export const searchProducts = (query: string): Product[] => {
  const database = getDatabase();
  const searchTerm = `%${query.trim()}%`;
  return database.getAllSync<Product>(
    `SELECT * FROM products
     WHERE productName LIKE ? OR category LIKE ? OR barcode LIKE ?
     ORDER BY productName ASC`,
    [searchTerm, searchTerm, searchTerm]
  );
};

export const getProductById = (id: number): Product | null => {
  const database = getDatabase();
  return (
    database.getFirstSync<Product>('SELECT * FROM products WHERE id = ?', [id]) ??
    null
  );
};

export const getProductByBarcode = (barcode: string): Product | null => {
  const database = getDatabase();
  return (
    database.getFirstSync<Product>('SELECT * FROM products WHERE barcode = ?', [
      barcode,
    ]) ?? null
  );
};

export const addProduct = (input: ProductInput): Product => {
  const database = getDatabase();
  const createdAt = new Date().toISOString();

  const result = database.runSync(
    `INSERT INTO products (productName, category, quantity, barcode, unit, imageUri, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.productName,
      input.category,
      input.quantity,
      input.barcode,
      input.unit,
      input.imageUri ?? null,
      createdAt,
    ]
  );

  const product = getProductById(result.lastInsertRowId);
  if (!product) {
    throw new Error('Failed to create product');
  }

  if (input.quantity > 0) {
    recordTransaction(product.id, 'IN', input.quantity);
  }

  return product;
};

export const updateProduct = (
  id: number,
  input: ProductInput
): Product | null => {
  const database = getDatabase();

  database.runSync(
    `UPDATE products
     SET productName = ?, category = ?, quantity = ?, barcode = ?, unit = ?, imageUri = ?
     WHERE id = ?`,
    [
      input.productName,
      input.category,
      input.quantity,
      input.barcode,
      input.unit,
      input.imageUri ?? null,
      id,
    ]
  );

  return getProductById(id);
};

export const deleteProduct = (id: number): void => {
  const database = getDatabase();
  database.runSync('DELETE FROM transactions WHERE productId = ?', [id]);
  database.runSync('DELETE FROM products WHERE id = ?', [id]);
};

export const recordTransaction = (
  productId: number,
  type: TransactionType,
  quantity: number
): Transaction => {
  const database = getDatabase();
  const createdAt = new Date().toISOString();

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }

  const product = getProductById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  if (type === 'OUT' && product.quantity < quantity) {
    throw new Error('Insufficient stock for this operation');
  }

  const newQuantity =
    type === 'IN' ? product.quantity + quantity : product.quantity - quantity;

  database.runSync('UPDATE products SET quantity = ? WHERE id = ?', [
    newQuantity,
    productId,
  ]);

  const result = database.runSync(
    `INSERT INTO transactions (productId, type, quantity, createdAt)
     VALUES (?, ?, ?, ?)`,
    [productId, type, quantity, createdAt]
  );

  const transaction = database.getFirstSync<Transaction>(
    'SELECT * FROM transactions WHERE id = ?',
    [result.lastInsertRowId]
  );

  if (!transaction) {
    throw new Error('Failed to record transaction');
  }

  return transaction;
};

export const getAllTransactions = (): Transaction[] => {
  const database = getDatabase();
  return database.getAllSync<Transaction>(
    `SELECT t.*, p.productName
     FROM transactions t
     INNER JOIN products p ON p.id = t.productId
     ORDER BY t.createdAt DESC`
  );
};

export const getTransactionsByProduct = (productId: number): Transaction[] => {
  const database = getDatabase();
  return database.getAllSync<Transaction>(
    `SELECT t.*, p.productName
     FROM transactions t
     INNER JOIN products p ON p.id = t.productId
     WHERE t.productId = ?
     ORDER BY t.createdAt DESC`,
    [productId]
  );
};

export const getTransactionsByDate = (date: string): Transaction[] => {
  const database = getDatabase();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return database.getAllSync<Transaction>(
    `SELECT t.*, p.productName
     FROM transactions t
     INNER JOIN products p ON p.id = t.productId
     WHERE t.createdAt >= ? AND t.createdAt <= ?
     ORDER BY t.createdAt DESC`,
    [start.toISOString(), end.toISOString()]
  );
};

export const getDashboardStats = (): DashboardStats => {
  const database = getDatabase();

  const productCount = database.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM products'
  );

  const stockIn = database.getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(quantity), 0) as total FROM transactions WHERE type = 'IN'"
  );

  const stockOut = database.getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(quantity), 0) as total FROM transactions WHERE type = 'OUT'"
  );

  return {
    totalProducts: productCount?.count ?? 0,
    totalStockIn: stockIn?.total ?? 0,
    totalStockOut: stockOut?.total ?? 0,
  };
};

export const getRecentActivities = (limit = 5): ActivityItem[] => {
  const database = getDatabase();
  return database.getAllSync<ActivityItem>(
    `SELECT t.id, p.productName, t.type, t.quantity, t.createdAt
     FROM transactions t
     INNER JOIN products p ON p.id = t.productId
     ORDER BY t.createdAt DESC
     LIMIT ?`,
    [limit]
  );
};
