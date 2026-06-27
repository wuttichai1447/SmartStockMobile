import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../components/SearchBar';
import ProductImage from '../components/ProductImage';
import CustomButton from '../components/CustomButton';
import ReceiptModal from '../components/ReceiptModal';
import BarcodeScanModal from '../components/BarcodeScanModal';
import { useProducts } from '../context/ProductContext';
import { CartItem, Product, Sale } from '../models/Product';
import { COLORS } from '../utils/constants';
import { formatCurrency } from '../utils/helpers';
import { showAlert } from '../utils/alert';

const PosScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { products, recordSale, findByBarcode, refreshData, currentUser } =
    useProducts();

  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [scanVisible, setScanVisible] = useState(false);
  const [discountText, setDiscountText] = useState('');
  const [receivedText, setReceivedText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('SalesHistory')}
          style={styles.headerButton}
        >
          <Ionicons name="receipt-outline" size={22} color={COLORS.textLight} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const availableProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      if (product.quantity <= 0) return false;
      if (!normalized) return true;
      return (
        product.productName.toLowerCase().includes(normalized) ||
        product.category.toLowerCase().includes(normalized) ||
        product.barcode.toLowerCase().includes(normalized)
      );
    });
  }, [products, query]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );
  const discount = Math.max(0, Number(discountText) || 0);
  const total = Math.max(0, subtotal - discount);
  const received = Number(receivedText) || 0;
  const change = received > 0 ? Math.max(0, received - total) : 0;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          showAlert('สต็อกไม่พอ', `"${product.productName}" เหลือ ${product.quantity} ${product.unit}`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const changeQty = useCallback((productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const next = item.quantity + delta;
          if (next > item.product.quantity) {
            showAlert(
              'สต็อกไม่พอ',
              `"${item.product.productName}" เหลือ ${item.product.quantity} ${item.product.unit}`
            );
            return item;
          }
          return { ...item, quantity: next };
        })
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const handleScanned = useCallback(
    (barcode: string) => {
      const product = findByBarcode(barcode);
      if (!product) {
        showAlert('ไม่พบสินค้า', `ไม่พบสินค้าที่มีบาร์โค้ด ${barcode}`);
        return;
      }
      if (product.quantity <= 0) {
        showAlert('สินค้าหมด', `"${product.productName}" สต็อกหมดแล้ว`);
        return;
      }
      addToCart(product);
    },
    [addToCart, findByBarcode]
  );

  const resetSale = () => {
    setCart([]);
    setDiscountText('');
    setReceivedText('');
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showAlert('ตะกร้าว่าง', 'กรุณาเพิ่มสินค้าก่อนชำระเงิน');
      return;
    }
    if (received > 0 && received < total) {
      showAlert('เงินไม่พอ', 'จำนวนเงินที่รับมาน้อยกว่ายอดที่ต้องชำระ');
      return;
    }

    setProcessing(true);
    try {
      const sale = await recordSale({
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        discount,
        received,
        soldByName: currentUser?.displayName ?? '',
      });
      setCartVisible(false);
      resetSale();
      setReceipt(sale);
    } catch (err) {
      showAlert('ขายไม่สำเร็จ', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchFlex}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="ค้นหาสินค้าเพื่อขาย..."
          />
        </View>
        <TouchableOpacity style={styles.scanButton} onPress={() => setScanVisible(true)}>
          <Ionicons name="barcode-outline" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={availableProducts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const inCart = cart.find((c) => c.product.id === item.id);
          return (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => addToCart(item)}
              activeOpacity={0.7}
            >
              <ProductImage imageUri={item.imageUri} category={item.category} size={52} />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={styles.productMeta}>
                  คงเหลือ {item.quantity} {item.unit}
                </Text>
              </View>
              <View style={styles.productRight}>
                <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
                {inCart ? (
                  <View style={styles.inCartBadge}>
                    <Text style={styles.inCartText}>{inCart.quantity}</Text>
                  </View>
                ) : (
                  <Ionicons name="add-circle" size={26} color={COLORS.primary} />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>ไม่พบสินค้าที่มีสต็อก</Text>
          </View>
        }
      />

      {cart.length > 0 && (
        <TouchableOpacity style={styles.cartBar} onPress={() => setCartVisible(true)}>
          <View style={styles.cartBarBadge}>
            <Ionicons name="cart" size={20} color={COLORS.textLight} />
            <Text style={styles.cartBarCount}>{itemCount}</Text>
          </View>
          <Text style={styles.cartBarText}>ดูตะกร้า / ชำระเงิน</Text>
          <Text style={styles.cartBarTotal}>{formatCurrency(total)}</Text>
        </TouchableOpacity>
      )}

      <Modal visible={cartVisible} animationType="slide" onRequestClose={() => setCartVisible(false)}>
        <View style={styles.cartScreen}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>ตะกร้าสินค้า</Text>
            <TouchableOpacity onPress={() => setCartVisible(false)} style={styles.headerButton}>
              <Ionicons name="close" size={26} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={cart}
            keyExtractor={(item) => item.product.id.toString()}
            contentContainerStyle={styles.cartListContent}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName} numberOfLines={1}>
                    {item.product.productName}
                  </Text>
                  <Text style={styles.cartItemMeta}>
                    {formatCurrency(item.product.price)} × {item.quantity} ={' '}
                    {formatCurrency(item.product.price * item.quantity)}
                  </Text>
                </View>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => changeQty(item.product.id, -1)}
                  >
                    <Ionicons name="remove" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => changeQty(item.product.id, 1)}
                  >
                    <Ionicons name="add" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeFromCart(item.product.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={styles.checkoutPanel}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>ส่วนลด (บาท)</Text>
              <TextInput
                style={styles.fieldInput}
                value={discountText}
                onChangeText={setDiscountText}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>รับเงิน (บาท)</Text>
              <TextInput
                style={styles.fieldInput}
                value={receivedText}
                onChangeText={setReceivedText}
                keyboardType="numeric"
                placeholder={total.toString()}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>รวม</Text>
              <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>ส่วนลด</Text>
                <Text style={styles.summaryValue}>-{formatCurrency(discount)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.grandLabel}>สุทธิ</Text>
              <Text style={styles.grandValue}>{formatCurrency(total)}</Text>
            </View>
            {received > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>เงินทอน</Text>
                <Text style={styles.changeValue}>{formatCurrency(change)}</Text>
              </View>
            )}

            <CustomButton
              title="ชำระเงิน"
              onPress={handleCheckout}
              loading={processing}
              icon={<Ionicons name="cash-outline" size={20} color={COLORS.textLight} />}
              style={styles.checkoutButton}
            />
          </View>
        </View>
      </Modal>

      <BarcodeScanModal
        visible={scanVisible}
        onClose={() => setScanVisible(false)}
        onScanned={handleScanned}
        title="สแกนเพื่อเพิ่มลงตะกร้า"
      />

      <ReceiptModal
        visible={receipt !== null}
        sale={receipt}
        onClose={() => setReceipt(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerButton: {
    marginRight: 12,
    padding: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    paddingBottom: 8,
  },
  searchFlex: {
    flex: 1,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  productMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  productRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  inCartBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  inCartText: {
    color: COLORS.textLight,
    fontWeight: '800',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  cartBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    elevation: 4,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  cartBarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cartBarCount: {
    color: COLORS.textLight,
    fontWeight: '800',
    fontSize: 15,
  },
  cartBarText: {
    flex: 1,
    color: COLORS.textLight,
    fontWeight: '700',
    fontSize: 15,
  },
  cartBarTotal: {
    color: COLORS.textLight,
    fontWeight: '800',
    fontSize: 17,
  },
  cartScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  cartListContent: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  cartItemMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
  },
  checkoutPanel: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  fieldInput: {
    width: 120,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  grandLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  grandValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
  },
  changeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  checkoutButton: {
    marginTop: 14,
  },
});

export default PosScreen;
