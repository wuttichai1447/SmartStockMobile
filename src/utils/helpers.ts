export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getTodayISO = (): string => {
  return new Date().toISOString();
};

export const validateLogin = (
  username: string,
  password: string
): { valid: boolean; error?: string } => {
  if (!username.trim()) {
    return { valid: false, error: 'Username is required' };
  }
  if (!password.trim()) {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  return { valid: true };
};

export const validateProduct = (data: {
  productName: string;
  category: string;
  quantity: string;
  barcode: string;
  unit: string;
}): { valid: boolean; error?: string } => {
  if (!data.productName.trim()) {
    return { valid: false, error: 'Product name is required' };
  }
  if (!data.category.trim()) {
    return { valid: false, error: 'Category is required' };
  }
  if (!data.barcode.trim()) {
    return { valid: false, error: 'Barcode is required' };
  }
  if (!data.unit.trim()) {
    return { valid: false, error: 'Unit is required' };
  }

  const quantity = Number(data.quantity);
  if (Number.isNaN(quantity) || quantity < 0) {
    return { valid: false, error: 'Quantity must be a valid non-negative number' };
  }

  return { valid: true };
};

export const generateBarcode = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `SSM${timestamp}${random}`;
};

export const isSameDay = (dateA: string, dateB: string): boolean => {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};
