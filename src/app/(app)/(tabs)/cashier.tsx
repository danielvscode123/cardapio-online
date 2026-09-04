import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { IconifyIcon } from '@/components/ui/iconify-icon';
import { Screen } from '@/components/ui/screen';
import { colors, fonts, radius, shadow, spacing } from '@/constants/theme';
import { useCashierSessions, useCloseTableSession } from '@/features/operations/queries';
import { countSessionItems } from '@/features/operations/rules';
import { CashierSession } from '@/features/operations/types';
import { formatCurrency, formatTime } from '@/lib/format';
import { PaymentMethod } from '@/types/domain';

const paymentMethods: { id: PaymentMethod; label: string; icon: `${string}:${string}` }[] = [
  { id: 'pix', label: 'Pix', icon: 'solar:transfer-horizontal-bold-duotone' },
  { id: 'credit', label: 'Crédito', icon: 'solar:card-bold-duotone' },
  { id: 'debit', label: 'Débito', icon: 'solar:card-2-bold-duotone' },
  { id: 'cash', label: 'Dinheiro', icon: 'solar:wad-of-money-bold-duotone' },
  { id: 'other', label: 'Outro', icon: 'solar:wallet-money-bold-duotone' },
];

type CheckoutCardProps = {
  session: CashierSession;
  expanded: boolean;
  selectedMethod: PaymentMethod;
  loading: boolean;
  onExpand: () => void;
  onMethodChange: (method: PaymentMethod) => void;
  onPay: () => void;
};

function CheckoutCard({
  session,
  expanded,
  selectedMethod,
  loading,
  onExpand,
  onMethodChange,
  onPay,
}: CheckoutCardProps) {
  const itemCount = countSessionItems(session.orders);
  const pendingOrders = session.orders.filter((order) => ['sent', 'preparing'].includes(order.status)).length;

  return (
    <View style={[styles.card, expanded && styles.cardExpanded]}>
      <View style={styles.cardHeader}>
        <View style={styles.tableStamp}>
          <Text style={styles.tableEyebrow}>MESA</Text>
          <Text style={styles.tableNumber}>{session.tableNumber}</Text>
        </View>
        <View style={styles.totalBlock}>
          <Text style={styles.totalEyebrow}>TOTAL A RECEBER</Text>
          <Text style={styles.total}>{formatCurrency(session.balance)}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <IconifyIcon icon="solar:users-group-rounded-linear" size={16} color={colors.muted} />
          <Text style={styles.metaText}>{session.guest_count} pessoas</Text>
        </View>
        <View style={styles.metaItem}>
          <IconifyIcon icon="solar:bill-list-linear" size={16} color={colors.muted} />
          <Text style={styles.metaText}>{itemCount} itens</Text>
        </View>
        <View style={styles.metaItem}>
          <IconifyIcon icon="solar:clock-circle-linear" size={16} color={colors.muted} />
          <Text style={styles.metaText}>desde {formatTime(session.opened_at)}</Text>
        </View>
      </View>

      {pendingOrders > 0 ? (
        <View style={styles.pendingNotice}>
          <IconifyIcon icon="solar:clock-circle-bold-duotone" size={20} color={colors.ink} />
          <Text style={styles.pendingNoticeText}>
            {pendingOrders === 1 ? '1 pedido ainda está em produção.' : `${pendingOrders} pedidos ainda estão em produção.`}
          </Text>
        </View>
      ) : null}

      {expanded ? (
        <View style={styles.checkoutPanel}>
          <Text style={styles.paymentLabel}>FORMA DE PAGAMENTO</Text>
          <View style={styles.paymentGrid}>
            {paymentMethods.map((method) => {
              const selected = method.id === selectedMethod;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={method.id}
                  onPress={() => onMethodChange(method.id)}
                  style={[styles.method, selected && styles.methodSelected]}
                >
                  <IconifyIcon
                    color={selected ? colors.cream : colors.ink}
                    icon={method.icon}
                    size={21}
                  />
                  <Text style={[styles.methodText, selected && styles.methodTextSelected]}>{method.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.receiptLine} />
          <View style={styles.confirmRow}>
            <View>
              <Text style={styles.confirmLabel}>VALOR FINAL</Text>
              <Text style={styles.confirmValue}>{formatCurrency(session.balance)}</Text>
            </View>
            <Button
              disabled={pendingOrders > 0}
              icon="solar:check-circle-bold"
              label="Confirmar"
              loading={loading}
              onPress={onPay}
              style={styles.confirmButton}
            />
          </View>
        </View>
      ) : (
        <Button
          disabled={pendingOrders > 0}
          icon="solar:wallet-money-bold-duotone"
          label="Receber e liberar mesa"
          onPress={onExpand}
          variant="secondary"
        />
      )}
    </View>
  );
}

export default function CashierScreen() {
  const cashierQuery = useCashierSessions();
  const closeSession = useCloseTableSession();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');
  const [closingId, setClosingId] = useState<string | null>(null);

  const handlePay = (session: CashierSession) => {
    const paymentLabel = paymentMethods.find((method) => method.id === selectedMethod)?.label;
    Alert.alert(
      'Confirmar pagamento',
      `${formatCurrency(session.balance)} em ${paymentLabel}. A Mesa ${session.tableNumber} será liberada.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setClosingId(session.id);
            try {
              await closeSession.mutateAsync({ sessionId: session.id, method: selectedMethod });
              setExpandedId(null);
              Alert.alert('Pagamento concluído', `A Mesa ${session.tableNumber} está livre para um novo atendimento.`);
            } catch (error) {
              Alert.alert('Não foi possível fechar', error instanceof Error ? error.message : 'Tente novamente.');
            } finally {
              setClosingId(null);
            }
          },
        },
      ],
    );
  };

  const sessions = cashierQuery.data ?? [];
  const outstanding = sessions.reduce((sum, session) => sum + session.balance, 0);

  return (
    <Screen
      contentContainerStyle={styles.screenContent}
      header={<AppHeader accent={colors.success} eyebrow="FECHAMENTO" title="Caixa" />}
      scroll={false}
    >
      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryEyebrow}>EM ABERTO AGORA</Text>
          <Text style={styles.summaryValue}>{formatCurrency(outstanding)}</Text>
        </View>
        <View style={styles.summaryCount}>
          <Text style={styles.summaryCountValue}>{sessions.length}</Text>
          <Text style={styles.summaryCountLabel}>MESAS</Text>
        </View>
      </View>

      {cashierQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.success} size="large" />
          <Text style={styles.loadingText}>Conferindo comandas…</Text>
        </View>
      ) : cashierQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>As comandas não carregaram.</Text>
          <Button label="Tentar novamente" onPress={() => void cashierQuery.refetch()} variant="ghost" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={sessions.length ? styles.list : styles.emptyList}
          data={sessions}
          keyExtractor={(session) => session.id}
          ListEmptyComponent={
            <EmptyState
              accent="#BFDCCF"
              description="Mesas ocupadas e seus totais aparecem aqui para receber e liberar a comanda."
              icon="solar:wallet-money-bold-duotone"
              title="Nenhuma conta aguardando"
            />
          }
          refreshControl={
            <RefreshControl
              colors={[colors.success]}
              onRefresh={() => void cashierQuery.refetch()}
              refreshing={cashierQuery.isRefetching}
              tintColor={colors.success}
            />
          }
          renderItem={({ item }) => (
            <CheckoutCard
              expanded={expandedId === item.id}
              loading={closingId === item.id}
              onExpand={() => {
                setExpandedId(item.id);
                setSelectedMethod('pix');
              }}
              onMethodChange={setSelectedMethod}
              onPay={() => handlePay(item)}
              selectedMethod={selectedMethod}
              session={item}
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
  summary: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryEyebrow: { color: colors.sage, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.3 },
  summaryValue: { marginTop: 3, color: colors.cream, fontFamily: fonts.display, fontSize: 30 },
  summaryCount: { alignItems: 'center', paddingHorizontal: spacing.md },
  summaryCountValue: { color: colors.mustard, fontFamily: fonts.display, fontSize: 28 },
  summaryCountLabel: { color: colors.sage, fontFamily: fonts.bodyBold, fontSize: 8, letterSpacing: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  errorTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 25 },
  list: { gap: spacing.lg, paddingBottom: spacing.xl },
  emptyList: { flexGrow: 1 },
  card: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
    gap: spacing.lg,
    ...shadow.card,
  },
  cardExpanded: { borderColor: colors.success, borderWidth: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  tableStamp: {
    width: 70,
    height: 70,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mustard,
    transform: [{ rotate: '-2deg' }],
  },
  tableEyebrow: { color: colors.inkSoft, fontFamily: fonts.bodyBold, fontSize: 8, letterSpacing: 1 },
  tableNumber: { color: colors.ink, fontFamily: fonts.display, fontSize: 30, lineHeight: 33 },
  totalBlock: { flex: 1, alignItems: 'flex-end' },
  totalEyebrow: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 8, letterSpacing: 1.1 },
  total: { color: colors.ink, fontFamily: fonts.display, fontSize: 29 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: colors.muted, fontFamily: fonts.body, fontSize: 10 },
  pendingNotice: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#F2DFA8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pendingNoticeText: { flex: 1, color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 11 },
  checkoutPanel: { gap: spacing.lg },
  paymentLabel: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.2 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  method: {
    minWidth: '30%',
    flexGrow: 1,
    minHeight: 67,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.canvas,
  },
  methodSelected: { borderColor: colors.ink, backgroundColor: colors.ink },
  methodText: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 10 },
  methodTextSelected: { color: colors.cream },
  receiptLine: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.line },
  confirmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  confirmLabel: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 8, letterSpacing: 1 },
  confirmValue: { color: colors.success, fontFamily: fonts.display, fontSize: 24 },
  confirmButton: { minWidth: 140 },
});
