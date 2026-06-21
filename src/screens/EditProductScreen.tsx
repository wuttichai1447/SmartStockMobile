import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import CustomButton from '../components/CustomButton';
import { useProducts } from '../context/ProductContext';
import { ProductsStackParamList } from '../navigation/AppNavigator';
import { COLORS, PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../utils/constants';
import { validateProduct } from '../utils/helpers';

type RouteProps = RouteProp<ProductsStackParamList, 'EditProduct'>;
type NavigationProp = NativeStackNavigationProp<ProductsStackParamList, 'EditProduct'>;

const EditProductScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { getProduct, updateProduct } = useProducts();

  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [quantity, setQuantity] = useState('0');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState(PRODUCT_UNITS[0]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const product = getProduct(route.params.productId);
    if (product) {
      setProductName(product.productName);
      setCategory(product.category);
      setQuantity(product.quantity.toString());
      setBarcode(product.barcode);
      setUnit(product.unit);
    } else {
      Alert.alert('Error', 'Product not found', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
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
      });
      Alert.alert('Success', 'Product updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
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
          <Text style={styles.label}>Product ID</Text>
          <Text style={styles.readOnlyValue}>#{route.params.productId}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Product Name</Text>
          <TextInput
            style={styles.input}
            value={productName}
            onChangeText={setProductName}
            placeholder="Enter product name"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {PRODUCT_CATEGORIES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, category === item && styles.chipSelected]}
                  onPress={() => setCategory(item)}
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
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Unit</Text>
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
          <Text style={styles.label}>Barcode</Text>
          <TextInput
            style={styles.input}
            value={barcode}
            onChangeText={setBarcode}
            autoCapitalize="characters"
          />
        </View>

        <CustomButton
          title="Save Changes"
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
});

export default EditProductScreen;
