import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { IconifyIcon } from '@/components/ui/iconify-icon';
import { Screen } from '@/components/ui/screen';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import {
  useDiningTable,
  useOpenTableSession,
  useUpdateOrderStatus,
} from '@/features/operations/queries';
import { Order } from '@/features/operations/types';
import { formatCurrency, formatTime } from '@/lib/format';
import { OrderStatus } from '@/types/domain';

const statusLabels: Record<OrderStatus, string> = {
  sent: 'Enviado',
  preparing: 'Em preparo',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const statusColors: Record<OrderStatus, string> = {
  sent: colors.mustard,
  preparing: '#D99A45',
  ready: colors.success,
  delivered: colors.inkSoft,
  cancelled: colors.danger,
};

function DetailHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.headerButton}>
        <IconifyIcon icon="solar:arrow-left-linear" size={22} color={colors.ink} />
      </Pressable>
      <View style={styles.headerCopy}>
        <Text style={styles.headerEyebrow}>COMANDA</Text>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.headerButton} />
    </View>
  );
}

function OrderCard({ order, onDeliver }: { order: Order; onDeliver: () => void }) {
  return (
    <View style={[styles.orderCard, order.status === 'ready' && styles.orderReady]}>
      <View style={styles.orderTop}>
        <View>
          <Text style={styles.orderTime}>PEDIDO · {formatTime(order.sent_at)}</Text>
          <Text style={styles.orderItemsCount}>
            {order.order_items.reduce((sum, item) => sum + item.quantity, 0)} itens
          </Text>
        </View>
        <View style={[styles.orderStatus, { backgroundColor: statusColors[order.status] }]}>
          <Text style={styles.orderStatusText}>{statusLabels[order.status]}</Text>
        </View>
      </View>

      <View style={styles.itemList}>
        {order.order_items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemQuantity}>{item.quantity}×</Text>
            <View style={styles.itemCopy}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              {item.notes ? <Text style={styles.itemNotes}>{item.notes}</Text> : null}
            </View>
            <Text style={styles.itemPrice}>{formatCurrency(item.subtotal)}</Text>
          </View>
        ))}
      </View>

      {order.status === 'ready' ? (
        <Button icon="solar:check-circle-bold" label="Marcar como entregue" onPress={onDeliver} />
      ) : null}
    </View>
  );
}

export default function TableDetailsScreen() {
  const params = useLocalSearchParams<{ tableId: string }>();
  const router = useRouter();
  const tableId = Array.isArray(params.tableId) ? params.tableId[0] : params.tableId;
  const tableQuery = useDiningTable(tableId);
  const openSession = useOpenTableSession();
  const updateStatus = useUpdateOrderStatus();
  const [guestCount, setGuestCount] = useState(2);
  const table = tableQuery.data;

  const handleOpen = async () => {
    try {
      const sessionId = await openSession.mutateAsync({ tableId, guestCount });
      await tableQuery.refetch();
      router.push({ pathname: '/order/[sessionId]', params: { sessionId, tableNumber: table?.number } });
    } catch (error) {
      Alert.alert('Não foi possível abrir a mesa', error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  const handleDeliver = async (orderId: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: 'delivered' });
      await tableQuery.refetch();
    } catch (error) {
      Alert.alert('Não foi possível atualizar o pedido', error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  if (tableQuery.isError) {
    return (
      <Screen header={<DetailHeader title="Mesa" />} scroll={false}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>A comanda não carregou.</Text>
          <Button label="Tentar novamente" onPress={() => void tableQuery.refetch()} variant="ghost" />
        </View>
      </Screen>
    );
  }

  if (tableQuery.isLoading || !table) {
    return (
      <Screen header={<DetailHeader title="Carregando" />} scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.tomato} size="large" />
        </View>
      </Screen>
    );
  }

  if (!table.session) {
    return (
      <Screen header={<DetailHeader title={`Mesa ${table.number}`} />}>
        <View style={styles.availableHero}>
          <View style={styles.availableIcon}>
            <IconifyIcon icon="solar:armchair-2-bold-duotone" size={48} color={colors.ink} />
          </View>
          <Text style={styles.availableEyebrow}>MESA LIVRE</Text>
          <Text style={styles.availableTitle}>Receber novos clientes</Text>
          <Text style={styles.availableText}>Abra um atendimento antes de começar o primeiro pedido.</Text>
        </View>

        <View style={styles.guestCard}>
          <View>
            <Text style={styles.guestLabel}>QUANTAS PESSOAS?</Text>
            <Text style={styles.guestHint}>Ajuda a equipe a acompanhar o salão.</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable
              accessibilityLabel="Diminuir pessoas"
              disabled={guestCount <= 1}
              onPress={() => setGuestCount((value) => Math.max(1, value - 1))}
              style={styles.stepButton}
            >
              <IconifyIcon icon="solar:minus-circle-bold" size={25} color={colors.ink} />
            </Pressable>
            <Text style={styles.guestCount}>{guestCount}</Text>
            <Pressable
              accessibilityLabel="Aumentar pessoas"
              onPress={() => setGuestCount((value) => Math.min(99, value + 1))}
              style={styles.stepButton}
            >
              <IconifyIcon icon="solar:add-circle-bold" size={25} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        <Button
          icon="solar:play-circle-bold"
          label="Abrir atendimento e pedir"
          loading={openSession.isPending}
          onPress={() => void handleOpen()}
        />
      </Screen>
    );
  }

  return (
    <Screen header={<DetailHeader title={`Mesa ${table.number}`} />}>
      <View style={styles.sessionHero}>
        <View>
          <Text style={styles.sessionEyebrow}>TOTAL DA COMANDA</Text>
          <Text style={styles.sessionTotal}>{formatCurrency(table.total)}</Text>
        </View>
        <View style={styles.guestBadge}>
          <IconifyIcon icon="solar:users-group-rounded-bold" size={19} color={colors.cream} />
          <Text style={styles.guestBadgeText}>{table.session.guest_count}</Text>
        </View>
      </View>

      <Button
        icon="solar:add-square-bold"
        label="Adicionar novo pedido"
        onPress={() =>
          router.push({
            pathname: '/order/[sessionId]',
            params: { sessionId: table.session!.id, tableNumber: table.number },
          })
        }
      />

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Pedidos da mesa</Text>
        <Text style={styles.sectionCount}>{table.session.orders.length}</Text>
      </View>

      <View style={styles.orders}>
        {table.session.orders.length ? (
          [...table.session.orders]
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .map((order) => (
              <OrderCard key={order.id} onDeliver={() => void handleDeliver(order.id)} order={order} />
            ))
        ) : (
          <View style={styles.noOrders}>
            <Text style={styles.noOrdersText}>Nenhum pedido enviado nesta comanda.</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerEyebrow: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.3 },
  headerTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 24 },
  center: { minHeight: 420, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  errorTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 25 },
  availableHero: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.sm },
  availableIcon: {
    width: 92,
    height: 92,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9E8D5',
    transform: [{ rotate: '-4deg' }],
  },
  availableEyebrow: { color: colors.success, fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.5 },
  availableTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 32, textAlign: 'center' },
  availableText: {
    maxWidth: 330,
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  guestCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
    gap: spacing.lg,
  },
  guestLabel: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1 },
  guestHint: { marginTop: 3, color: colors.muted, fontFamily: fonts.body, fontSize: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepButton: {
    width: 52,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
  },
  guestCount: { color: colors.ink, fontFamily: fonts.display, fontSize: 35 },
  sessionHero: {
    marginBottom: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionEyebrow: { color: colors.sage, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.4 },
  sessionTotal: { marginTop: 3, color: colors.cream, fontFamily: fonts.display, fontSize: 36 },
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.inkSoft,
  },
  guestBadgeText: { color: colors.cream, fontFamily: fonts.bodyBold, fontSize: 13 },
  sectionHeading: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 24 },
  sectionCount: {
    minWidth: 25,
    height: 25,
    borderRadius: 13,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: colors.mustard,
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },
  orders: { gap: spacing.md },
  orderCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cream,
    gap: spacing.lg,
  },
  orderReady: { borderColor: colors.success, borderWidth: 2 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTime: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1 },
  orderItemsCount: { color: colors.ink, fontFamily: fonts.display, fontSize: 20 },
  orderStatus: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.pill },
  orderStatusText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 10 },
  itemList: { gap: spacing.md },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  itemQuantity: { width: 28, color: colors.tomato, fontFamily: fonts.bodyBold, fontSize: 13 },
  itemCopy: { flex: 1 },
  itemName: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 13 },
  itemNotes: { marginTop: 2, color: colors.muted, fontFamily: fonts.body, fontSize: 11 },
  itemPrice: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 12 },
  noOrders: { padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.cream },
  noOrdersText: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
});
