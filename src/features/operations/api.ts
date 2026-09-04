import { supabase } from '@/lib/supabase';
import { OrderStatus, PaymentMethod } from '@/types/domain';

import {
  CashierSession,
  DiningTable,
  KitchenOrder,
  MenuCategory,
  MenuItem,
  OpenSession,
  Order,
  SendOrderInput,
} from './types';

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function mapOrder(rawOrder: Record<string, unknown>): Order {
  return {
    id: String(rawOrder.id),
    table_session_id: String(rawOrder.table_session_id),
    status: rawOrder.status as OrderStatus,
    notes: (rawOrder.notes as string | null) ?? null,
    created_at: String(rawOrder.created_at),
    sent_at: String(rawOrder.sent_at),
    preparing_at: (rawOrder.preparing_at as string | null) ?? null,
    ready_at: (rawOrder.ready_at as string | null) ?? null,
    delivered_at: (rawOrder.delivered_at as string | null) ?? null,
    order_items: ((rawOrder.order_items as Record<string, unknown>[] | null) ?? []).map((item) => ({
      id: String(item.id),
      menu_item_id: (item.menu_item_id as string | null) ?? null,
      product_name: String(item.product_name),
      unit_price: toNumber(item.unit_price as number | string),
      quantity: toNumber(item.quantity as number | string),
      notes: (item.notes as string | null) ?? null,
      subtotal: toNumber(item.subtotal as number | string),
    })),
  };
}

export async function listDiningTables(): Promise<DiningTable[]> {
  const [{ data: tables, error: tablesError }, { data: sessions, error: sessionsError }] =
    await Promise.all([
      supabase
        .from('dining_tables')
        .select('id, number, label, seats, status, active')
        .eq('active', true)
        .order('number'),
      supabase
        .from('table_sessions')
        .select(`
          id,
          table_id,
          guest_count,
          notes,
          opened_at,
          orders (
            id,
            table_session_id,
            status,
            notes,
            created_at,
            sent_at,
            preparing_at,
            ready_at,
            delivered_at,
            order_items (
              id,
              menu_item_id,
              product_name,
              unit_price,
              quantity,
              notes,
              subtotal
            )
          ),
          payments (amount)
        `)
        .eq('status', 'open'),
    ]);

  throwIfError(tablesError);
  throwIfError(sessionsError);

  const sessionsByTable = new Map<string, OpenSession>();
  for (const rawSession of sessions ?? []) {
    const session = rawSession as unknown as Record<string, unknown>;
    sessionsByTable.set(String(session.table_id), {
      id: String(session.id),
      table_id: String(session.table_id),
      guest_count: toNumber(session.guest_count as number),
      notes: (session.notes as string | null) ?? null,
      opened_at: String(session.opened_at),
      orders: ((session.orders as Record<string, unknown>[] | null) ?? []).map(mapOrder),
      payments: ((session.payments as { amount: number | string }[] | null) ?? []).map((payment) => ({
        amount: toNumber(payment.amount),
      })),
    });
  }

  return (tables ?? []).map((table) => {
    const session = sessionsByTable.get(table.id) ?? null;
    const activeOrders = session?.orders.filter((order) => order.status !== 'cancelled') ?? [];
    const total = activeOrders.reduce(
      (sum, order) => sum + order.order_items.reduce((orderSum, item) => orderSum + item.subtotal, 0),
      0,
    );

    return {
      id: table.id,
      number: table.number,
      label: table.label,
      seats: table.seats,
      status: table.status,
      active: table.active,
      session,
      total,
      pendingOrders: activeOrders.filter((order) => ['sent', 'preparing'].includes(order.status)).length,
      readyOrders: activeOrders.filter((order) => order.status === 'ready').length,
    } as DiningTable;
  });
}

export async function getDiningTable(tableId: string) {
  const tables = await listDiningTables();
  const table = tables.find((item) => item.id === tableId);
  if (!table) {
    throw new Error('Mesa não encontrada.');
  }
  return table;
}

export async function openTableSession(tableId: string, guestCount: number) {
  const { data, error } = await supabase.rpc('open_table_session', {
    p_table_id: tableId,
    p_guest_count: guestCount,
  });
  throwIfError(error);
  return data as string;
}

export async function listMenu() {
  const [{ data: categories, error: categoriesError }, { data: items, error: itemsError }] =
    await Promise.all([
      supabase
        .from('menu_categories')
        .select('id, name, position')
        .eq('active', true)
        .order('position'),
      supabase
        .from('menu_items')
        .select('id, category_id, name, description, price, position, active, available')
        .eq('active', true)
        .order('position'),
    ]);

  throwIfError(categoriesError);
  throwIfError(itemsError);

  return {
    categories: (categories ?? []) as MenuCategory[],
    items: (items ?? []).map((item) => ({ ...item, price: toNumber(item.price) })) as MenuItem[],
  };
}

export async function sendOrder(input: SendOrderInput) {
  const { data, error } = await supabase.rpc('send_order', {
    p_table_session_id: input.sessionId,
    p_items: input.items.map((item) => ({
      menu_item_id: item.menuItem.id,
      quantity: item.quantity,
      notes: item.notes,
    })),
    p_notes: input.notes ?? null,
    p_idempotency_key: input.idempotencyKey,
  });
  throwIfError(error);
  return data as string;
}

export async function listKitchenOrders(): Promise<KitchenOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      table_session_id,
      status,
      notes,
      created_at,
      sent_at,
      preparing_at,
      ready_at,
      delivered_at,
      order_items (
        id,
        menu_item_id,
        product_name,
        unit_price,
        quantity,
        notes,
        subtotal
      ),
      table_sessions!inner (
        dining_tables!inner (number)
      )
    `)
    .in('status', ['sent', 'preparing', 'ready'])
    .order('created_at');

  throwIfError(error);

  return (data ?? []).map((raw) => {
    const record = raw as unknown as Record<string, unknown>;
    const tableSession = record.table_sessions as { dining_tables: { number: number } };
    return {
      ...mapOrder(record),
      tableNumber: tableSession.dining_tables.number,
    };
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { data, error } = await supabase.rpc('set_order_status', {
    p_order_id: orderId,
    p_status: status,
  });
  throwIfError(error);
  return data;
}

export async function listCashierSessions(): Promise<CashierSession[]> {
  const tables = await listDiningTables();
  return tables
    .filter((table) => table.session)
    .map((table) => {
      const session = table.session!;
      const paid = session.payments.reduce((sum, payment) => sum + payment.amount, 0);
      return {
        ...session,
        tableNumber: table.number,
        tableLabel: table.label,
        total: table.total,
        paid,
        balance: Math.max(table.total - paid, 0),
      };
    });
}

export async function closeTableSession(sessionId: string, method: PaymentMethod) {
  const { data, error } = await supabase.rpc('close_table_session', {
    p_table_session_id: sessionId,
    p_payment_method: method,
  });
  throwIfError(error);
  return toNumber(data as number | string);
}
