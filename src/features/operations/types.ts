import { OrderStatus, PaymentMethod, TableStatus } from '@/types/domain';

export type MenuCategory = {
  id: string;
  name: string;
  position: number;
};

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  position: number;
  active: boolean;
  available: boolean;
};

export type OrderItem = {
  id: string;
  menu_item_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  notes: string | null;
  subtotal: number;
};

export type Order = {
  id: string;
  table_session_id: string;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  sent_at: string;
  preparing_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
  order_items: OrderItem[];
};

export type OpenSession = {
  id: string;
  table_id: string;
  guest_count: number;
  notes: string | null;
  opened_at: string;
  orders: Order[];
  payments: { amount: number }[];
};

export type DiningTable = {
  id: string;
  number: number;
  label: string | null;
  seats: number;
  status: TableStatus;
  active: boolean;
  session: OpenSession | null;
  total: number;
  pendingOrders: number;
  readyOrders: number;
};

export type KitchenOrder = Order & {
  tableNumber: number;
};

export type CashierSession = OpenSession & {
  tableNumber: number;
  tableLabel: string | null;
  total: number;
  paid: number;
  balance: number;
};

export type DraftOrderItem = {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
};

export type SendOrderInput = {
  sessionId: string;
  notes?: string;
  idempotencyKey: string;
  items: DraftOrderItem[];
};

export type CloseSessionInput = {
  sessionId: string;
  method: PaymentMethod;
};
