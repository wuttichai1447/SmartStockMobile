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
  CreateUserInput,
  DashboardStats,
  Product,
  ProductInput,
  RecordSaleInput,
  Sale,
  Transaction,
  TransactionType,
  User,
  UserRole,
} from '../models/Product';
import { isExpiringSoon, isLowStock } from '../utils/helpers';
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
  recordSale as dbRecordSale,
  getAllSales,
  getSalesByDate as dbGetSalesByDate,
  searchProducts,
  updateProduct as dbUpdateProduct,
} from '../database/sqlite';
import {
  authenticate,
  changePassword as authChangePassword,
  createUser as authCreateUser,
  ensureDefaultUser,
  listUsers,
  removeUser as authRemoveUser,
  resetPassword as authResetPassword,
  updateUser as authUpdateUser,
} from '../services/auth';

interface ProductContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  currentUser: User | null;
  isOwner: boolean;
  users: User[];
  products: Product[];
  transactions: Transaction[];
  dashboardStats: DashboardStats;
  recentActivities: ActivityItem[];
  lowStockProducts: Product[];
  expiringProducts: Product[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUsers: () => void;
  createUser: (input: CreateUserInput) => Promise<void>;
  updateUserAccount: (
    id: number,
    fields: { displayName: string; role: UserRole }
  ) => Promise<void>;
  removeUserAccount: (id: number) => Promise<void>;
  resetUserPassword: (id: number, newPassword: string) => Promise<void>;
  changeOwnPassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
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
  recordSale: (input: RecordSaleInput) => Promise<Sale>;
  getSales: (date?: string | null) => Sale[];
  filterTransactions: (filters: {
    productId?: number | null;
    date?: string | null;
  }) => Promise<Transaction[]>;
  clearError: () => void;
}

const ProductContext = createContext<ProductContextValue | undefined>(undefined);

const EMPTY_STATS: DashboardStats = {
  totalProducts: 0,
  totalStockIn: 0,
  totalStockOut: 0,
  lowStockCount: 0,
  expiringSoonCount: 0,
  inventoryValue: 0,
  todaySalesTotal: 0,
  todaySalesCount: 0,
};

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(EMPTY_STATS);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  const lowStockProducts = useMemo(
    () => products.filter(isLowStock),
    [products]
  );

  const expiringProducts = useMemo(
    () => products.filter(isExpiringSoon),
    [products]
  );

  const isAuthenticated = currentUser !== null;
  const isOwner = currentUser?.role === 'owner';

  const refreshUsers = useCallback(() => {
    try {
      setUsers(listUsers());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'โหลดรายชื่อผู้ใช้ไม่สำเร็จ';
      setError(message);
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setProducts(getAllProducts());
      setTransactions(getAllTransactions());
      setDashboardStats(getDashboardStats());
      setRecentActivities(getRecentActivities());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ';
      setError(message);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        await initDatabase();
        await ensureDefaultUser();
        setIsInitialized(true);
        await refreshData();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'เริ่มต้นฐานข้อมูลไม่สำเร็จ';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [refreshData]);

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      try {
        const user = await authenticate(username, password);
        if (user) {
          setCurrentUser(user);
          setError(null);
          refreshUsers();
          await refreshData();
          return true;
        }

        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        return false;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ';
        setError(message);
        return false;
      }
    },
    [refreshData, refreshUsers]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    setError(null);
  }, []);

  const createUser = useCallback(
    async (input: CreateUserInput): Promise<void> => {
      try {
        await authCreateUser(input);
        refreshUsers();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'เพิ่มผู้ใช้ไม่สำเร็จ';
        setError(message);
        throw err;
      }
    },
    [refreshUsers]
  );

  const updateUserAccount = useCallback(
    async (
      id: number,
      fields: { displayName: string; role: UserRole }
    ): Promise<void> => {
      try {
        const updated = authUpdateUser(id, fields);
        if (currentUser?.id === id) {
          setCurrentUser(updated);
        }
        refreshUsers();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'แก้ไขผู้ใช้ไม่สำเร็จ';
        setError(message);
        throw err;
      }
    },
    [currentUser, refreshUsers]
  );

  const removeUserAccount = useCallback(
    async (id: number): Promise<void> => {
      try {
        authRemoveUser(id, currentUser?.id ?? -1);
        refreshUsers();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'ลบผู้ใช้ไม่สำเร็จ';
        setError(message);
        throw err;
      }
    },
    [currentUser, refreshUsers]
  );

  const resetUserPassword = useCallback(
    async (id: number, newPassword: string): Promise<void> => {
      try {
        await authResetPassword(id, newPassword);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'รีเซ็ตรหัสผ่านไม่สำเร็จ';
        setError(message);
        throw err;
      }
    },
    []
  );

  const changeOwnPassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<void> => {
      if (!currentUser) {
        throw new Error('ยังไม่ได้เข้าสู่ระบบ');
      }
      try {
        await authChangePassword(currentUser.id, currentPassword, newPassword);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ';
        setError(message);
        throw err;
      }
    },
    [currentUser]
  );

  const loadProducts = useCallback(async (searchQuery?: string) => {
    try {
      if (searchQuery && searchQuery.trim()) {
        setProducts(searchProducts(searchQuery));
      } else {
        setProducts(getAllProducts());
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'โหลดรายการสินค้าไม่สำเร็จ';
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
          err instanceof Error ? err.message : 'เพิ่มสินค้าไม่สำเร็จ';
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
          throw new Error('ไม่พบสินค้า');
        }
        await refreshData();
        return product;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'แก้ไขสินค้าไม่สำเร็จ';
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
          err instanceof Error ? err.message : 'ลบสินค้าไม่สำเร็จ';
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
          err instanceof Error ? err.message : 'บันทึกการเคลื่อนไหวสต็อกไม่สำเร็จ';
        setError(message);
        throw err;
      }
    },
    [refreshData]
  );

  const recordSale = useCallback(
    async (input: RecordSaleInput): Promise<Sale> => {
      try {
        const sale = dbRecordSale(input);
        await refreshData();
        return sale;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'บันทึกการขายไม่สำเร็จ';
        setError(message);
        throw err;
      }
    },
    [refreshData]
  );

  const getSales = useCallback((date?: string | null): Sale[] => {
    try {
      return date ? dbGetSalesByDate(date) : getAllSales();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'โหลดประวัติการขายไม่สำเร็จ';
      setError(message);
      return [];
    }
  }, []);

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
          err instanceof Error ? err.message : 'กรองประวัติไม่สำเร็จ';
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
      currentUser,
      isOwner,
      users,
      products,
      transactions,
      dashboardStats,
      recentActivities,
      lowStockProducts,
      expiringProducts,
      login,
      logout,
      refreshUsers,
      createUser,
      updateUserAccount,
      removeUserAccount,
      resetUserPassword,
      changeOwnPassword,
      refreshData,
      loadProducts,
      getProduct,
      findByBarcode,
      addProduct,
      updateProduct,
      deleteProduct,
      recordStockMovement,
      recordSale,
      getSales,
      filterTransactions,
      clearError,
    }),
    [
      isAuthenticated,
      isLoading,
      isInitialized,
      error,
      currentUser,
      isOwner,
      users,
      products,
      transactions,
      dashboardStats,
      recentActivities,
      lowStockProducts,
      expiringProducts,
      login,
      logout,
      refreshUsers,
      createUser,
      updateUserAccount,
      removeUserAccount,
      resetUserPassword,
      changeOwnPassword,
      refreshData,
      loadProducts,
      getProduct,
      findByBarcode,
      addProduct,
      updateProduct,
      deleteProduct,
      recordStockMovement,
      recordSale,
      getSales,
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
