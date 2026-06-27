import { Alert, Platform } from 'react-native';

export const showAlert = (
  title: string,
  message: string,
  onOk?: () => void
): void => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    onOk?.();
    return;
  }

  Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
};

export const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  options?: {
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
  }
): void => {
  const confirmText = options?.confirmText ?? 'OK';
  const cancelText = options?.cancelText ?? 'ยกเลิก';

  if (Platform.OS === 'web') {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    {
      text: confirmText,
      style: options?.destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
};
