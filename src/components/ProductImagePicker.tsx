import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import {
  getCategoryDefaultImage,
  PRESET_PRODUCT_IMAGES,
} from '../utils/productImages';
import { pickProductImageFromLibrary, takeProductPhoto } from '../utils/pickProductImage';
import { showAlert } from '../utils/alert';
import ProductImage from './ProductImage';

interface ProductImagePickerProps {
  category: string;
  imageUri: string;
  onChange: (uri: string) => void;
  onCustomImageChange?: (isCustom: boolean) => void;
  mode?: 'add' | 'edit';
}

const ProductImagePicker: React.FC<ProductImagePickerProps> = ({
  category,
  imageUri,
  onChange,
  onCustomImageChange,
  mode = 'add',
}) => {
  const [isPicking, setIsPicking] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const resolvedUri = imageUri || getCategoryDefaultImage(category);

  const applyImage = (uri: string, isCustom = true) => {
    onChange(uri);
    onCustomImageChange?.(isCustom);
  };

  const handlePickFromLibrary = async () => {
    setIsPicking(true);
    try {
      const uri = await pickProductImageFromLibrary();
      if (uri) {
        applyImage(uri, true);
      }
    } catch (err) {
      showAlert(
        'เลือกรูปไม่สำเร็จ',
        err instanceof Error ? err.message : 'ไม่สามารถเลือกรูปได้'
      );
    } finally {
      setIsPicking(false);
    }
  };

  const handleTakePhoto = async () => {
    setIsPicking(true);
    try {
      const uri = await takeProductPhoto();
      if (uri) {
        applyImage(uri, true);
      }
    } catch (err) {
      showAlert(
        'ถ่ายรูปไม่สำเร็จ',
        err instanceof Error ? err.message : 'ไม่สามารถถ่ายรูปได้'
      );
    } finally {
      setIsPicking(false);
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      showAlert('กรุณากรอก URL', 'ใส่ลิงก์รูปภาพ เช่น https://...');
      return;
    }

    applyImage(trimmed, true);
    setUrlInput('');
  };

  const handleResetToDefault = () => {
    applyImage(getCategoryDefaultImage(category), false);
  };

  const isUsingCustom = imageUri && imageUri !== getCategoryDefaultImage(category);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.previewRow}
        activeOpacity={0.85}
        onPress={handlePickFromLibrary}
        disabled={isPicking}
      >
        <View style={styles.previewImageWrap}>
          <ProductImage imageUri={resolvedUri} category={category} size={96} />
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={14} color={COLORS.textLight} />
          </View>
        </View>
        <View style={styles.previewText}>
          <Text style={styles.previewTitle}>
            {mode === 'edit' ? 'เปลี่ยนรูปสินค้า' : 'รูปสินค้า'}
          </Text>
          <Text style={styles.previewHint}>
            แตะรูปเพื่อเลือกจากแกลเลอรี หรือใช้ปุ่มด้านล่าง
          </Text>
          {isUsingCustom && (
            <Text style={styles.customBadge}>ใช้รูปที่กำหนดเอง</Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePickFromLibrary}
          disabled={isPicking}
        >
          {isPicking ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="images-outline" size={18} color={COLORS.primary} />
              <Text style={styles.actionText}>เลือกจากแกลเลอรี</Text>
            </>
          )}
        </TouchableOpacity>

        {Platform.OS !== 'web' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTakePhoto}
            disabled={isPicking}
          >
            <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
            <Text style={styles.actionText}>ถ่ายรูป</Text>
          </TouchableOpacity>
        )}
      </View>

      {isUsingCustom && (
        <TouchableOpacity style={styles.resetButton} onPress={handleResetToDefault}>
          <Ionicons name="refresh-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.resetText}>ใช้รูปหมวดหมู่เริ่มต้น</Text>
        </TouchableOpacity>
      )}

      <View style={styles.urlRow}>
        <TextInput
          style={styles.urlInput}
          value={urlInput}
          onChangeText={setUrlInput}
          placeholder="หรือวาง URL รูปภาพ"
          placeholderTextColor={COLORS.textSecondary}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.urlApplyButton} onPress={handleApplyUrl}>
          <Text style={styles.urlApplyText}>ใช้ URL</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>รูปตัวอย่าง</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.presetRow}>
          {PRESET_PRODUCT_IMAGES.map((preset) => {
            const selected = resolvedUri === preset.uri;
            return (
              <TouchableOpacity
                key={preset.uri}
                style={[styles.presetItem, selected && styles.presetItemSelected]}
                onPress={() => applyImage(preset.uri, true)}
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
  previewImageWrap: {
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
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
  customBadge: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resetText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '12',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  actionText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  urlRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  urlApplyButton: {
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  urlApplyText: {
    color: COLORS.textLight,
    fontWeight: '600',
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
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
