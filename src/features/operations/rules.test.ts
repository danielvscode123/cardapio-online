import { describe, expect, it } from 'vitest';

import { Order } from './types';
import {
  calculateOrderTotal,
  calculateSessionTotal,
  countSessionItems,
  getNextKitchenStatus,
} from './rules';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    table_session_id: 'session-1',
    status: 'sent',
    notes: null,
    created_at: '2026-09-04T12:00:00Z',
    sent_at: '2026-09-04T12:00:00Z',
    preparing_at: null,
    ready_at: null,
    delivered_at: null,
    order_items: [
      {
        id: 'item-1',
        menu_item_id: 'menu-1',
        product_name: 'Hambúrguer',
        unit_price: 25,
        quantity: 2,
        notes: null,
        subtotal: 50,
      },
    ],
    ...overrides,
  };
}

describe('regras da comanda', () => {
  it('soma o subtotal dos itens de um pedido', () => {
    const order = makeOrder({
      order_items: [
        { ...makeOrder().order_items[0], subtotal: 50 },
        { ...makeOrder().order_items[0], id: 'item-2', subtotal: 12 },
      ],
    });

    expect(calculateOrderTotal(order)).toBe(62);
  });

  it('ignora pedidos cancelados no total e na contagem', () => {
    const active = makeOrder();
    const cancelled = makeOrder({ id: 'order-2', status: 'cancelled' });

    expect(calculateSessionTotal([active, cancelled])).toBe(50);
    expect(countSessionItems([active, cancelled])).toBe(2);
  });
});

describe('fluxo da cozinha', () => {
  it('avança recebido para preparo e preparo para pronto', () => {
    expect(getNextKitchenStatus('sent')).toBe('preparing');
    expect(getNextKitchenStatus('preparing')).toBe('ready');
  });

  it('não avança pedidos já finalizados', () => {
    expect(getNextKitchenStatus('ready')).toBeNull();
    expect(getNextKitchenStatus('delivered')).toBeNull();
    expect(getNextKitchenStatus('cancelled')).toBeNull();
  });
});
