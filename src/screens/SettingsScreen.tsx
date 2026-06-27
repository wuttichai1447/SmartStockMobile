import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';
import { useProducts } from '../context/ProductContext';
import { User, UserRole } from '../models/Product';
import { COLORS, LABELS, ROLE_LABELS } from '../utils/constants';
import { showAlert, showConfirm } from '../utils/alert';
import { exportBackup, importBackup } from '../services/backup';
import {
  isCloudConfigured,
  pullFromCloud,
  pushToCloud,
} from '../services/cloudSync';

interface SectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const SettingsScreen: React.FC = () => {
  const {
    currentUser,
    isOwner,
    users,
    refreshUsers,
    refreshData,
    createUser,
    updateUserAccount,
    removeUserAccount,
    resetUserPassword,
    changeOwnPassword,
    logout,
  } = useProducts();

  const [busy, setBusy] = useState(false);

  const [pwdModal, setPwdModal] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const [userModal, setUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('staff');

  useFocusEffect(
    useCallback(() => {
      refreshUsers();
    }, [refreshUsers])
  );

  const resetPwdForm = () => {
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
  };

  const handleChangePassword = async () => {
    if (newPwd.length < 6) {
      showAlert('รหัสผ่านสั้นเกินไป', 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPwd !== confirmPwd) {
      showAlert('รหัสผ่านไม่ตรงกัน', 'กรุณายืนยันรหัสผ่านใหม่ให้ตรงกัน');
      return;
    }

    setBusy(true);
    try {
      await changeOwnPassword(currentPwd, newPwd);
      setPwdModal(false);
      resetPwdForm();
      showAlert('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
    } catch (err) {
      showAlert('ไม่สำเร็จ', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setBusy(false);
    }
  };

  const openAddUser = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormDisplayName('');
    setFormPassword('');
    setFormRole('staff');
    setUserModal(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormDisplayName(user.displayName);
    setFormPassword('');
    setFormRole(user.role);
    setUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) {
      if (!formUsername.trim()) {
        showAlert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อผู้ใช้');
        return;
      }
      if (formPassword.length < 6) {
        showAlert('รหัสผ่านสั้นเกินไป', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
      }
    }

    setBusy(true);
    try {
      if (editingUser) {
        await updateUserAccount(editingUser.id, {
          displayName: formDisplayName,
          role: formRole,
        });
      } else {
        await createUser({
          username: formUsername,
          displayName: formDisplayName,
          password: formPassword,
          role: formRole,
        });
      }
      setUserModal(false);
      showAlert('สำเร็จ', 'บันทึกข้อมูลผู้ใช้เรียบร้อยแล้ว');
    } catch (err) {
      showAlert('ไม่สำเร็จ', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setBusy(false);
    }
  };

  const handleResetUserPassword = (user: User) => {
    const tempPassword = 'reset123';
    showConfirm(
      'รีเซ็ตรหัสผ่าน',
      `ตั้งรหัสผ่านของ "${user.displayName}" เป็น "${tempPassword}" ใช่หรือไม่? แนะนำให้ผู้ใช้เปลี่ยนทันทีหลังเข้าสู่ระบบ`,
      async () => {
        setBusy(true);
        try {
          await resetUserPassword(user.id, tempPassword);
          showAlert('สำเร็จ', `รหัสผ่านใหม่คือ "${tempPassword}"`);
        } catch (err) {
          showAlert(
            'ไม่สำเร็จ',
            err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
          );
        } finally {
          setBusy(false);
        }
      },
      { confirmText: 'รีเซ็ต' }
    );
  };

  const handleDeleteUser = (user: User) => {
    showConfirm(
      'ลบผู้ใช้',
      `ต้องการลบผู้ใช้ "${user.displayName}" ใช่หรือไม่?`,
      async () => {
        setBusy(true);
        try {
          await removeUserAccount(user.id);
        } catch (err) {
          showAlert(
            'ไม่สำเร็จ',
            err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
          );
        } finally {
          setBusy(false);
        }
      },
      { confirmText: LABELS.delete, destructive: true }
    );
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      await exportBackup();
    } catch (err) {
      showAlert('ส่งออกไม่สำเร็จ', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setBusy(false);
    }
  };

  const handleImport = () => {
    showConfirm(
      'กู้คืนข้อมูล',
      'ข้อมูลปัจจุบันจะถูกแทนที่ด้วยข้อมูลในไฟล์สำรอง ดำเนินการต่อหรือไม่?',
      async () => {
        setBusy(true);
        try {
          const done = await importBackup();
          if (done) {
            await refreshData();
            refreshUsers();
            showAlert('สำเร็จ', 'กู้คืนข้อมูลเรียบร้อยแล้ว');
          }
        } catch (err) {
          showAlert(
            'กู้คืนไม่สำเร็จ',
            err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
          );
        } finally {
          setBusy(false);
        }
      },
      { confirmText: 'กู้คืน', destructive: true }
    );
  };

  const handleCloud = (mode: 'push' | 'pull') => {
    if (!isCloudConfigured()) {
      showAlert(
        'ยังไม่ได้ตั้งค่าคลาวด์',
        'กรุณาตั้งค่า Supabase URL และ anon key ในไฟล์ src/config/cloud.ts ก่อนใช้งาน'
      );
      return;
    }

    const runPush = async () => {
      setBusy(true);
      try {
        const count = await pushToCloud();
        showAlert('อัปโหลดสำเร็จ', `ส่งข้อมูลขึ้นคลาวด์แล้ว ${count} รายการ`);
      } catch (err) {
        showAlert('ไม่สำเร็จ', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      } finally {
        setBusy(false);
      }
    };

    const runPull = async () => {
      setBusy(true);
      try {
        const count = await pullFromCloud();
        await refreshData();
        showAlert('ดาวน์โหลดสำเร็จ', `ดึงข้อมูลจากคลาวด์แล้ว ${count} รายการ`);
      } catch (err) {
        showAlert('ไม่สำเร็จ', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      } finally {
        setBusy(false);
      }
    };

    if (mode === 'push') {
      runPush();
    } else {
      showConfirm(
        'ดึงข้อมูลจากคลาวด์',
        'ข้อมูลสินค้า/ธุรกรรมในเครื่องจะถูกแทนที่ด้วยข้อมูลจากคลาวด์ ดำเนินการต่อหรือไม่?',
        runPull,
        { confirmText: 'ดึงข้อมูล', destructive: true }
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Section title={LABELS.account} icon="person-circle-outline">
        <View style={styles.accountRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={COLORS.textLight} />
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{currentUser?.displayName}</Text>
            <Text style={styles.accountMeta}>
              @{currentUser?.username} •{' '}
              {currentUser ? ROLE_LABELS[currentUser.role] : ''}
            </Text>
          </View>
        </View>
        <CustomButton
          title={LABELS.changePassword}
          variant="outline"
          onPress={() => {
            resetPwdForm();
            setPwdModal(true);
          }}
          icon={<Ionicons name="key-outline" size={18} color={COLORS.primary} />}
          style={styles.actionButton}
        />
      </Section>

      {isOwner && (
        <Section title={LABELS.userManagement} icon="people-outline">
          {users.map((user) => (
            <View key={user.id} style={styles.userRow}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.displayName}</Text>
                <Text style={styles.userMeta}>
                  @{user.username} • {ROLE_LABELS[user.role]}
                </Text>
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity
                  onPress={() => openEditUser(user)}
                  style={styles.iconButton}
                >
                  <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleResetUserPassword(user)}
                  style={styles.iconButton}
                >
                  <Ionicons name="key-outline" size={20} color={COLORS.warning} />
                </TouchableOpacity>
                {user.id !== currentUser?.id && (
                  <TouchableOpacity
                    onPress={() => handleDeleteUser(user)}
                    style={styles.iconButton}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          <CustomButton
            title="เพิ่มผู้ใช้"
            variant="outline"
            onPress={openAddUser}
            icon={<Ionicons name="person-add-outline" size={18} color={COLORS.primary} />}
            style={styles.actionButton}
          />
        </Section>
      )}

      <Section title={LABELS.backup} icon="save-outline">
        <Text style={styles.helpText}>
          ส่งออกข้อมูลทั้งหมดเป็นไฟล์เพื่อสำรองไว้ หรือกู้คืนจากไฟล์ที่เคยสำรอง
        </Text>
        <View style={styles.buttonRow}>
          <CustomButton
            title="ส่งออก"
            variant="primary"
            onPress={handleExport}
            icon={<Ionicons name="download-outline" size={18} color={COLORS.textLight} />}
            style={styles.flexButton}
          />
          <CustomButton
            title="กู้คืน"
            variant="secondary"
            onPress={handleImport}
            icon={<Ionicons name="cloud-upload-outline" size={18} color={COLORS.textLight} />}
            style={styles.flexButton}
          />
        </View>
      </Section>

      <Section title={LABELS.cloudSync} icon="cloud-outline">
        <View style={styles.cloudStatusRow}>
          <Ionicons
            name={isCloudConfigured() ? 'checkmark-circle' : 'alert-circle-outline'}
            size={18}
            color={isCloudConfigured() ? COLORS.success : COLORS.warning}
          />
          <Text style={styles.helpText}>
            {isCloudConfigured()
              ? 'เชื่อมต่อคลาวด์พร้อมใช้งาน'
              : 'ยังไม่ได้ตั้งค่า — แก้ไขที่ src/config/cloud.ts'}
          </Text>
        </View>
        <View style={styles.buttonRow}>
          <CustomButton
            title="อัปโหลด"
            variant="primary"
            onPress={() => handleCloud('push')}
            icon={<Ionicons name="cloud-upload-outline" size={18} color={COLORS.textLight} />}
            style={styles.flexButton}
          />
          <CustomButton
            title="ดึงข้อมูล"
            variant="secondary"
            onPress={() => handleCloud('pull')}
            icon={<Ionicons name="cloud-download-outline" size={18} color={COLORS.textLight} />}
            style={styles.flexButton}
          />
        </View>
      </Section>

      <CustomButton
        title={LABELS.logout}
        variant="danger"
        onPress={() =>
          showConfirm(LABELS.logout, 'ต้องการออกจากระบบใช่หรือไม่?', logout, {
            confirmText: LABELS.logout,
            destructive: true,
          })
        }
        icon={<Ionicons name="log-out-outline" size={18} color={COLORS.textLight} />}
        style={styles.logoutButton}
      />

      {busy && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      <Modal visible={pwdModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{LABELS.changePassword}</Text>
            <TextInput
              style={styles.input}
              placeholder="รหัสผ่านปัจจุบัน"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              value={currentPwd}
              onChangeText={setCurrentPwd}
            />
            <TextInput
              style={styles.input}
              placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              value={newPwd}
              onChangeText={setNewPwd}
            />
            <TextInput
              style={styles.input}
              placeholder="ยืนยันรหัสผ่านใหม่"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              value={confirmPwd}
              onChangeText={setConfirmPwd}
            />
            <View style={styles.buttonRow}>
              <CustomButton
                title={LABELS.cancel}
                variant="outline"
                onPress={() => setPwdModal(false)}
                style={styles.flexButton}
              />
              <CustomButton
                title={LABELS.save}
                onPress={handleChangePassword}
                loading={busy}
                style={styles.flexButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={userModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้'}
            </Text>
            <TextInput
              style={[styles.input, editingUser && styles.inputDisabled]}
              placeholder="ชื่อผู้ใช้ (สำหรับเข้าสู่ระบบ)"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              value={formUsername}
              editable={!editingUser}
              onChangeText={setFormUsername}
            />
            <TextInput
              style={styles.input}
              placeholder="ชื่อที่แสดง"
              placeholderTextColor={COLORS.textSecondary}
              value={formDisplayName}
              onChangeText={setFormDisplayName}
            />
            {!editingUser && (
              <TextInput
                style={styles.input}
                placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry
                value={formPassword}
                onChangeText={setFormPassword}
              />
            )}
            <Text style={styles.label}>สิทธิ์การใช้งาน</Text>
            <View style={styles.roleRow}>
              {(['staff', 'owner'] as UserRole[]).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleChip,
                    formRole === role && styles.roleChipActive,
                  ]}
                  onPress={() => setFormRole(role)}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      formRole === role && styles.roleChipTextActive,
                    ]}
                  >
                    {ROLE_LABELS[role]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.buttonRow}>
              <CustomButton
                title={LABELS.cancel}
                variant="outline"
                onPress={() => setUserModal(false)}
                style={styles.flexButton}
              />
              <CustomButton
                title={LABELS.save}
                onPress={handleSaveUser}
                loading={busy}
                style={styles.flexButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  accountMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionButton: {
    marginTop: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  userMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    padding: 6,
  },
  helpText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
    flex: 1,
  },
  cloudStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flexButton: {
    flex: 1,
  },
  logoutButton: {
    marginTop: 8,
  },
  busyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 12,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  roleChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '12',
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  roleChipTextActive: {
    color: COLORS.primary,
  },
});

export default SettingsScreen;
