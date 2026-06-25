import {
  ActivityItem,
  DashboardStats,
  Product,
  ProductInput,
  Transaction,
  TransactionType,
} from '../models/Product';
import { MARKET_SAMPLE_PRODUCTS } from '../utils/sampleProducts';

const STORAGE_KEY = 'smart_stock_web_db_v2';

interface WebDatabase {
  products: Product[];
  transactions: Omit<Transaction, 'productName'>[];
  nextProductId: number;
  nextTransactionId: number;
}

let db: WebDatabase | null = null;

const createEmptyDatabase = (): WebDatabase => ({
  products: [],
  transactions: [],
  nextProductId: 1,
  nextTransactionId: 1,
});

const loadDatabase = (): WebDatabase => {
  if (db) {
    return db;
  }

  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    db = stored ? (JSON.parse(stored) as WebDatabase) : createEmptyDatabase();
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
    createdAt,
  };

  database.products.push(product);

  if (input.quantity > 0) {
    recordTransaction(product.id, 'IN', input.quantity);
  } else {
    persistDatabase();
  }

  return product;
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

  return {
    totalProducts: database.products.length,
    totalStockIn: database.transactions
      .filter((transaction) => transaction.type === 'IN')
      .reduce((total, transaction) => total + transaction.quantity, 0),
    totalStockOut: database.transactions
      .filter((transaction) => transaction.type === 'OUT')
      .reduce((total, transaction) => total + transaction.quantity, 0),
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
