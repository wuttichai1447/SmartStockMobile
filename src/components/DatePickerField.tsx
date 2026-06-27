import React, { useRef } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { formatDateShort, toISODateString } from '../utils/helpers';

interface DatePickerFieldProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  minimumDate?: Date;
}

const parseDate = (value: string): Date => {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  value,
  onChange,
  placeholder = 'เลือกวันที่',
  minimumDate,
}) => {
  const [showPicker, setShowPicker] = React.useState(false);
  const [tempDate, setTempDate] = React.useState(parseDate(value));
  const webInputRef = useRef<HTMLInputElement | null>(null);

  const displayText = value ? formatDateShort(value) : placeholder;
  const hasValue = Boolean(value);

  const applyDate = (date: Date) => {
    onChange(toISODateString(date));
    setShowPicker(false);
  };

  const handleNativeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && date) {
        onChange(toISODateString(date));
      }
      return;
    }

    if (date) {
      setTempDate(date);
    }
  };

  const openPicker = () => {
    setTempDate(parseDate(value));
    setShowPicker(true);
  };

  const openWebPicker = () => {
    const input = webInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.click();
    }
  };

  const clearDate = () => {
    onChange('');
  };

  if (Platform.OS === 'web') {
    return (
      <Pressable style={styles.field} onPress={openWebPicker}>
        <Ionicons
          name="calendar"
          size={22}
          color={hasValue ? COLORS.primary : COLORS.textSecondary}
        />
        <Text style={[styles.fieldText, !hasValue && styles.placeholder]}>
          {displayText}
        </Text>
        {hasValue ? (
          <TouchableOpacity
            onPress={(event) => {
              event.stopPropagation?.();
              clearDate();
            }}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
        )}
        <input
          ref={webInputRef}
          type="date"
          value={value}
          min={minimumDate ? toISODateString(minimumDate) : undefined}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.value)
          }
          style={{
            position: 'absolute',
            opacity: 0,
            width: 1,
            height: 1,
            pointerEvents: 'none',
          }}
        />
      </Pressable>
    );
  }

  return (
    <View>
      <Pressable style={styles.field} onPress={openPicker}>
        <Ionicons
          name="calendar"
          size={22}
          color={hasValue ? COLORS.primary : COLORS.textSecondary}
        />
        <Text style={[styles.fieldText, !hasValue && styles.placeholder]}>
          {displayText}
        </Text>
        {hasValue ? (
          <TouchableOpacity
            onPress={(event) => {
              event.stopPropagation?.();
              clearDate();
            }}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
        )}
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal visible={showPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.iosSheet}>
              <View style={styles.iosHeader}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.iosCancel}>ยกเลิก</Text>
                </TouchableOpacity>
                <Text style={styles.iosTitle}>เลือกวันที่</Text>
                <TouchableOpacity onPress={() => applyDate(tempDate)}>
                  <Text style={styles.iosDone}>ตกลง</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="inline"
                minimumDate={minimumDate}
                onChange={handleNativeChange}
                locale="th-TH"
              />
            </View>
          </View>
        </Modal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="calendar"
            minimumDate={minimumDate}
            onChange={handleNativeChange}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  fieldText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  placeholder: {
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  iosSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  iosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iosTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  iosCancel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  iosDone: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default DatePickerField;
