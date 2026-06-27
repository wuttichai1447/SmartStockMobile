import * as Crypto from 'expo-crypto';
import { CreateUserInput, User, UserRole } from '../models/Product';
import {
  countOwners,
  countUsers,
  deleteUser as dbDeleteUser,
  getAllUsers,
  getUserById,
  getUserByUsername,
  insertUser,
  updateUserPassword,
  updateUserProfile,
} from '../database/sqlite';
import { DEFAULT_OWNER } from '../utils/constants';

const HASH_ITERATIONS = 150;

const generateSalt = async (): Promise<string> => {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Salted, iterated SHA-256. ไม่ใช่ bcrypt แต่เพียงพอสำหรับแอป offline
 * ที่เก็บข้อมูลบนเครื่องผู้ใช้เอง และดีกว่าเก็บรหัสผ่านเป็น plaintext มาก
 */
const hashPassword = async (password: string, salt: string): Promise<string> => {
  let digest = `${salt}:${password}`;
  for (let i = 0; i < HASH_ITERATIONS; i += 1) {
    digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      digest
    );
  }
  return digest;
};

export const ensureDefaultUser = async (): Promise<void> => {
  if (countUsers() > 0) {
    return;
  }

  const salt = await generateSalt();
  const passwordHash = await hashPassword(DEFAULT_OWNER.password, salt);

  insertUser({
    username: DEFAULT_OWNER.username,
    displayName: DEFAULT_OWNER.displayName,
    role: 'owner',
    passwordHash,
    salt,
  });
};

export const authenticate = async (
  username: string,
  password: string
): Promise<User | null> => {
  const record = getUserByUsername(username.trim());
  if (!record) {
    return null;
  }

  const hash = await hashPassword(password, record.salt);
  if (hash !== record.passwordHash) {
    return null;
  }

  return {
    id: record.id,
    username: record.username,
    displayName: record.displayName,
    role: record.role,
    createdAt: record.createdAt,
  };
};

export const listUsers = (): User[] => getAllUsers();

export const createUser = async (input: CreateUserInput): Promise<User> => {
  const username = input.username.trim();
  if (getUserByUsername(username)) {
    throw new Error('มีชื่อผู้ใช้นี้อยู่แล้ว');
  }

  const salt = await generateSalt();
  const passwordHash = await hashPassword(input.password, salt);

  return insertUser({
    username,
    displayName: input.displayName.trim() || username,
    role: input.role,
    passwordHash,
    salt,
  });
};

export const updateUser = (
  id: number,
  fields: { displayName: string; role: UserRole }
): User => {
  const existing = getUserById(id);
  if (!existing) {
    throw new Error('ไม่พบผู้ใช้');
  }

  if (existing.role === 'owner' && fields.role !== 'owner' && countOwners() <= 1) {
    throw new Error('ต้องมีเจ้าของ (owner) อย่างน้อย 1 คน');
  }

  const updated = updateUserProfile(id, {
    displayName: fields.displayName.trim() || existing.username,
    role: fields.role,
  });
  if (!updated) {
    throw new Error('แก้ไขผู้ใช้ไม่สำเร็จ');
  }
  return updated;
};

export const changePassword = async (
  id: number,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const record = getUserById(id);
  if (!record) {
    throw new Error('ไม่พบผู้ใช้');
  }

  const currentHash = await hashPassword(currentPassword, record.salt);
  if (currentHash !== record.passwordHash) {
    throw new Error('รหัสผ่านปัจจุบันไม่ถูกต้อง');
  }

  const salt = await generateSalt();
  const passwordHash = await hashPassword(newPassword, salt);
  updateUserPassword(id, passwordHash, salt);
};

export const resetPassword = async (
  id: number,
  newPassword: string
): Promise<void> => {
  const record = getUserById(id);
  if (!record) {
    throw new Error('ไม่พบผู้ใช้');
  }

  const salt = await generateSalt();
  const passwordHash = await hashPassword(newPassword, salt);
  updateUserPassword(id, passwordHash, salt);
};

export const removeUser = (id: number, currentUserId: number): void => {
  if (id === currentUserId) {
    throw new Error('ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้');
  }

  const record = getUserById(id);
  if (!record) {
    throw new Error('ไม่พบผู้ใช้');
  }

  if (record.role === 'owner' && countOwners() <= 1) {
    throw new Error('ต้องมีเจ้าของ (owner) อย่างน้อย 1 คน');
  }

  dbDeleteUser(id);
};
