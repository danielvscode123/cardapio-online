import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { IconifyIcon } from '@/components/ui/iconify-icon';
import { colors, fonts, radius, spacing } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: `${string}:${string}`;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

const variantStyles = {
  primary: { backgroundColor: colors.tomato, text: colors.white, borderColor: colors.tomato },
  secondary: { backgroundColor: colors.ink, text: colors.cream, borderColor: colors.ink },
  ghost: { backgroundColor: 'transparent', text: colors.ink, borderColor: colors.line },
  danger: { backgroundColor: colors.danger, text: colors.white, borderColor: colors.danger },
} as const;

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const palette = variantStyles[variant];
  const isDisabled = disabled || loading;

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          {icon ? <IconifyIcon icon={icon} size={20} color={palette.text} /> : null}
          <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.48,
  },
});
