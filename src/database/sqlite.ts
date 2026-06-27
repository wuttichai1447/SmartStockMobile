import * as SQLite from 'expo-sqlite';
import {
  ActivityItem,
  DashboardStats,
  Product,
  ProductInput,
  RecordSaleInput,
  Sale,
  SaleItem,
  Transaction,
  TransactionType,
  User,
  UserRecord,
  UserRole,
} from '../models/Product';
import { DEFAULT_MIN_STOCK } from '../utils/constants';
import { computeInventoryStats } from '../utils/helpers';
import { MARKET_SAMPLE_PRODUCTS } from '../utils/sampleProducts';

const DATABASE_NAME = 'smart_stock.db';

let db: SQLite.SQLiteDatabase | null = null;

const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    db = SQLite.openDatabaseSync(DATABASE_NAME);
  }
  return db;
};

const ensureProductColumns = (database: SQLite.SQLiteDatabase): void => {
  const columns = database.getAllSync<{ name: string }>('PRAGMA table_info(products)');
  const columnNames = columns.map((column) => column.name);

  if (!columnNames.includes('imageUri')) {
    database.execSync('ALTER TABLE products ADD COLUMN imageUri TEXT');
  }
  if (!columnNames.includes('price')) {
    database.execSync(`ALTER TABLE products ADD COLUMN price REAL NOT NULL DEFAULT 0`);
  }
  if (!columnNames.includes('minStock')) {
    database.execSync(
      `ALTER TABLE products ADD COLUMN minStock REAL NOT NULL DEFAULT ${DEFAULT_MIN_STOCK}`
    );
  }
  if (!columnNames.includes('expiryDate')) {
    database.execSync('ALTER TABLE products ADD COLUMN expiryDate TEXT');
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
      price REAL NOT NULL DEFAULT 0,
      minStock REAL NOT NULL DEFAULT 10,
      expiryDate TEXT,
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

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      displayName TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('owner', 'staff')),
      passwordHash TEXT NOT NULL,
      salt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subtotal REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      received REAL NOT NULL DEFAULT 0,
      change REAL NOT NULL DEFAULT 0,
      itemCount INTEGER NOT NULL DEFAULT 0,
      soldByName TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      saleId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      productName TEXT NOT NULL,
      unit TEXT NOT NULL,
      unitPrice REAL NOT NULL,
      quantity REAL NOT NULL,
      lineTotal REAL NOT NULL,
      FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE
    );
  `);

  ensureProductColumns(database);
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
      `INSERT INTO products (productName, category, quantity, barcode, unit, imageUri, price, minStock, expiryDate, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sample.productName,
        sample.category,
        sample.quantity,
        sample.barcode,
        sample.unit,
        sample.imageUri ?? null,
        sample.price,
        sample.minStock,
        sample.expiryDate ?? null,
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
    `INSERT INTO products (productName, category, quantity, barcode, unit, imageUri, price, minStock, expiryDate, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.productName,
      input.category,
      0,
      input.barcode,
      input.unit,
      input.imageUri ?? null,
      input.price,
      input.minStock,
      input.expiryDate ?? null,
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

  return getProductById(result.lastInsertRowId) ?? product;
};

export const updateProduct = (
  id: number,
  input: ProductInput
): Product | null => {
  const database = getDatabase();

  database.runSync(
    `UPDATE products
     SET productName = ?, category = ?, quantity = ?, barcode = ?, unit = ?, imageUri = ?,
         price = ?, minStock = ?, expiryDate = ?
     WHERE id = ?`,
    [
      input.productName,
      input.category,
      input.quantity,
      input.barcode,
      input.unit,
      input.imageUri ?? null,
      input.price,
      input.minStock,
      input.expiryDate ?? null,
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

  const products = getAllProducts();
  const inventoryStats = computeInventoryStats(products);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todaySales = database.getFirstSync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
     FROM sales WHERE createdAt >= ? AND createdAt <= ?`,
    [todayStart.toISOString(), todayEnd.toISOString()]
  );

  return {
    totalProducts: productCount?.count ?? 0,
    totalStockIn: stockIn?.total ?? 0,
    totalStockOut: stockOut?.total ?? 0,
    ...inventoryStats,
    todaySalesTotal: todaySales?.total ?? 0,
    todaySalesCount: todaySales?.count ?? 0,
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

export const recordSale = (input: RecordSaleInput): Sale => {
  const database = getDatabase();
  const createdAt = new Date().toISOString();

  if (input.items.length === 0) {
    throw new Error('ไม่มีสินค้าในรายการขาย');
  }

  const lines = input.items.map((item) => {
    const product = getProductById(item.productId);
    if (!product) {
      throw new Error('ไม่พบสินค้าบางรายการ');
    }
    if (item.quantity <= 0) {
      throw new Error('จำนวนสินค้าต้องมากกว่า 0');
    }
    if (product.quantity < item.quantity) {
      throw new Error(`สต็อก "${product.productName}" ไม่เพียงพอ`);
    }
    return {
      product,
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal: product.price * item.quantity,
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const discount = Math.max(0, input.discount);
  const total = Math.max(0, subtotal - discount);
  const received = input.received > 0 ? input.received : total;
  const change = Math.max(0, received - total);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  database.execSync('BEGIN TRANSACTION;');
  try {
    const saleResult = database.runSync(
      `INSERT INTO sales (subtotal, discount, total, received, change, itemCount, soldByName, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [subtotal, discount, total, received, change, itemCount, input.soldByName, createdAt]
    );
    const saleId = saleResult.lastInsertRowId;

    for (const line of lines) {
      database.runSync(
        `INSERT INTO sale_items (saleId, productId, productName, unit, unitPrice, quantity, lineTotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          line.product.id,
          line.product.productName,
          line.product.unit,
          line.unitPrice,
          line.quantity,
          line.lineTotal,
        ]
      );

      database.runSync('UPDATE products SET quantity = quantity - ? WHERE id = ?', [
        line.quantity,
        line.product.id,
      ]);

      database.runSync(
        `INSERT INTO transactions (productId, type, quantity, createdAt)
         VALUES (?, 'OUT', ?, ?)`,
        [line.product.id, line.quantity, createdAt]
      );
    }

    database.execSync('COMMIT;');

    const sale = getSaleById(saleId);
    if (!sale) {
      throw new Error('บันทึกการขายไม่สำเร็จ');
    }
    return sale;
  } catch (error) {
    database.execSync('ROLLBACK;');
    throw error;
  }
};

export const getSaleById = (id: number): Sale | null => {
  const database = getDatabase();
  const sale = database.getFirstSync<Sale>('SELECT * FROM sales WHERE id = ?', [id]);
  if (!sale) {
    return null;
  }
  const items = database.getAllSync<SaleItem>(
    'SELECT * FROM sale_items WHERE saleId = ? ORDER BY id ASC',
    [id]
  );
  return { ...sale, items };
};

export const getAllSales = (): Sale[] => {
  const database = getDatabase();
  return database.getAllSync<Sale>('SELECT * FROM sales ORDER BY createdAt DESC');
};

export const getSalesByDate = (date: string): Sale[] => {
  const database = getDatabase();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return database.getAllSync<Sale>(
    `SELECT * FROM sales WHERE createdAt >= ? AND createdAt <= ? ORDER BY createdAt DESC`,
    [start.toISOString(), end.toISOString()]
  );
};

const toPublicUser = (record: UserRecord): User => ({
  id: record.id,
  username: record.username,
  displayName: record.displayName,
  role: record.role,
  createdAt: record.createdAt,
});

export const countUsers = (): number => {
  const database = getDatabase();
  const row = database.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM users'
  );
  return row?.count ?? 0;
};

export const getAllUsers = (): User[] => {
  const database = getDatabase();
  return database
    .getAllSync<UserRecord>('SELECT * FROM users ORDER BY createdAt ASC')
    .map(toPublicUser);
};

export const getUserByUsername = (username: string): UserRecord | null => {
  const database = getDatabase();
  return (
    database.getFirstSync<UserRecord>(
      'SELECT * FROM users WHERE username = ? COLLATE NOCASE',
      [username]
    ) ?? null
  );
};

export const getUserById = (id: number): UserRecord | null => {
  const database = getDatabase();
  return (
    database.getFirstSync<UserRecord>('SELECT * FROM users WHERE id = ?', [id]) ??
    null
  );
};

export const insertUser = (record: {
  username: string;
  displayName: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
}): User => {
  const database = getDatabase();
  const createdAt = new Date().toISOString();

  const result = database.runSync(
    `INSERT INTO users (username, displayName, role, passwordHash, salt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      record.username,
      record.displayName,
      record.role,
      record.passwordHash,
      record.salt,
      createdAt,
    ]
  );

  const created = getUserById(result.lastInsertRowId);
  if (!created) {
    throw new Error('Failed to create user');
  }
  return toPublicUser(created);
};

export const updateUserProfile = (
  id: number,
  fields: { displayName: string; role: UserRole }
): User | null => {
  const database = getDatabase();
  database.runSync('UPDATE users SET displayName = ?, role = ? WHERE id = ?', [
    fields.displayName,
    fields.role,
    id,
  ]);
  const updated = getUserById(id);
  return updated ? toPublicUser(updated) : null;
};

export const updateUserPassword = (
  id: number,
  passwordHash: string,
  salt: string
): void => {
  const database = getDatabase();
  database.runSync('UPDATE users SET passwordHash = ?, salt = ? WHERE id = ?', [
    passwordHash,
    salt,
    id,
  ]);
};

export const deleteUser = (id: number): void => {
  const database = getDatabase();
  database.runSync('DELETE FROM users WHERE id = ?', [id]);
};

export const countOwners = (): number => {
  const database = getDatabase();
  const row = database.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM users WHERE role = 'owner'"
  );
  return row?.count ?? 0;
};

export interface DatabaseSnapshot {
  products: Product[];
  transactions: Omit<Transaction, 'productName'>[];
  users: UserRecord[];
  sales?: Sale[];
  saleItems?: SaleItem[];
}

export const exportDatabaseSnapshot = (): DatabaseSnapshot => {
  const database = getDatabase();
  return {
    products: database.getAllSync<Product>('SELECT * FROM products ORDER BY id ASC'),
    transactions: database.getAllSync<Omit<Transaction, 'productName'>>(
      'SELECT id, productId, type, quantity, createdAt FROM transactions ORDER BY id ASC'
    ),
    users: database.getAllSync<UserRecord>('SELECT * FROM users ORDER BY id ASC'),
    sales: database.getAllSync<Sale>('SELECT * FROM sales ORDER BY id ASC'),
    saleItems: database.getAllSync<SaleItem>(
      'SELECT * FROM sale_items ORDER BY id ASC'
    ),
  };
};

export const importDatabaseSnapshot = (snapshot: DatabaseSnapshot): void => {
  const database = getDatabase();

  database.execSync('BEGIN TRANSACTION;');
  try {
    database.execSync('DELETE FROM sale_items;');
    database.execSync('DELETE FROM sales;');
    database.execSync('DELETE FROM transactions;');
    database.execSync('DELETE FROM products;');

    for (const product of snapshot.products) {
      database.runSync(
        `INSERT INTO products (id, productName, category, quantity, barcode, unit, imageUri, price, minStock, expiryDate, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          product.productName,
          product.category,
          product.quantity,
          product.barcode,
          product.unit,
          product.imageUri ?? null,
          product.price ?? 0,
          product.minStock ?? DEFAULT_MIN_STOCK,
          product.expiryDate ?? null,
          product.createdAt,
        ]
      );
    }

    for (const transaction of snapshot.transactions) {
      database.runSync(
        `INSERT INTO transactions (id, productId, type, quantity, createdAt)
         VALUES (?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.productId,
          transaction.type,
          transaction.quantity,
          transaction.createdAt,
        ]
      );
    }

    for (const sale of snapshot.sales ?? []) {
      database.runSync(
        `INSERT INTO sales (id, subtotal, discount, total, received, change, itemCount, soldByName, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sale.id,
          sale.subtotal,
          sale.discount,
          sale.total,
          sale.received,
          sale.change,
          sale.itemCount,
          sale.soldByName,
          sale.createdAt,
        ]
      );
    }

    for (const item of snapshot.saleItems ?? []) {
      database.runSync(
        `INSERT INTO sale_items (id, saleId, productId, productName, unit, unitPrice, quantity, lineTotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.saleId,
          item.productId,
          item.productName,
          item.unit,
          item.unitPrice,
          item.quantity,
          item.lineTotal,
        ]
      );
    }

    if (snapshot.users && snapshot.users.length > 0) {
      database.execSync('DELETE FROM users;');
      for (const user of snapshot.users) {
        database.runSync(
          `INSERT INTO users (id, username, displayName, role, passwordHash, salt, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            user.username,
            user.displayName,
            user.role,
            user.passwordHash,
            user.salt,
            user.createdAt,
          ]
        );
      }
    }

    database.execSync('COMMIT;');
  } catch (error) {
    database.execSync('ROLLBACK;');
    throw error;
  }
};
