import React, { useCallback, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';
import { useProducts } from '../context/ProductContext';
import { Product } from '../models/Product';
import { COLORS } from '../utils/constants';

const ScannerScreen: React.FC = () => {
  const { findByBarcode, recordStockMovement } = useProducts();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setProduct(null);
      setQuantity('1');
    }, [])
  );

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scanned) return;

    setScanned(true);
    const found = findByBarcode(data.trim());

    if (found) {
      setProduct(found);
    } else {
      Alert.alert('Product Not Found', `No product found for barcode: ${data}`, [
        { text: 'Scan Again', onPress: () => setScanned(false) },
      ]);
    }
  };

  const handleStockMovement = async (type: 'IN' | 'OUT') => {
    if (!product) return;

    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity greater than zero');
      return;
    }

    setIsProcessing(true);
    try {
      await recordStockMovement(product.id, type, qty);
      const updated = findByBarcode(product.barcode);
      Alert.alert(
        'Success',
        `${type === 'IN' ? 'Stock In' : 'Stock Out'} recorded successfully`,
        [
          {
            text: 'Scan Again',
            onPress: () => {
              setScanned(false);
              setProduct(null);
              setQuantity('1');
            },
          },
          {
            text: 'Continue',
            onPress: () => {
              if (updated) setProduct(updated);
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to update stock'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Ionicons name="camera-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.message}>Camera access is required to scan barcodes</Text>
        <CustomButton title="Grant Permission" onPress={requestPermission} />
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
            <Text style={styles.scanText}>Align barcode within the frame</Text>
            {scanned && (
              <CustomButton
                title="Scan Again"
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
            <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
            <Text style={styles.productTitle}>Product Found</Text>
          </View>

          <View style={styles.infoCard}>
            <InfoRow label="Name" value={product.productName} />
            <InfoRow label="Category" value={product.category} />
            <InfoRow label="Barcode" value={product.barcode} />
            <InfoRow
              label="Current Stock"
              value={`${product.quantity} ${product.unit}`}
            />
          </View>

          <Text style={styles.quantityLabel}>Movement Quantity</Text>
          <TextInput
            style={styles.quantityInput}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="Enter quantity"
            placeholderTextColor={COLORS.textSecondary}
          />

          <View style={styles.actionRow}>
            <CustomButton
              title="Stock In"
              onPress={() => handleStockMovement('IN')}
              loading={isProcessing}
              variant="secondary"
              style={styles.actionButton}
            />
            <CustomButton
              title="Stock Out"
              onPress={() => handleStockMovement('OUT')}
              loading={isProcessing}
              variant="danger"
              style={styles.actionButton}
            />
          </View>

          <CustomButton
            title="Scan Another"
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
    gap: 10,
    marginBottom: 20,
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
