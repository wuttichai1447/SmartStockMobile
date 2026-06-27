import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

const toDataUri = (asset: ImagePicker.ImagePickerAsset): string | null => {
  if (asset.base64) {
    const mimeType = asset.mimeType ?? 'image/jpeg';
    return `data:${mimeType};base64,${asset.base64}`;
  }

  if (asset.uri) {
    return asset.uri;
  }

  return null;
};

export const pickProductImageFromLibrary = async (): Promise<string | null> => {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('กรุณาอนุญาตการเข้าถึงรูปภาพในเครื่อง');
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  return toDataUri(result.assets[0]);
};

export const takeProductPhoto = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return pickProductImageFromLibrary();
  }

  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('กรุณาอนุญาตการเข้าถึงกล้อง');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  return toDataUri(result.assets[0]);
};
