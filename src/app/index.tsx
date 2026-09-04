import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.brandMark}>
          <View style={styles.brandDot} />
          <Text style={styles.eyebrow}>OPERAÇÃO DO SALÃO</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.title}>Mesa Boa</Text>
          <Text style={styles.subtitle}>
            Pedidos organizados, cozinha sincronizada e mesas sempre sob controle.
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusDot} />
          <View style={styles.statusCopy}>
            <Text style={styles.statusTitle}>Fundação pronta</Text>
            <Text style={styles.statusText}>A próxima etapa conecta o Supabase.</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    justifyContent: 'space-between',
  },
  brandMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.tomato,
  },
  eyebrow: {
    color: colors.sage,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.8,
  },
  hero: {
    gap: spacing.md,
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  title: {
    color: colors.cream,
    fontFamily: fonts.display,
    fontSize: 58,
    letterSpacing: -2.5,
    lineHeight: 64,
  },
  subtitle: {
    maxWidth: 360,
    color: colors.sage,
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 27,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  statusCopy: {
    flex: 1,
    gap: 2,
  },
  statusTitle: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  statusText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
  },
});
