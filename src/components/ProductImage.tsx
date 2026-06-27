import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { getProductImageUri } from '../utils/productImages';

interface ProductImageProps {
  imageUri?: string | null;
  category: string;
  size?: number;
  borderRadius?: number;
}

const ProductImage: React.FC<ProductImageProps> = ({
  imageUri,
  category,
  size = 72,
  borderRadius = 12,
}) => {
  const [hasError, setHasError] = useState(false);
  const uri = getProductImageUri({ imageUri, category });

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  if (hasError) {
    return (
      <View
        style={[
          styles.fallback,
          { width: size, height: size, borderRadius },
        ]}
      >
        <Ionicons name="nutrition-outline" size={size * 0.45} color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius }}
      resizeMode="cover"
      onError={() => setHasError(true)}
    />
  );
};

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default ProductImage;
