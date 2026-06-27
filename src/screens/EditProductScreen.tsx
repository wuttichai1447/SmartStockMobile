import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import BarcodeScanField from '../components/BarcodeScanField';
import BarcodeLabelModal from '../components/BarcodeLabelModal';
import CustomButton from '../components/CustomButton';
import DatePickerField from '../components/DatePickerField';
import ProductImagePicker from '../components/ProductImagePicker';
import { useProducts } from '../context/ProductContext';import { ProductsStackParamList } from '../navigation/AppNavigator';
import { COLORS, DEFAULT_MIN_STOCK, LABELS, PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../utils/constants';
import { showAlert } from '../utils/alert';
import { validateProduct } from '../utils/helpers';
import { getCategoryDefaultImage } from '../utils/productImages';

type RouteProps = RouteProp<ProductsStackParamList, 'EditProduct'>;
type NavigationProp = NativeStackNavigationProp<ProductsStackParamList, 'EditProduct'>;

const EditProductScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { getProduct, updateProduct, findByBarcode } = useProducts();
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [quantity, setQuantity] = useState('0');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState(PRODUCT_UNITS[0]);
  const [price, setPrice] = useState('0');
  const [minStock, setMinStock] = useState(String(DEFAULT_MIN_STOCK));
  const [expiryDate, setExpiryDate] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [hasCustomImage, setHasCustomImage] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showBarcodeLabel, setShowBarcodeLabel] = useState(false);

  useEffect(() => {
    const product = getProduct(route.params.productId);
    if (product) {
      setProductName(product.productName);
      setCategory(product.category);
      setQuantity(product.quantity.toString());
      setBarcode(product.barcode);
      setUnit(product.unit);
      setPrice(product.price.toString());
      setMinStock(product.minStock.toString());
      setExpiryDate(product.expiryDate ?? '');
      setImageUri(product.imageUri ?? getCategoryDefaultImage(product.category));
      setHasCustomImage(Boolean(product.imageUri));
    } else {
      showAlert('ข้อผิดพลาด', 'ไม่พบสินค้า', () => navigation.goBack());
    }
    setIsLoading(false);
  }, [getProduct, navigation, route.params.productId]);

  const handleSubmit = async () => {
    const validation = validateProduct({
      productName,
      category,
      quantity,
      barcode,
      unit,
      price,
      minStock,
      expiryDate: expiryDate.trim() || undefined,
    });

    if (!validation.valid) {
      setValidationError(validation.error ?? 'Invalid input');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      await updateProduct(route.params.productId, {
        productName: productName.trim(),
        category,
        quantity: Number(quantity),
        barcode: barcode.trim(),
        unit,
        price: Number(price),
        minStock: Number(minStock),
        expiryDate: expiryDate.trim() || null,
        imageUri: hasCustomImage ? imageUri : null,
      });
      showAlert('สำเร็จ', 'แก้ไขสินค้าเรียบร้อยแล้ว', () => navigation.goBack());
    } catch (err) {
      showAlert(
        'Error',
        err instanceof Error ? err.message : 'Failed to update product'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {validationError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={COLORS.error} />
            <Text style={styles.errorText}>{validationError}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>รหัสสินค้า</Text>
          <Text style={styles.readOnlyValue}>#{route.params.productId}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>ชื่อสินค้า</Text>
          <TextInput
            style={styles.input}
            value={productName}
            onChangeText={setProductName}
            placeholder="กรอกชื่อสินค้า"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>หมวดหมู่</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {PRODUCT_CATEGORIES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, category === item && styles.chipSelected]}
                  onPress={() => {
                    setCategory(item);
                    if (!hasCustomImage) {
                      setImageUri(getCategoryDefaultImage(item));
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === item && styles.chipTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>แก้ไขรูปสินค้า</Text>
          <ProductImagePicker
            category={category}
            imageUri={imageUri}
            onChange={setImageUri}
            onCustomImageChange={setHasCustomImage}
            mode="edit"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>จำนวน</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>ราคา (บาท)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>สต็อกขั้นต่ำ</Text>
          <TextInput
            style={styles.input}
            value={minStock}
            onChangeText={setMinStock}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>วันหมดอายุ (ไม่บังคับ)</Text>
          <DatePickerField value={expiryDate} onChange={setExpiryDate} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>หน่วย</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {PRODUCT_UNITS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, unit === item && styles.chipSelected]}
                  onPress={() => setUnit(item)}
                >
                  <Text
                    style={[styles.chipText, unit === item && styles.chipTextSelected]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>บาร์โค้ด</Text>
          <BarcodeScanField
            value={barcode}
            onChange={setBarcode}
            onDuplicate={(code) => {
              const found = findByBarcode(code.trim());
              return found !== null && found.id !== route.params.productId;
            }}
          />
          {barcode.trim() ? (
            <TouchableOpacity
              style={styles.previewBarcodeButton}
              onPress={() => setShowBarcodeLabel(true)}
            >
              <Ionicons name="print-outline" size={18} color={COLORS.primary} />
              <Text style={styles.previewBarcodeText}>{LABELS.printBarcode}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <BarcodeLabelModal
          visible={showBarcodeLabel}
          label={{
            productName: productName.trim(),
            barcode: barcode.trim(),
            price: Number(price) || 0,
            unit,
          }}
          onClose={() => setShowBarcodeLabel(false)}
        />
        <CustomButton
          title={LABELS.save}
          onPress={handleSubmit}
          loading={isSubmitting}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '15',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: 14,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  readOnlyValue: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.textLight,
  },
  submitButton: {
    marginTop: 8,
  },
  previewBarcodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '10',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  previewBarcodeText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default EditProductScreen;
