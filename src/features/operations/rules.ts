import { Order } from './types';

export function calculateOrderTotal(order: Order) {
  return order.order_items.reduce((sum, item) => sum + item.subtotal, 0);
}

export function calculateSessionTotal(orders: Order[]) {
  return orders
    .filter((order) => order.status !== 'cancelled')
    .reduce((sum, order) => sum + calculateOrderTotal(order), 0);
}

export function countSessionItems(orders: Order[]) {
  return orders
    .filter((order) => order.status !== 'cancelled')
    .reduce(
      (sum, order) => sum + order.order_items.reduce((orderSum, item) => orderSum + item.quantity, 0),
      0,
    );
}

export function getNextKitchenStatus(status: Order['status']) {
  if (status === 'sent') return 'preparing' as const;
  if (status === 'preparing') return 'ready' as const;
  return null;
}
