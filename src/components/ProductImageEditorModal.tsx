import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../models/Product';
import { useProducts } from '../context/ProductContext';
import { COLORS, LABELS } from '../utils/constants';
import { showAlert } from '../utils/alert';
import { getCategoryDefaultImage } from '../utils/productImages';
import CustomButton from './CustomButton';
import ProductImagePicker from './ProductImagePicker';

interface ProductImageEditorModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSaved?: (product: Product) => void;
}

const ProductImageEditorModal: React.FC<ProductImageEditorModalProps> = ({
  visible,
  product,
  onClose,
  onSaved,
}) => {
  const { updateProduct } = useProducts();
  const [imageUri, setImageUri] = useState('');
  const [hasCustomImage, setHasCustomImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    setImageUri(product.imageUri ?? getCategoryDefaultImage(product.category));
    setHasCustomImage(Boolean(product.imageUri));
  }, [product]);

  const handleSave = async () => {
    if (!product) return;

    setIsSaving(true);
    try {
      const updated = await updateProduct(product.id, {
        productName: product.productName,
        category: product.category,
        quantity: product.quantity,
        barcode: product.barcode,
        unit: product.unit,
        price: product.price,
        minStock: product.minStock,
        expiryDate: product.expiryDate ?? null,
        imageUri: hasCustomImage ? imageUri : null,
      });
      showAlert('สำเร็จ', 'อัปเดตรูปสินค้าเรียบร้อยแล้ว');
      onSaved?.(updated);
      onClose();
    } catch (err) {
      showAlert(
        'ข้อผิดพลาด',
        err instanceof Error ? err.message : 'บันทึกรูปไม่สำเร็จ'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!product) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>แก้ไขรูปสินค้า</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.productName}>{product.productName}</Text>

          <ProductImagePicker
            category={product.category}
            imageUri={imageUri}
            onChange={setImageUri}
            onCustomImageChange={setHasCustomImage}
            mode="edit"
          />

          <CustomButton
            title={LABELS.save}
            onPress={handleSave}
            loading={isSaving}
            style={styles.saveButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  productName: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 20,
  },
});

export default ProductImageEditorModal;
