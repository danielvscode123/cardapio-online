import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { IconifyIcon } from '@/components/ui/iconify-icon';
import { Screen } from '@/components/ui/screen';
import { colors, fonts, radius, shadow, spacing } from '@/constants/theme';
import { useKitchenOrders, useUpdateOrderStatus } from '@/features/operations/queries';
import { getNextKitchenStatus } from '@/features/operations/rules';
import { KitchenOrder } from '@/features/operations/types';
import { formatTime, minutesSince } from '@/lib/format';
import { OrderStatus } from '@/types/domain';

type KitchenFilter = 'all' | 'sent' | 'preparing' | 'ready';

const filters: { id: KitchenFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'sent', label: 'Recebidos' },
  { id: 'preparing', label: 'Em preparo' },
  { id: 'ready', label: 'Prontos' },
];

const statusConfig: Record<Exclude<OrderStatus, 'delivered' | 'cancelled'>, { label: string; color: string }> = {
  sent: { label: 'RECEBIDO', color: colors.mustard },
  preparing: { label: 'EM PREPARO', color: '#DB8B39' },
  ready: { label: 'PRONTO', color: colors.success },
};

function KitchenTicket({ order, onAdvance, loading }: { order: KitchenOrder; onAdvance: () => void; loading: boolean }) {
  const status = statusConfig[order.status as keyof typeof statusConfig];
  const minutes = minutesSince(order.sent_at);

  return (
    <View style={[styles.ticket, order.status === 'ready' && styles.readyTicket]}>
      <View style={[styles.ticketStripe, { backgroundColor: status.color }]} />
      <View style={styles.ticketHeader}>
        <View style={styles.tableNumber}>
          <Text style={styles.tableLabel}>MESA</Text>
          <Text style={styles.tableValue}>{order.tableNumber}</Text>
        </View>
        <View style={styles.ticketMeta}>
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
          <Text style={styles.time}>{formatTime(order.sent_at)} · há {minutes} min</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.items}>
        {order.order_items.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <View style={styles.itemCopy}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              {item.notes ? (
                <View style={styles.note}>
                  <IconifyIcon icon="solar:notes-bold" size={14} color={colors.tomato} />
                  <Text style={styles.noteText}>{item.notes}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {order.notes ? <Text style={styles.orderNote}>Pedido: {order.notes}</Text> : null}

      {order.status === 'sent' ? (
        <Button icon="solar:fire-bold-duotone" label="Iniciar preparo" loading={loading} onPress={onAdvance} variant="secondary" />
      ) : null}
      {order.status === 'preparing' ? (
        <Button icon="solar:check-circle-bold" label="Marcar como pronto" loading={loading} onPress={onAdvance} />
      ) : null}
      {order.status === 'ready' ? (
        <View style={styles.waitingPickup}>
          <IconifyIcon icon="solar:bell-bing-bold" size={20} color={colors.success} />
          <Text style={styles.waitingPickupText}>Aguardando retirada pelo salão</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function KitchenScreen() {
  const kitchenQuery = useKitchenOrders();
  const updateStatus = useUpdateOrderStatus();
  const [filter, setFilter] = useState<KitchenFilter>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const orders = (kitchenQuery.data ?? []).filter((order) => filter === 'all' || order.status === filter);

  const handleAdvance = async (order: KitchenOrder) => {
    const nextStatus = getNextKitchenStatus(order.status);
    if (!nextStatus) return;
    setUpdatingOrderId(order.id);
    try {
      await updateStatus.mutateAsync({ orderId: order.id, status: nextStatus });
    } catch (error) {
      Alert.alert('Não foi possível atualizar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <Screen
      contentContainerStyle={styles.screenContent}
      header={<AppHeader accent={colors.mustard} eyebrow="FILA DE PRODUÇÃO" title="Cozinha" />}
      scroll={false}
    >
      <View style={styles.filters}>
        {filters.map((item) => {
          const selected = item.id === filter;
          const count = item.id === 'all'
            ? kitchenQuery.data?.length ?? 0
            : kitchenQuery.data?.filter((order) => order.status === item.id).length ?? 0;
          return (
            <Pressable
              key={item.id}
              onPress={() => setFilter(item.id)}
              style={[styles.filter, selected && styles.filterSelected]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item.label}</Text>
              <View style={[styles.filterCount, selected && styles.filterCountSelected]}>
                <Text style={[styles.filterCountText, selected && styles.filterCountTextSelected]}>{count}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {kitchenQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.mustard} size="large" />
          <Text style={styles.loadingText}>Sincronizando pedidos…</Text>
        </View>
      ) : kitchenQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>A fila não carregou.</Text>
          <Button label="Tentar novamente" onPress={() => void kitchenQuery.refetch()} variant="ghost" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={orders.length ? styles.list : styles.emptyList}
          data={orders}
          keyExtractor={(order) => order.id}
          ListEmptyComponent={
            <EmptyState
              accent={colors.sage}
              description="Novos pedidos aparecem aqui em tempo real, na ordem em que foram enviados."
              icon="solar:chef-hat-bold"
              title="Nenhum pedido na fila"
            />
          }
          refreshControl={
            <RefreshControl
              colors={[colors.mustard]}
              onRefresh={() => void kitchenQuery.refetch()}
              refreshing={kitchenQuery.isRefetching}
              tintColor={colors.mustard}
            />
          }
          renderItem={({ item }) => (
            <KitchenTicket
              loading={updatingOrderId === item.id}
              onAdvance={() => void handleAdvance(item)}
              order={item}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingBottom: 82 },
  filters: { flexDirection: 'row', gap: 6, marginBottom: spacing.lg },
  filter: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cream,
  },
  filterSelected: { borderColor: colors.ink, backgroundColor: colors.ink },
  filterText: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 9 },
  filterTextSelected: { color: colors.cream },
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  filterCountSelected: { backgroundColor: colors.tomato },
  filterCountText: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 8 },
  filterCountTextSelected: { color: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  errorTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 25 },
  list: { gap: spacing.lg, paddingBottom: spacing.xl },
  emptyList: { flexGrow: 1 },
  ticket: {
    position: 'relative',
    overflow: 'hidden',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cream,
    gap: spacing.lg,
    ...shadow.card,
  },
  readyTicket: { borderColor: colors.success, borderWidth: 2 },
  ticketStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 4 },
  tableNumber: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  tableLabel: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1 },
  tableValue: { color: colors.ink, fontFamily: fonts.display, fontSize: 32 },
  ticketMeta: { alignItems: 'flex-end', gap: 5 },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  statusText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 0.7 },
  time: { color: colors.muted, fontFamily: fonts.body, fontSize: 9 },
  divider: { height: 1, backgroundColor: colors.line },
  items: { gap: spacing.md },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  quantity: {
    width: 30,
    height: 30,
    borderRadius: 10,
    color: colors.cream,
    backgroundColor: colors.ink,
    fontFamily: fonts.display,
    fontSize: 16,
    lineHeight: 30,
    textAlign: 'center',
  },
  itemCopy: { flex: 1, gap: 4 },
  itemName: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 15 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  noteText: { flex: 1, color: colors.tomato, fontFamily: fonts.bodyBold, fontSize: 11 },
  orderNote: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, fontStyle: 'italic' },
  waitingPickup: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: '#E0EEDF',
  },
  waitingPickupText: { color: colors.success, fontFamily: fonts.bodyBold, fontSize: 12 },
});
