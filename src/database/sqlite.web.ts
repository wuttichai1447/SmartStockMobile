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
import { MARKET_SAMPLE_PRODUCTS } from '../utils/sampleProducts';
import { computeInventoryStats } from '../utils/helpers';

const STORAGE_KEY = 'smart_stock_web_db_v3';

interface WebDatabase {
  products: Product[];
  transactions: Omit<Transaction, 'productName'>[];
  users: UserRecord[];
  sales: Sale[];
  nextProductId: number;
  nextTransactionId: number;
  nextUserId: number;
  nextSaleId: number;
  nextSaleItemId: number;
}

let db: WebDatabase | null = null;

const createEmptyDatabase = (): WebDatabase => ({
  products: [],
  transactions: [],
  users: [],
  sales: [],
  nextProductId: 1,
  nextTransactionId: 1,
  nextUserId: 1,
  nextSaleId: 1,
  nextSaleItemId: 1,
});

const loadDatabase = (): WebDatabase => {
  if (db) {
    return db;
  }

  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<WebDatabase>;
      db = {
        ...createEmptyDatabase(),
        ...parsed,
        users: parsed.users ?? [],
        nextUserId: parsed.nextUserId ?? 1,
        sales: parsed.sales ?? [],
        nextSaleId: parsed.nextSaleId ?? 1,
        nextSaleItemId: parsed.nextSaleItemId ?? 1,
      };
    } else {
      db = createEmptyDatabase();
    }
  } catch {
    db = createEmptyDatabase();
  }

  return db;
};

const persistDatabase = (): void => {
  if (!db) {
    return;
  }

  globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(db));
};

const withProductName = (transaction: Omit<Transaction, 'productName'>): Transaction => {
  const product = loadDatabase().products.find((item) => item.id === transaction.productId);
  return {
    ...transaction,
    productName: product?.productName,
  };
};

const seedSampleData = (database: WebDatabase): void => {
  const now = new Date().toISOString();

  for (const sample of MARKET_SAMPLE_PRODUCTS) {
    const product: Product = {
      id: database.nextProductId++,
      ...sample,
      createdAt: now,
    };
    database.products.push(product);
  }

  database.transactions.push(
    { id: database.nextTransactionId++, productId: 1, type: 'IN', quantity: 45, createdAt: now },
    { id: database.nextTransactionId++, productId: 2, type: 'IN', quantity: 28, createdAt: now },
    { id: database.nextTransactionId++, productId: 3, type: 'OUT', quantity: 5, createdAt: now },
    { id: database.nextTransactionId++, productId: 4, type: 'IN', quantity: 32, createdAt: now }
  );
};

export const initDatabase = async (): Promise<void> => {
  const database = loadDatabase();

  if (database.products.length === 0) {
    seedSampleData(database);
    persistDatabase();
  }
};

export const getAllProducts = (): Product[] => {
  return [...loadDatabase().products].sort((a, b) =>
    a.productName.localeCompare(b.productName)
  );
};

export const searchProducts = (query: string): Product[] => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return getAllProducts();
  }

  return getAllProducts().filter(
    (product) =>
      product.productName.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery) ||
      product.barcode.toLowerCase().includes(normalizedQuery)
  );
};

export const getProductById = (id: number): Product | null => {
  return loadDatabase().products.find((product) => product.id === id) ?? null;
};

export const getProductByBarcode = (barcode: string): Product | null => {
  return loadDatabase().products.find((product) => product.barcode === barcode) ?? null;
};

export const addProduct = (input: ProductInput): Product => {
  const database = loadDatabase();
  const createdAt = new Date().toISOString();

  if (database.products.some((product) => product.barcode === input.barcode)) {
    throw new Error('UNIQUE constraint failed: products.barcode');
  }

  const product: Product = {
    id: database.nextProductId++,
    ...input,
    quantity: 0,
    createdAt,
  };

  database.products.push(product);

  if (input.quantity > 0) {
    recordTransaction(product.id, 'IN', input.quantity);
  } else {
    persistDatabase();
  }

  return getProductById(product.id) ?? product;
};

export const updateProduct = (id: number, input: ProductInput): Product | null => {
  const database = loadDatabase();
  const index = database.products.findIndex((product) => product.id === id);

  if (index === -1) {
    return null;
  }

  const duplicateBarcode = database.products.some(
    (product) => product.id !== id && product.barcode === input.barcode
  );

  if (duplicateBarcode) {
    throw new Error('UNIQUE constraint failed: products.barcode');
  }

  database.products[index] = {
    ...database.products[index],
    ...input,
  };

  persistDatabase();
  return database.products[index];
};

export const deleteProduct = (id: number): void => {
  const database = loadDatabase();
  database.products = database.products.filter((product) => product.id !== id);
  database.transactions = database.transactions.filter(
    (transaction) => transaction.productId !== id
  );
  persistDatabase();
};

export const recordTransaction = (
  productId: number,
  type: TransactionType,
  quantity: number
): Transaction => {
  const database = loadDatabase();
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

  product.quantity =
    type === 'IN' ? product.quantity + quantity : product.quantity - quantity;

  const transaction = {
    id: database.nextTransactionId++,
    productId,
    type,
    quantity,
    createdAt,
  };

  database.transactions.push(transaction);
  persistDatabase();

  return withProductName(transaction);
};

export const getAllTransactions = (): Transaction[] => {
  return loadDatabase()
    .transactions.map(withProductName)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const getTransactionsByProduct = (productId: number): Transaction[] => {
  return getAllTransactions().filter((transaction) => transaction.productId === productId);
};

export const getTransactionsByDate = (date: string): Transaction[] => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return getAllTransactions().filter((transaction) => {
    const createdAt = new Date(transaction.createdAt).getTime();
    return createdAt >= start.getTime() && createdAt <= end.getTime();
  });
};

export const getDashboardStats = (): DashboardStats => {
  const database = loadDatabase();
  const inventoryStats = computeInventoryStats(database.products);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todaySalesList = database.sales.filter((sale) => {
    const createdAt = new Date(sale.createdAt).getTime();
    return createdAt >= todayStart.getTime() && createdAt <= todayEnd.getTime();
  });

  return {
    totalProducts: database.products.length,
    totalStockIn: database.transactions
      .filter((transaction) => transaction.type === 'IN')
      .reduce((total, transaction) => total + transaction.quantity, 0),
    totalStockOut: database.transactions
      .filter((transaction) => transaction.type === 'OUT')
      .reduce((total, transaction) => total + transaction.quantity, 0),
    ...inventoryStats,
    todaySalesTotal: todaySalesList.reduce((sum, sale) => sum + sale.total, 0),
    todaySalesCount: todaySalesList.length,
  };
};

export const getRecentActivities = (limit = 5): ActivityItem[] => {
  return getAllTransactions()
    .slice(0, limit)
    .map((transaction) => ({
      id: transaction.id,
      productName: transaction.productName ?? '',
      type: transaction.type,
      quantity: transaction.quantity,
      createdAt: transaction.createdAt,
    }));
};

export const recordSale = (input: RecordSaleInput): Sale => {
  const database = loadDatabase();
  const createdAt = new Date().toISOString();

  if (input.items.length === 0) {
    throw new Error('ไม่มีสินค้าในรายการขาย');
  }

  const lines = input.items.map((item) => {
    const product = database.products.find((p) => p.id === item.productId);
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

  const saleId = database.nextSaleId++;
  const items: SaleItem[] = lines.map((line) => ({
    id: database.nextSaleItemId++,
    saleId,
    productId: line.product.id,
    productName: line.product.productName,
    unit: line.product.unit,
    unitPrice: line.unitPrice,
    quantity: line.quantity,
    lineTotal: line.lineTotal,
  }));

  for (const line of lines) {
    line.product.quantity -= line.quantity;
    database.transactions.push({
      id: database.nextTransactionId++,
      productId: line.product.id,
      type: 'OUT',
      quantity: line.quantity,
      createdAt,
    });
  }

  const sale: Sale = {
    id: saleId,
    subtotal,
    discount,
    total,
    received,
    change,
    itemCount,
    soldByName: input.soldByName,
    createdAt,
    items,
  };

  database.sales.push(sale);
  persistDatabase();
  return sale;
};

export const getSaleById = (id: number): Sale | null =>
  loadDatabase().sales.find((sale) => sale.id === id) ?? null;

export const getAllSales = (): Sale[] =>
  [...loadDatabase().sales].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

export const getSalesByDate = (date: string): Sale[] => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return getAllSales().filter((sale) => {
    const createdAt = new Date(sale.createdAt).getTime();
    return createdAt >= start.getTime() && createdAt <= end.getTime();
  });
};

const toPublicUser = (record: UserRecord): User => ({
  id: record.id,
  username: record.username,
  displayName: record.displayName,
  role: record.role,
  createdAt: record.createdAt,
});

export const countUsers = (): number => loadDatabase().users.length;

export const getAllUsers = (): User[] =>
  [...loadDatabase().users]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(toPublicUser);

export const getUserByUsername = (username: string): UserRecord | null => {
  const normalized = username.trim().toLowerCase();
  return (
    loadDatabase().users.find(
      (user) => user.username.toLowerCase() === normalized
    ) ?? null
  );
};

export const getUserById = (id: number): UserRecord | null =>
  loadDatabase().users.find((user) => user.id === id) ?? null;

export const insertUser = (record: {
  username: string;
  displayName: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
}): User => {
  const database = loadDatabase();

  if (getUserByUsername(record.username)) {
    throw new Error('UNIQUE constraint failed: users.username');
  }

  const user: UserRecord = {
    id: database.nextUserId++,
    username: record.username,
    displayName: record.displayName,
    role: record.role,
    passwordHash: record.passwordHash,
    salt: record.salt,
    createdAt: new Date().toISOString(),
  };

  database.users.push(user);
  persistDatabase();
  return toPublicUser(user);
};

export const updateUserProfile = (
  id: number,
  fields: { displayName: string; role: UserRole }
): User | null => {
  const database = loadDatabase();
  const user = database.users.find((item) => item.id === id);
  if (!user) {
    return null;
  }
  user.displayName = fields.displayName;
  user.role = fields.role;
  persistDatabase();
  return toPublicUser(user);
};

export const updateUserPassword = (
  id: number,
  passwordHash: string,
  salt: string
): void => {
  const database = loadDatabase();
  const user = database.users.find((item) => item.id === id);
  if (!user) {
    return;
  }
  user.passwordHash = passwordHash;
  user.salt = salt;
  persistDatabase();
};

export const deleteUser = (id: number): void => {
  const database = loadDatabase();
  database.users = database.users.filter((user) => user.id !== id);
  persistDatabase();
};

export const countOwners = (): number =>
  loadDatabase().users.filter((user) => user.role === 'owner').length;

export interface DatabaseSnapshot {
  products: Product[];
  transactions: Omit<Transaction, 'productName'>[];
  users: UserRecord[];
  sales?: Sale[];
  saleItems?: SaleItem[];
}

export const exportDatabaseSnapshot = (): DatabaseSnapshot => {
  const database = loadDatabase();
  const sortedSales = [...database.sales].sort((a, b) => a.id - b.id);
  return {
    products: [...database.products].sort((a, b) => a.id - b.id),
    transactions: [...database.transactions].sort((a, b) => a.id - b.id),
    users: [...database.users].sort((a, b) => a.id - b.id),
    sales: sortedSales.map(({ items, ...sale }) => sale),
    saleItems: sortedSales.flatMap((sale) => sale.items ?? []),
  };
};

export const importDatabaseSnapshot = (snapshot: DatabaseSnapshot): void => {
  const database = loadDatabase();

  database.products = [...snapshot.products];
  database.transactions = [...snapshot.transactions];
  if (snapshot.users && snapshot.users.length > 0) {
    database.users = [...snapshot.users];
  }

  const saleItems = snapshot.saleItems ?? [];
  database.sales = (snapshot.sales ?? []).map((sale) => ({
    ...sale,
    items: saleItems.filter((item) => item.saleId === sale.id),
  }));

  database.nextProductId =
    database.products.reduce((max, product) => Math.max(max, product.id), 0) + 1;
  database.nextTransactionId =
    database.transactions.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  database.nextUserId =
    database.users.reduce((max, user) => Math.max(max, user.id), 0) + 1;
  database.nextSaleId =
    database.sales.reduce((max, sale) => Math.max(max, sale.id), 0) + 1;
  database.nextSaleItemId =
    saleItems.reduce((max, item) => Math.max(max, item.id), 0) + 1;

  persistDatabase();
};
