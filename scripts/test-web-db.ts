/**
 * Quick smoke test for web database CRUD + product images.
 * Run: npx tsx scripts/test-web-db.ts
 */
import {
  initDatabase,
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../src/database/sqlite.web';

const TEST_BARCODE = 'TEST_IMAGE_999';
const TEST_IMAGE =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==';

async function run() {
  // Use isolated in-memory style by clearing module state - sqlite.web uses localStorage
  // In Node there is no localStorage unless we polyfill
  const storage = new Map<string, string>();
  (globalThis as typeof globalThis & { localStorage: Storage }).localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => storage.clear(),
    key: () => null,
    length: 0,
  };

  console.log('1. initDatabase...');
  await initDatabase();
  const seeded = getAllProducts();
  console.log(`   OK - seeded ${seeded.length} products`);
  console.log(`   Sample: ${seeded[0]?.productName} | price: ${seeded[0]?.price} | low stock demo: ${seeded.find((p) => p.quantity <= p.minStock)?.productName ?? 'n/a'}`);

  console.log('2. addProduct with custom image...');
  const created = addProduct({
    productName: 'ลำไยทดสอบ',
    category: 'ผลไม้',
    quantity: 10,
    barcode: TEST_BARCODE,
    unit: 'กก.',
    price: 55,
    minStock: 15,
    expiryDate: '2026-07-01',
    imageUri: TEST_IMAGE,
  });
  if (!created.imageUri?.startsWith('data:image')) {
    throw new Error('imageUri not saved on create');
  }
  console.log(`   OK - id=${created.id}, image saved (${created.imageUri.length} chars)`);

  console.log('3. updateProduct image...');
  const newImage = 'https://images.unsplash.com/photo-1553279768-8650fa32c908?w=400&h=400&fit=crop';
  const updated = updateProduct(created.id, {
    ...created,
    productName: 'ลำไยทดสอบ (แก้ไข)',
    imageUri: newImage,
  });
  if (!updated || updated.imageUri !== newImage) {
    throw new Error('imageUri not updated');
  }
  console.log(`   OK - name="${updated.productName}", image URL updated`);

  console.log('4. getProductById...');
  const fetched = getProductById(created.id);
  if (!fetched || fetched.productName !== 'ลำไยทดสอบ (แก้ไข)') {
    throw new Error('fetch after update failed');
  }
  console.log('   OK');

  console.log('5. deleteProduct...');
  deleteProduct(created.id);
  if (getProductById(created.id)) {
    throw new Error('product still exists after delete');
  }
  console.log('   OK');

  console.log('\nAll tests passed.');
}

run().catch((err) => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
