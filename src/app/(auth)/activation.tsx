import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { IconifyIcon } from '@/components/ui/iconify-icon';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export default function ActivationScreen() {
  const router = useRouter();
  const { session, profile, profileError, claimInitialManager, refreshProfile, signOut } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName =
    profile?.name ??
    (session?.user.user_metadata.full_name as string | undefined) ??
    session?.user.email?.split('@')[0] ??
    'Gerente';

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);
    const result = await claimInitialManager(displayName);
    setClaiming(false);

    if (result.error) {
      setError(
        result.error.includes('already been claimed')
          ? 'O gerente inicial já foi configurado. Peça para ele ativar seu acesso.'
          : result.error,
      );
      return;
    }

    await refreshProfile();
    router.replace('/(app)/(tabs)/waiter');
  };

  return (
    <View style={styles.page}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Text style={styles.wordmark}>Mesa Boa</Text>
          <View style={styles.waitingBadge}>
            <View style={styles.waitingDot} />
            <Text style={styles.waitingText}>ACESSO PENDENTE</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.illustration}>
            <View style={styles.illustrationBack} />
            <View style={styles.illustrationIcon}>
              <IconifyIcon icon="solar:key-minimalistic-square-3-bold" size={46} color={colors.cream} />
            </View>
          </View>

          <View style={styles.copy}>
            <Text style={styles.eyebrow}>OLÁ, {displayName.toUpperCase()}</Text>
            <Text style={styles.title}>A casa está quase aberta.</Text>
            <Text style={styles.description}>
              Se este é o primeiro acesso do restaurante, ative esta conta como gerente. Caso contrário,
              peça ao gerente para liberar seu usuário.
            </Text>
          </View>

          {profileError && !profile ? (
            <View style={styles.notice}>
              <IconifyIcon icon="solar:danger-triangle-bold" size={20} color={colors.danger} />
              <Text style={styles.noticeText}>O banco ainda não está configurado ou está indisponível.</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button
              icon="solar:crown-star-bold"
              label="Ativar primeiro gerente"
              loading={claiming}
              onPress={handleClaim}
            />
            <Button label="Atualizar meu acesso" onPress={() => void refreshProfile()} variant="ghost" />
            <Button label="Sair desta conta" onPress={() => void signOut()} variant="ghost" />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  safeArea: { flex: 1 },
  topBar: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: { color: colors.ink, fontFamily: fonts.display, fontSize: 24 },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: '#F2DCA7',
  },
  waitingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#9C6810' },
  waitingText: { color: '#76500E', fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  illustration: { width: 104, height: 104, alignSelf: 'center' },
  illustrationBack: {
    position: 'absolute',
    inset: 0,
    borderRadius: radius.lg,
    backgroundColor: colors.mustard,
    transform: [{ rotate: '7deg' }],
  },
  illustrationIcon: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-3deg' }],
  },
  copy: { alignItems: 'center', gap: spacing.md },
  eyebrow: { color: colors.tomato, fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.6 },
  title: {
    maxWidth: 350,
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 39,
    lineHeight: 44,
    letterSpacing: -1.3,
    textAlign: 'center',
  },
  description: {
    maxWidth: 420,
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#F7DDD5',
  },
  noticeText: { flex: 1, color: colors.danger, fontFamily: fonts.bodyBold, fontSize: 12 },
  error: { color: colors.danger, fontFamily: fonts.bodyBold, fontSize: 13, textAlign: 'center' },
  actions: { gap: spacing.md, width: '100%', maxWidth: 440, alignSelf: 'center' },
});
