import React, { useEffect, useState } from 'react';
import {
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
import { useProducts } from '../context/ProductContext';
import { ProductsStackParamList } from '../navigation/AppNavigator';
import { COLORS, DEFAULT_MIN_STOCK, LABELS, PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../utils/constants';
import { showAlert } from '../utils/alert';
import { generateBarcode, validateProduct } from '../utils/helpers';
import { getCategoryDefaultImage } from '../utils/productImages';

type NavigationProp = NativeStackNavigationProp<ProductsStackParamList, 'AddProduct'>;
type RouteProps = RouteProp<ProductsStackParamList, 'AddProduct'>;

const AddProductScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { addProduct, findByBarcode } = useProducts();
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [quantity, setQuantity] = useState('0');
  const [barcode, setBarcode] = useState(generateBarcode());
  const [unit, setUnit] = useState(PRODUCT_UNITS[0]);
  const [price, setPrice] = useState('0');
  const [minStock, setMinStock] = useState(String(DEFAULT_MIN_STOCK));
  const [expiryDate, setExpiryDate] = useState('');
  const [imageUri, setImageUri] = useState(getCategoryDefaultImage(PRODUCT_CATEGORIES[0]));
  const [hasCustomImage, setHasCustomImage] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBarcodeLabel, setShowBarcodeLabel] = useState(false);

  useEffect(() => {
    if (route.params?.barcode) {
      setBarcode(route.params.barcode);
    }
  }, [route.params?.barcode]);

  const checkDuplicateBarcode = (code: string) => Boolean(findByBarcode(code.trim()));

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
      await addProduct({
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
      showAlert('สำเร็จ', 'เพิ่มสินค้าเรียบร้อยแล้ว', () => navigation.goBack());
    } catch (err) {
      showAlert(
        'Error',
        err instanceof Error ? err.message : 'Failed to add product'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <FormField label="ชื่อสินค้า">
          <TextInput
            style={styles.input}
            value={productName}
            onChangeText={setProductName}
            placeholder="กรอกชื่อสินค้า"
            placeholderTextColor={COLORS.textSecondary}
          />
        </FormField>

        <FormField label="หมวดหมู่">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {PRODUCT_CATEGORIES.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={category === item}
                  onPress={() => {
                    setCategory(item);
                    if (!hasCustomImage) {
                      setImageUri(getCategoryDefaultImage(item));
                    }
                  }}
                />
              ))}
            </View>
          </ScrollView>
        </FormField>

        <FormField label="รูปสินค้า">
          <ProductImagePicker
            category={category}
            imageUri={imageUri}
            onChange={setImageUri}
            onCustomImageChange={setHasCustomImage}
          />
        </FormField>

        <FormField label="จำนวน">
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="0"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numeric"
          />
        </FormField>

        <FormField label="ราคา (บาท)">
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numeric"
          />
        </FormField>

        <FormField label="สต็อกขั้นต่ำ">
          <TextInput
            style={styles.input}
            value={minStock}
            onChangeText={setMinStock}
            placeholder={String(DEFAULT_MIN_STOCK)}
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numeric"
          />
        </FormField>

        <FormField label="วันหมดอายุ (ไม่บังคับ)">
          <DatePickerField
            value={expiryDate}
            onChange={setExpiryDate}
            minimumDate={new Date()}
          />
        </FormField>

        <FormField label="หน่วย">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {PRODUCT_UNITS.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={unit === item}
                  onPress={() => setUnit(item)}
                />
              ))}
            </View>
          </ScrollView>
        </FormField>

        <FormField label="บาร์โค้ด">
          <BarcodeScanField
            value={barcode}
            onChange={setBarcode}
            onDuplicate={checkDuplicateBarcode}
            showGenerate
            onGenerate={() => setBarcode(generateBarcode())}
          />
          {barcode.trim() ? (
            <TouchableOpacity
              style={styles.previewBarcodeButton}
              onPress={() => setShowBarcodeLabel(true)}
            >
              <Ionicons name="barcode-outline" size={18} color={COLORS.primary} />
              <Text style={styles.previewBarcodeText}>{LABELS.previewBarcode}</Text>
            </TouchableOpacity>
          ) : null}
        </FormField>

        <BarcodeLabelModal
          visible={showBarcodeLabel}
          label={{
            productName: productName.trim() || 'สินค้าใหม่',
            barcode: barcode.trim(),
            price: Number(price) || 0,
            unit,
          }}
          onClose={() => setShowBarcodeLabel(false)}
        />

        <CustomButton
          title={LABELS.addProduct}
          onPress={handleSubmit}
          loading={isSubmitting}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const Chip: React.FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
}> = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.chipSelected]}
    onPress={onPress}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barcodeInput: {
    flex: 1,
  },
  generateButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
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

export default AddProductScreen;
