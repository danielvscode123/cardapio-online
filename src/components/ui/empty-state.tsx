import { StyleSheet, Text, View } from 'react-native';

import { IconifyIcon } from '@/components/ui/iconify-icon';
import { colors, fonts, radius, spacing } from '@/constants/theme';

type EmptyStateProps = {
  icon: `${string}:${string}`;
  title: string;
  description: string;
  accent?: string;
};

export function EmptyState({ icon, title, description, accent = colors.mustard }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: accent }]}>
        <IconifyIcon icon={icon} size={32} color={colors.ink} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    transform: [{ rotate: '-3deg' }],
  },
  title: { color: colors.ink, fontFamily: fonts.display, fontSize: 27, textAlign: 'center' },
  description: {
    maxWidth: 340,
    marginTop: spacing.sm,
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
