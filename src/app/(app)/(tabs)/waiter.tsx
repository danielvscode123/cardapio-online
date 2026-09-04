import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { TableCard } from '@/components/table-card';
import { Button } from '@/components/ui/button';
import { IconifyIcon } from '@/components/ui/iconify-icon';
import { Screen } from '@/components/ui/screen';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useDiningTables } from '@/features/operations/queries';

export default function WaiterScreen() {
  const router = useRouter();
  const tablesQuery = useDiningTables();
  const tables = tablesQuery.data ?? [];
  const occupied = tables.filter((table) => table.session).length;
  const ready = tables.reduce((sum, table) => sum + table.readyOrders, 0);

  return (
    <Screen
      contentContainerStyle={styles.screenContent}
      header={<AppHeader eyebrow="MAPA DO SALÃO" title="Mesas" />}
      scroll={false}
    >
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <IconifyIcon icon="solar:armchair-2-bold-duotone" size={22} color={colors.ink} />
          <View>
            <Text style={styles.summaryValue}>{occupied}/{tables.length}</Text>
            <Text style={styles.summaryLabel}>ocupadas</Text>
          </View>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <IconifyIcon icon="solar:bell-bing-bold" size={22} color={ready ? colors.tomato : colors.muted} />
          <View>
            <Text style={styles.summaryValue}>{ready}</Text>
            <Text style={styles.summaryLabel}>pedidos prontos</Text>
          </View>
        </View>
      </View>

      {tablesQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.tomato} size="large" />
          <Text style={styles.loadingText}>Montando o mapa do salão…</Text>
        </View>
      ) : tablesQuery.isError ? (
        <View style={styles.center}>
          <IconifyIcon icon="solar:cloud-cross-bold-duotone" size={46} color={colors.danger} />
          <Text style={styles.errorTitle}>Não foi possível carregar as mesas.</Text>
          <Text style={styles.errorText}>{tablesQuery.error.message}</Text>
          <Button label="Tentar novamente" onPress={() => void tablesQuery.refetch()} variant="ghost" />
        </View>
      ) : (
        <FlatList
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          data={tables}
          keyExtractor={(table) => table.id}
          numColumns={2}
          refreshControl={
            <RefreshControl
              colors={[colors.tomato]}
              onRefresh={() => void tablesQuery.refetch()}
              refreshing={tablesQuery.isRefetching}
              tintColor={colors.tomato}
            />
          }
          renderItem={({ item }) => (
            <TableCard
              onPress={() => router.push({ pathname: '/table/[tableId]', params: { tableId: item.id } })}
              table={item}
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
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 74,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
  },
  summaryItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryDivider: { width: 1, height: 34, marginHorizontal: spacing.md, backgroundColor: colors.inkSoft },
  summaryValue: { color: colors.cream, fontFamily: fonts.display, fontSize: 20, lineHeight: 22 },
  summaryLabel: { color: colors.sage, fontFamily: fonts.body, fontSize: 9 },
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  row: { gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  loadingText: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  errorTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 24, textAlign: 'center' },
  errorText: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, textAlign: 'center' },
});
