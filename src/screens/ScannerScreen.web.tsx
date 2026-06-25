import React, { useCallback, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';
import ProductImage from '../components/ProductImage';
import { useProducts } from '../context/ProductContext';
import { Product } from '../models/Product';
import { COLORS } from '../utils/constants';
import { DEMO_BARCODES } from '../utils/sampleProducts';

const ScannerScreen: React.FC = () => {
  const { findByBarcode, recordStockMovement } = useProducts();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setBarcodeInput('');
      setProduct(null);
      setQuantity('1');
    }, [])
  );

  const handleLookup = () => {
    const barcode = barcodeInput.trim();
    if (!barcode) {
      Alert.alert('Enter Barcode', 'Please enter a barcode to look up a product.');
      return;
    }

    const found = findByBarcode(barcode);
    if (found) {
      setProduct(found);
    } else {
      Alert.alert('Product Not Found', `No product found for barcode: ${barcode}`);
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
            text: 'Look Up Another',
            onPress: () => {
              setProduct(null);
              setBarcodeInput('');
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

  if (!product) {
    return (
      <View style={styles.container}>
        <View style={styles.lookupPanel}>
          <Ionicons name="barcode-outline" size={64} color={COLORS.primary} />
          <Text style={styles.title}>Barcode Lookup</Text>
          <Text style={styles.subtitle}>
            กรอกบาร์โค้ดเพื่อค้นหาสินค้า เช่น {DEMO_BARCODES.slice(0, 3).join(', ')}
          </Text>

          <TextInput
            style={styles.barcodeInput}
            value={barcodeInput}
            onChangeText={setBarcodeInput}
            placeholder="Enter barcode"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="characters"
            onSubmitEditing={handleLookup}
          />

          <CustomButton title="Find Product" onPress={handleLookup} />
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
          <InfoRow label="Name" value={product.productName} />
          <InfoRow label="Category" value={product.category} />
          <InfoRow label="Barcode" value={product.barcode} />
          <InfoRow label="Current Stock" value={`${product.quantity} ${product.unit}`} />
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
          title="Look Up Another"
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
  barcodeInput: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
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
