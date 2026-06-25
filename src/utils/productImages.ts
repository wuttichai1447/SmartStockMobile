const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop';

export const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  ผลไม้:
    'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop',
  ผักสด:
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop',
  เนื้อสัตว์:
    'https://images.unsplash.com/photo-1602474461744-2885439c247e?w=400&h=400&fit=crop',
  อาหารทะเล:
    'https://images.unsplash.com/photo-1565680018434-b3d4b5b4d4bb?w=400&h=400&fit=crop',
  ธัญพืช:
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
  ของแห้ง:
    'https://images.unsplash.com/photo-1509440155596-093aae776cfb?w=400&h=400&fit=crop',
  เครื่องปรุง:
    'https://images.unsplash.com/photo-1506365924439-3d125a1254b6?w=400&h=400&fit=crop',
};

export const PRESET_PRODUCT_IMAGES = [
  {
    label: 'มะม่วง',
    uri: 'https://images.unsplash.com/photo-1553279768-8650fa32c908?w=400&h=400&fit=crop',
  },
  {
    label: 'ทุเรียน',
    uri: 'https://images.unsplash.com/photo-1599599810769-74c47e06279c?w=400&h=400&fit=crop',
  },
  {
    label: 'กุ้ง',
    uri: 'https://images.unsplash.com/photo-1565680018434-b3d4b5b4d4bb?w=400&h=400&fit=crop',
  },
  {
    label: 'หมู',
    uri: 'https://images.unsplash.com/photo-1602474461744-2885439c247e?w=400&h=400&fit=crop',
  },
  {
    label: 'ผัก',
    uri: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop',
  },
  {
    label: 'ข้าว',
    uri: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
  },
] as const;

export const getCategoryDefaultImage = (category: string): string => {
  return CATEGORY_DEFAULT_IMAGES[category] ?? DEFAULT_IMAGE;
};

export const getProductImageUri = (product: {
  imageUri?: string | null;
  category: string;
}): string => {
  return product.imageUri?.trim() || getCategoryDefaultImage(product.category);
};

export const resolveProductImageUri = (
  imageUri: string | null | undefined,
  category: string
): string => {
  return imageUri?.trim() || getCategoryDefaultImage(category);
};
