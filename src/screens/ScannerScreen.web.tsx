import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BarcodeScanField from '../components/BarcodeScanField';
import CustomButton from '../components/CustomButton';
import ProductImage from '../components/ProductImage';
import { useProducts } from '../context/ProductContext';
import { Product } from '../models/Product';
import { MainTabParamList } from '../navigation/AppNavigator';
import { COLORS, LABELS } from '../utils/constants';
import { formatCurrency } from '../utils/helpers';
import { showAlert } from '../utils/alert';

const ScannerScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { findByBarcode, recordStockMovement } = useProducts();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setBarcodeInput('');
      setProduct(null);
      setNotFoundBarcode(null);
      setQuantity('1');
    }, [])
  );

  const navigateToAddProduct = (barcode: string) => {
    navigation.navigate('Products', {
      screen: 'AddProduct',
      params: { barcode },
    });
  };

  const handleLookup = (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed) {
      showAlert('กรอกบาร์โค้ด', 'กรุณากรอกบาร์โค้ดเพื่อค้นหาสินค้า');
      return;
    }

    const found = findByBarcode(trimmed);
    if (found) {
      setNotFoundBarcode(null);
      setProduct(found);
    } else {
      setProduct(null);
      setNotFoundBarcode(trimmed);
    }
  };

  const handleStockMovement = async (type: 'IN' | 'OUT') => {
    if (!product) return;

    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty <= 0) {
      showAlert('จำนวนไม่ถูกต้อง', 'กรุณากรอกจำนวนที่มากกว่า 0');
      return;
    }

    setIsProcessing(true);
    try {
      await recordStockMovement(product.id, type, qty);
      const updated = findByBarcode(product.barcode);
      if (updated) setProduct(updated);
      showAlert(
        'สำเร็จ',
        `${type === 'IN' ? LABELS.stockIn : LABELS.stockOut} บันทึกเรียบร้อยแล้ว`
      );
    } catch (err) {
      showAlert(
        'ข้อผิดพลาด',
        err instanceof Error ? err.message : 'อัปเดตสต็อกไม่สำเร็จ'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (notFoundBarcode && !product) {
    return (
      <View style={styles.container}>
        <View style={styles.lookupPanel}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.warning} />
          <Text style={styles.title}>ไม่พบสินค้า</Text>
          <Text style={styles.subtitle}>
            บาร์โค้ด {notFoundBarcode} ยังไม่มีในระบบ{'\n'}
            ต้องการเพิ่มเป็นสินค้าใหม่หรือไม่?
          </Text>

          <CustomButton
            title="เพิ่มสินค้าใหม่ด้วยบาร์โค้ดนี้"
            onPress={() => navigateToAddProduct(notFoundBarcode)}
          />
          <CustomButton
            title="สแกน/ค้นหาใหม่"
            onPress={() => {
              setNotFoundBarcode(null);
              setBarcodeInput('');
            }}
            variant="outline"
          />
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <View style={styles.lookupPanel}>
          <Ionicons name="barcode-outline" size={64} color={COLORS.primary} />
          <Text style={styles.title}>สแกนหรือค้นหาบาร์โค้ด</Text>
          <Text style={styles.subtitle}>
            สแกนบาร์โค้ดจริงจากสินค้า หรือกรอกเพื่อรับเข้า/จ่ายออกสต็อก
          </Text>

          <View style={styles.scanFieldWrap}>
            <BarcodeScanField
            value={barcodeInput}
            onChange={setBarcodeInput}
            onScanned={handleLookup}
          />
          </View>

          <CustomButton title="ค้นหาสินค้า" onPress={() => handleLookup(barcodeInput)} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.productPanel}>
        <View style={styles.productHeader}>
          <ProductImage
            imageUri={product.imageUri}
            category={product.category}
            size={96}
          />
          <View style={styles.productHeaderText}>
            <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
            <Text style={styles.productTitle}>พบสินค้าแล้ว</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <InfoRow label="ชื่อ" value={product.productName} />
          <InfoRow label="หมวดหมู่" value={product.category} />
          <InfoRow label="บาร์โค้ด" value={product.barcode} />
          <InfoRow label="ราคา" value={formatCurrency(product.price)} />
          <InfoRow label="สต็อกปัจจุบัน" value={`${product.quantity} ${product.unit}`} />
        </View>

        <Text style={styles.quantityLabel}>จำนวนที่ต้องการบันทึก</Text>
        <TextInput
          style={styles.quantityInput}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          placeholder="กรอกจำนวน"
          placeholderTextColor={COLORS.textSecondary}
        />

        <View style={styles.actionRow}>
          <CustomButton
            title={LABELS.stockIn}
            onPress={() => handleStockMovement('IN')}
            loading={isProcessing}
            variant="secondary"
            style={styles.actionButton}
          />
          <CustomButton
            title={LABELS.stockOut}
            onPress={() => handleStockMovement('OUT')}
            loading={isProcessing}
            variant="danger"
            style={styles.actionButton}
          />
        </View>

        <CustomButton
          title="ค้นหารายการอื่น"
          onPress={() => {
            setProduct(null);
            setBarcodeInput('');
            setQuantity('1');
          }}
          variant="outline"
        />
      </View>
    </View>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  lookupPanel: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    alignItems: 'center',
  },
  scanFieldWrap: {
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  productPanel: {
    flex: 1,
    padding: 20,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  productHeaderText: {
    flex: 1,
    gap: 4,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  quantityInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default ScannerScreen;