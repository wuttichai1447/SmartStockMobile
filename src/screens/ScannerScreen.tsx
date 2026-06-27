import React, { useCallback, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';
import ProductImage from '../components/ProductImage';
import { useProducts } from '../context/ProductContext';
import { Product } from '../models/Product';
import { MainTabParamList } from '../navigation/AppNavigator';
import { COLORS, LABELS } from '../utils/constants';

import { formatCurrency } from '../utils/helpers';

const ScannerScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { findByBarcode, recordStockMovement } = useProducts();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
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

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scanned) return;

    setScanned(true);
    const code = data.trim();
    const found = findByBarcode(code);

    if (found) {
      setNotFoundBarcode(null);
      setProduct(found);
    } else {
      setNotFoundBarcode(code);
    }
  };

  const handleStockMovement = async (type: 'IN' | 'OUT') => {
    if (!product) return;

    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty <= 0) {
      Alert.alert('จำนวนไม่ถูกต้อง', 'กรุณากรอกจำนวนที่มากกว่า 0');
      return;
    }

    setIsProcessing(true);
    try {
      await recordStockMovement(product.id, type, qty);
      const updated = findByBarcode(product.barcode);
      Alert.alert(
        'สำเร็จ',
        `${type === 'IN' ? LABELS.stockIn : LABELS.stockOut} บันทึกเรียบร้อยแล้ว`,
        [
          {
            text: 'สแกนอีกครั้ง',
            onPress: () => {
              setScanned(false);
              setProduct(null);
              setQuantity('1');
            },
          },
          {
            text: 'ทำต่อ',
            onPress: () => {
              if (updated) setProduct(updated);
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        'ข้อผิดพลาด',
        err instanceof Error ? err.message : 'อัปเดตสต็อกไม่สำเร็จ'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>กำลังขอสิทธิ์ใช้กล้อง...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Ionicons name="camera-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.message}>ต้องอนุญาตกล้องเพื่อสแกนบาร์โค้ด</Text>
        <CustomButton title="อนุญาตกล้อง" onPress={requestPermission} />
      </View>
    );
  }

  if (notFoundBarcode && !product) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.warning} />
        <Text style={styles.message}>ไม่พบสินค้าสำหรับบาร์โค้ด</Text>
        <Text style={styles.barcodeValue}>{notFoundBarcode}</Text>
        <CustomButton
          title="เพิ่มสินค้าใหม่ด้วยบาร์โค้ดนี้"
          onPress={() => navigateToAddProduct(notFoundBarcode)}
        />
        <CustomButton
          title="สแกนอีกครั้ง"
          onPress={() => {
            setNotFoundBarcode(null);
            setScanned(false);
          }}
          variant="outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!product ? (
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanText}>วางบาร์โค้ดในกรอบ</Text>
            {scanned && (
              <CustomButton
                title="สแกนอีกครั้ง"
                onPress={() => setScanned(false)}
                variant="outline"
                style={styles.scanAgainButton}
              />
            )}
          </View>
        </View>
      ) : (
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
            <InfoRow
              label="สต็อกปัจจุบัน"
              value={`${product.quantity} ${product.unit}`}
            />
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
            title="สแกนรายการอื่น"
            onPress={() => {
              setScanned(false);
              setProduct(null);
              setQuantity('1');
            }}
            variant="outline"
          />
        </View>
      )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
    gap: 16,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  barcodeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanFrame: {
    width: 260,
    height: 260,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  scanText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
  },
  scanAgainButton: {
    marginTop: 20,
    minWidth: 160,
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
