import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../utils/constants';
import {
  getCategoryDefaultImage,
  PRESET_PRODUCT_IMAGES,
} from '../utils/productImages';
import ProductImage from './ProductImage';

interface ProductImagePickerProps {
  category: string;
  imageUri: string;
  onChange: (uri: string) => void;
}

const ProductImagePicker: React.FC<ProductImagePickerProps> = ({
  category,
  imageUri,
  onChange,
}) => {
  const resolvedUri = imageUri || getCategoryDefaultImage(category);

  return (
    <View style={styles.container}>
      <View style={styles.previewRow}>
        <ProductImage imageUri={resolvedUri} category={category} size={88} />
        <View style={styles.previewText}>
          <Text style={styles.previewTitle}>รูปสินค้า</Text>
          <Text style={styles.previewHint}>
            เลือกรูปตัวอย่างด้านล่าง หรือใช้รูปตามหมวดหมู่อัตโนมัติ
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.presetRow}>
          {PRESET_PRODUCT_IMAGES.map((preset) => {
            const selected = resolvedUri === preset.uri;
            return (
              <TouchableOpacity
                key={preset.uri}
                style={[styles.presetItem, selected && styles.presetItemSelected]}
                onPress={() => onChange(preset.uri)}
              >
                <Image source={{ uri: preset.uri }} style={styles.presetImage} />
                <Text style={styles.presetLabel}>{preset.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  previewText: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  previewHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetItem: {
    alignItems: 'center',
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  presetImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  presetLabel: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

export default ProductImagePicker;
