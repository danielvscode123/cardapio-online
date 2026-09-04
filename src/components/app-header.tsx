import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconifyIcon } from '@/components/ui/iconify-icon';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

type AppHeaderProps = {
  eyebrow: string;
  title: string;
  accent?: string;
};

export function AppHeader({ eyebrow, title, accent = colors.tomato }: AppHeaderProps) {
  const { profile, signOut } = useAuth();

  return (
    <View style={styles.header}>
      <View style={styles.heading}>
        <View style={[styles.accent, { backgroundColor: accent }]} />
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
        </View>
      </View>

      <Pressable
        accessibilityLabel="Sair do aplicativo"
        accessibilityRole="button"
        onPress={() => void signOut()}
        style={({ pressed }) => [styles.account, pressed && styles.pressed]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.name.charAt(0).toUpperCase() ?? 'M'}</Text>
        </View>
        <View style={styles.accountCopy}>
          <Text numberOfLines={1} style={styles.accountName}>{profile?.name ?? 'Equipe'}</Text>
          <Text style={styles.accountRole}>{profile?.role === 'manager' ? 'Gerente' : 'Funcionário'}</Text>
        </View>
        <IconifyIcon icon="solar:logout-2-linear" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 76,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.canvas,
  },
  heading: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  accent: { width: 5, height: 38, borderRadius: radius.pill },
  headingCopy: { minWidth: 0, flex: 1 },
  eyebrow: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.3 },
  title: { color: colors.ink, fontFamily: fonts.display, fontSize: 25, letterSpacing: -0.6 },
  account: {
    maxWidth: 176,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  avatarText: { color: colors.cream, fontFamily: fonts.display, fontSize: 16 },
  accountCopy: { minWidth: 0, flexShrink: 1 },
  accountName: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 11 },
  accountRole: { color: colors.muted, fontFamily: fonts.body, fontSize: 9 },
  pressed: { opacity: 0.72 },
});
