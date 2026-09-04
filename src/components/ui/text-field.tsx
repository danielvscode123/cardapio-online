import { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { colors, fonts, radius, spacing } from '@/constants/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, error, style, ...props }, ref) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.muted}
        selectionColor={colors.tomato}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  ),
);

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.lg,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 12,
  },
});
