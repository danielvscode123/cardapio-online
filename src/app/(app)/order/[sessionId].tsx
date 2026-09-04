import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { IconifyIcon } from '@/components/ui/iconify-icon';
import { Screen } from '@/components/ui/screen';
import { colors, fonts, radius, shadow, spacing } from '@/constants/theme';
import { useOrderDraft } from '@/features/operations/cart-store';
import { useMenu, useSendOrder } from '@/features/operations/queries';
import { MenuItem } from '@/features/operations/types';
import { formatCurrency } from '@/lib/format';

function OrderHeader({ tableNumber }: { tableNumber?: string }) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.headerButton}>
        <IconifyIcon icon="solar:arrow-left-linear" size={22} color={colors.ink} />
      </Pressable>
      <View style={styles.headerCopy}>
        <Text style={styles.headerEyebrow}>NOVO PEDIDO</Text>
        <Text style={styles.headerTitle}>Mesa {tableNumber ?? '—'}</Text>
      </View>
      <View style={styles.headerButton}>
        <IconifyIcon icon="solar:cart-large-2-bold-duotone" size={22} color={colors.ink} />
      </View>
    </View>
  );
}

function MenuItemCard({ item }: { item: MenuItem }) {
  const draft = useOrderDraft((state) => state.items[item.id]);
  const setQuantity = useOrderDraft((state) => state.setQuantity);
  const setNotes = useOrderDraft((state) => state.setNotes);
  const quantity = draft?.quantity ?? 0;

  return (
    <View style={[styles.menuCard, !item.available && styles.unavailableCard]}>
      <View style={styles.menuCardTop}>
        <View style={styles.menuCopy}>
          <View style={styles.menuNameRow}>
            <Text style={styles.menuName}>{item.name}</Text>
            {!item.available ? <Text style={styles.unavailableLabel}>INDISPONÍVEL</Text> : null}
          </View>
          {item.description ? <Text style={styles.menuDescription}>{item.description}</Text> : null}
          <Text style={styles.menuPrice}>{formatCurrency(item.price)}</Text>
        </View>

        {quantity === 0 ? (
          <Pressable
            accessibilityLabel={`Adicionar ${item.name}`}
            disabled={!item.available}
            onPress={() => setQuantity(item, 1)}
            style={styles.addButton}
          >
            <IconifyIcon icon="solar:add-circle-bold" size={30} color={item.available ? colors.tomato : colors.muted} />
          </Pressable>
        ) : (
          <View style={styles.quantityControl}>
            <Pressable accessibilityLabel={`Remover ${item.name}`} onPress={() => setQuantity(item, quantity - 1)}>
              <IconifyIcon icon="solar:minus-circle-bold" size={27} color={colors.ink} />
            </Pressable>
            <Text style={styles.quantity}>{quantity}</Text>
            <Pressable accessibilityLabel={`Adicionar ${item.name}`} onPress={() => setQuantity(item, quantity + 1)}>
              <IconifyIcon icon="solar:add-circle-bold" size={27} color={colors.tomato} />
            </Pressable>
          </View>
        )}
      </View>

      {quantity > 0 ? (
        <View style={styles.notesRow}>
          <IconifyIcon icon="solar:notes-linear" size={18} color={colors.muted} />
          <TextInput
            onChangeText={(text) => setNotes(item.id, text)}
            placeholder="Observação: sem cebola, ponto da carne…"
            placeholderTextColor={colors.muted}
            style={styles.notesInput}
            value={draft?.notes ?? ''}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function NewOrderScreen() {
  const params = useLocalSearchParams<{ sessionId: string; tableNumber?: string }>();
  const router = useRouter();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const tableNumber = Array.isArray(params.tableNumber) ? params.tableNumber[0] : params.tableNumber;
  const menuQuery = useMenu();
  const sendOrder = useSendOrder();
  const beginDraft = useOrderDraft((state) => state.begin);
  const clearDraft = useOrderDraft((state) => state.clear);
  const draftItems = useOrderDraft((state) => state.items);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    beginDraft(sessionId);
  }, [beginDraft, sessionId]);

  const selectedItems = useMemo(() => Object.values(draftItems), [draftItems]);
  const itemCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = selectedItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const activeCategory = selectedCategory ?? menuQuery.data?.categories[0]?.id ?? null;
  const visibleItems =
    menuQuery.data?.items.filter((item) => !activeCategory || item.category_id === activeCategory) ?? [];

  const handleSend = async () => {
    try {
      await sendOrder.mutateAsync({
        sessionId,
        idempotencyKey: Crypto.randomUUID(),
        items: selectedItems,
      });
      clearDraft();
      Alert.alert('Pedido enviado', 'A cozinha já recebeu este pedido.', [
        { text: 'Voltar à mesa', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Não foi possível enviar', error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  return (
    <View style={styles.page}>
      <Screen
        contentContainerStyle={itemCount > 0 ? styles.contentWithFooter : undefined}
        header={<OrderHeader tableNumber={tableNumber} />}
      >
        {menuQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.tomato} size="large" />
            <Text style={styles.loadingText}>Abrindo o cardápio…</Text>
          </View>
        ) : menuQuery.isError ? (
          <View style={styles.center}>
            <Text style={styles.errorTitle}>O cardápio não carregou.</Text>
            <Button label="Tentar novamente" onPress={() => void menuQuery.refetch()} variant="ghost" />
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={styles.categories}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {menuQuery.data?.categories.map((category) => {
                const selected = category.id === activeCategory;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    style={[styles.category, selected && styles.categorySelected]}
                  >
                    <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionEyebrow}>ESCOLHA OS ITENS</Text>
              <Text style={styles.sectionTitle}>
                {menuQuery.data?.categories.find((category) => category.id === activeCategory)?.name ?? 'Cardápio'}
              </Text>
            </View>

            <View style={styles.menuList}>
              {visibleItems.map((item) => <MenuItemCard item={item} key={item.id} />)}
            </View>
          </>
        )}
      </Screen>

      {itemCount > 0 ? (
        <SafeAreaView edges={['bottom']} style={styles.cartBar}>
          <View style={styles.cartSummary}>
            <View style={styles.cartCount}>
              <Text style={styles.cartCountText}>{itemCount}</Text>
            </View>
            <View>
              <Text style={styles.cartLabel}>TOTAL DO PEDIDO</Text>
              <Text style={styles.cartTotal}>{formatCurrency(total)}</Text>
            </View>
          </View>
          <Button
            icon="solar:plain-2-bold"
            label="Enviar"
            loading={sendOrder.isPending}
            onPress={() => void handleSend()}
            style={styles.sendButton}
          />
        </SafeAreaView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
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
  headerEyebrow: { color: colors.tomato, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.3 },
  headerTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 24 },
  contentWithFooter: { paddingBottom: 184 },
  center: { minHeight: 420, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  errorTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 25 },
  categories: { gap: spacing.sm, paddingBottom: spacing.xl },
  category: {
    minHeight: 42,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
  },
  categorySelected: { borderColor: colors.ink, backgroundColor: colors.ink },
  categoryText: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 12 },
  categoryTextSelected: { color: colors.cream },
  sectionHeading: { marginBottom: spacing.lg },
  sectionEyebrow: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.4 },
  sectionTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 31, letterSpacing: -0.8 },
  menuList: { gap: spacing.md },
  menuCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
    gap: spacing.md,
    ...shadow.card,
  },
  unavailableCard: { opacity: 0.55 },
  menuCardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuCopy: { flex: 1, gap: 4 },
  menuNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  menuName: { flexShrink: 1, color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 16 },
  unavailableLabel: { color: colors.danger, fontFamily: fonts.bodyBold, fontSize: 7, letterSpacing: 0.7 },
  menuDescription: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  menuPrice: { marginTop: 3, color: colors.tomato, fontFamily: fonts.display, fontSize: 18 },
  addButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  quantity: { minWidth: 22, color: colors.ink, fontFamily: fonts.display, fontSize: 20, textAlign: 'center' },
  notesRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
  },
  notesInput: { flex: 1, color: colors.ink, fontFamily: fonts.body, fontSize: 12 },
  cartBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 100,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.ink,
  },
  cartSummary: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cartCount: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mustard,
  },
  cartCountText: { color: colors.ink, fontFamily: fonts.display, fontSize: 18 },
  cartLabel: { color: colors.sage, fontFamily: fonts.bodyBold, fontSize: 8, letterSpacing: 1.2 },
  cartTotal: { color: colors.cream, fontFamily: fonts.display, fontSize: 22 },
  sendButton: { minWidth: 122 },
});
