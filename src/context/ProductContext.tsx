import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  ActivityItem,
  DashboardStats,
  Product,
  ProductInput,
  Transaction,
  TransactionType,
} from '../models/Product';
import { DEMO_CREDENTIALS } from '../utils/constants';
import {
  addProduct as dbAddProduct,
  deleteProduct as dbDeleteProduct,
  getAllProducts,
  getAllTransactions,
  getDashboardStats,
  getProductByBarcode,
  getProductById,
  getRecentActivities,
  getTransactionsByDate,
  getTransactionsByProduct,
  initDatabase,
  recordTransaction as dbRecordTransaction,
  searchProducts,
  updateProduct as dbUpdateProduct,
} from '../database/sqlite';

interface ProductContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  products: Product[];
  transactions: Transaction[];
  dashboardStats: DashboardStats;
  recentActivities: ActivityItem[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
  loadProducts: (searchQuery?: string) => Promise<void>;
  getProduct: (id: number) => Product | null;
  findByBarcode: (barcode: string) => Product | null;
  addProduct: (input: ProductInput) => Promise<Product>;
  updateProduct: (id: number, input: ProductInput) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
  recordStockMovement: (
    productId: number,
    type: TransactionType,
    quantity: number
  ) => Promise<void>;
  filterTransactions: (filters: {
    productId?: number | null;
    date?: string | null;
  }) => Promise<Transaction[]>;
  clearError: () => void;
}

const ProductContext = createContext<ProductContextValue | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalStockIn: 0,
    totalStockOut: 0,
  });
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  const refreshData = useCallback(async () => {
    try {
      setProducts(getAllProducts());
      setTransactions(getAllTransactions());
      setDashboardStats(getDashboardStats());
      setRecentActivities(getRecentActivities());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load application data';
      setError(message);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        await initDatabase();
        setIsInitialized(true);
        await refreshData();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to initialize database';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [refreshData]);

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      const isValid =
        username.trim() === DEMO_CREDENTIALS.username &&
        password === DEMO_CREDENTIALS.password;

      if (isValid) {
        setIsAuthenticated(true);
        setError(null);
        await refreshData();
        return true;
      }

      setError('Invalid username or password');
      return false;
    },
    [refreshData]
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const loadProducts = useCallback(async (searchQuery?: string) => {
    try {
      if (searchQuery && searchQuery.trim()) {
        setProducts(searchProducts(searchQuery));
      } else {
        setProducts(getAllProducts());
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load products';
      setError(message);
    }
  }, []);

  const getProduct = useCallback((id: number): Product | null => {
    return getProductById(id);
  }, []);

  const findByBarcode = useCallback((barcode: string): Product | null => {
    return getProductByBarcode(barcode);
  }, []);

  const addProduct = useCallback(
    async (input: ProductInput): Promise<Product> => {
      try {
        const product = dbAddProduct(input);
        await refreshData();
        return product;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to add product';
        setError(message);
        throw err;
      }
    },
    [refreshData]
  );

  const updateProduct = useCallback(
    async (id: number, input: ProductInput): Promise<Product> => {
      try {
        const product = dbUpdateProduct(id, input);
        if (!product) {
          throw new Error('Product not found');
        }
        await refreshData();
        return product;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update product';
        setError(message);
        throw err;
      }
    },
    [refreshData]
  );

  const deleteProduct = useCallback(
    async (id: number): Promise<void> => {
      try {
        dbDeleteProduct(id);
        await refreshData();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete product';
        setError(message);
        throw err;
      }
    },
    [refreshData]
  );

  const recordStockMovement = useCallback(
    async (
      productId: number,
      type: TransactionType,
      quantity: number
    ): Promise<void> => {
      try {
        dbRecordTransaction(productId, type, quantity);
        await refreshData();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to record stock movement';
        setError(message);
        throw err;
      }
    },
    [refreshData]
  );

  const filterTransactions = useCallback(
    async (filters: {
      productId?: number | null;
      date?: string | null;
    }): Promise<Transaction[]> => {
      try {
        let result: Transaction[];

        if (filters.productId && filters.date) {
          const byProduct = getTransactionsByProduct(filters.productId);
          result = byProduct.filter((transaction) => {
            const transactionDate = transaction.createdAt.split('T')[0];
            return transactionDate === filters.date;
          });
        } else if (filters.productId) {
          result = getTransactionsByProduct(filters.productId);
        } else if (filters.date) {
          result = getTransactionsByDate(filters.date);
        } else {
          result = getAllTransactions();
        }

        setTransactions(result);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to filter transactions';
        setError(message);
        return [];
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      isInitialized,
      error,
      products,
      transactions,
      dashboardStats,
      recentActivities,
      login,
      logout,
      refreshData,
      loadProducts,
      getProduct,
      findByBarcode,
      addProduct,
      updateProduct,
      deleteProduct,
      recordStockMovement,
      filterTransactions,
      clearError,
    }),
    [
      isAuthenticated,
      isLoading,
      isInitialized,
      error,
      products,
      transactions,
      dashboardStats,
      recentActivities,
      login,
      logout,
      refreshData,
      loadProducts,
      getProduct,
      findByBarcode,
      addProduct,
      updateProduct,
      deleteProduct,
      recordStockMovement,
      filterTransactions,
      clearError,
    ]
  );

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
};

export const useProducts = (): ProductContextValue => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
