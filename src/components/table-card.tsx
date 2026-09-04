import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconifyIcon } from '@/components/ui/iconify-icon';
import { colors, fonts, radius, shadow, spacing } from '@/constants/theme';
import { DiningTable } from '@/features/operations/types';
import { formatCurrency, minutesSince } from '@/lib/format';

type TableCardProps = {
  table: DiningTable;
  onPress: () => void;
};

export function TableCard({ table, onPress }: TableCardProps) {
  const occupied = Boolean(table.session);
  const hasReadyOrder = table.readyOrders > 0;

  return (
    <Pressable
      accessibilityHint="Abre os detalhes e pedidos da mesa"
      accessibilityLabel={`Mesa ${table.number}, ${occupied ? 'ocupada' : 'livre'}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        occupied ? styles.occupiedCard : styles.availableCard,
        hasReadyOrder && styles.readyCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.numberBadge, occupied && styles.numberBadgeOccupied]}>
          <Text style={[styles.number, occupied && styles.numberOccupied]}>{table.number}</Text>
        </View>
        <View style={[styles.status, occupied ? styles.statusOccupied : styles.statusAvailable]}>
          <View style={[styles.statusDot, occupied ? styles.dotOccupied : styles.dotAvailable]} />
          <Text style={styles.statusText}>{occupied ? 'OCUPADA' : 'LIVRE'}</Text>
        </View>
      </View>

      <View style={styles.middle}>
        <Text style={styles.label}>{table.label ?? `Mesa ${table.number}`}</Text>
        {occupied && table.session ? (
          <Text style={styles.meta}>
            {table.session.guest_count} {table.session.guest_count === 1 ? 'pessoa' : 'pessoas'} ·{' '}
            {minutesSince(table.session.opened_at)} min
          </Text>
        ) : (
          <Text style={styles.meta}>{table.seats} lugares</Text>
        )}
      </View>

      <View style={styles.footer}>
        {occupied ? (
          <>
            <Text style={styles.total}>{formatCurrency(table.total)}</Text>
            {hasReadyOrder ? (
              <View style={styles.readyBadge}>
                <IconifyIcon icon="solar:bell-bing-bold" size={14} color={colors.white} />
                <Text style={styles.readyText}>{table.readyOrders} pronto</Text>
              </View>
            ) : (
              <IconifyIcon icon="solar:arrow-right-up-linear" size={20} color={colors.muted} />
            )}
          </>
        ) : (
          <>
            <Text style={styles.openText}>Abrir atendimento</Text>
            <IconifyIcon icon="solar:add-circle-bold" size={22} color={colors.success} />
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 190,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: 'space-between',
    ...shadow.card,
  },
  availableCard: { backgroundColor: '#E4EFE3', borderColor: '#C6D9C2' },
  occupiedCard: { backgroundColor: colors.cream, borderColor: colors.line },
  readyCard: { borderColor: colors.tomato, borderWidth: 2 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  numberBadge: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  numberBadgeOccupied: { backgroundColor: colors.ink },
  number: { color: colors.ink, fontFamily: fonts.display, fontSize: 22 },
  numberOccupied: { color: colors.cream },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusAvailable: { backgroundColor: '#C9DFC8' },
  statusOccupied: { backgroundColor: '#F0D8C9' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  dotAvailable: { backgroundColor: colors.success },
  dotOccupied: { backgroundColor: colors.tomato },
  statusText: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 8, letterSpacing: 0.8 },
  middle: { gap: 3 },
  label: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 16 },
  meta: { color: colors.muted, fontFamily: fonts.body, fontSize: 11 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  total: { color: colors.ink, fontFamily: fonts.display, fontSize: 20 },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.tomato,
  },
  readyText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 9 },
  openText: { color: colors.success, fontFamily: fonts.bodyBold, fontSize: 11 },
});
