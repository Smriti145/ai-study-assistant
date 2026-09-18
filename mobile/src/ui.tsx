import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
export const styles = StyleSheet.create({
  screen: { padding: 20, paddingBottom: 44, gap: 16 },
  title: { fontSize: 30, fontWeight: '700', color: '#193d35' },
  subtitle: { color: '#586d66', fontSize: 16, lineHeight: 24 },
  panel: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
    gap: 14,
    borderWidth: 1,
    borderColor: '#dce6dd',
  },
  heading: { fontSize: 20, fontWeight: '600', color: '#193d35' },
  text: { fontSize: 16, lineHeight: 25, color: '#233e36' },
  label: { fontSize: 14, color: '#405c51', marginBottom: 7 },
  input: {
    borderWidth: 1,
    borderColor: '#a6bbb0',
    borderRadius: 12,
    padding: 13,
    color: '#183d31',
    backgroundColor: '#fff',
    fontSize: 16,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#205e4b',
    borderRadius: 12,
    padding: 14,
    minHeight: 48,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.45 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#a6bbb0',
    minHeight: 44,
  },
  selected: { backgroundColor: '#cee4d4', borderColor: '#205e4b' },
  error: {
    color: '#982b2b',
    backgroundColor: '#ffeded',
    padding: 14,
    borderRadius: 12,
  },
});
export function Button({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.disabled]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#718078"
        {...props}
        style={[styles.input, props.multiline && styles.multiline]}
      />
    </View>
  );
}
export function Choices({
  values,
  value,
  onChange,
  disabled,
}: {
  values: string[];
  value: string;
  onChange: (s: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      {values.map(s => (
        <Pressable
          key={s}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityState={{ selected: s === value, disabled }}
          onPress={() => onChange(s)}
          style={[styles.chip, s === value && styles.selected]}
        >
          <Text style={styles.text}>{s}</Text>
        </Pressable>
      ))}
    </View>
  );
}
