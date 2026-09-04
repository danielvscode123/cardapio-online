export type UserRole = 'employee' | 'manager';
export type TableStatus = 'available' | 'occupied';
export type SessionStatus = 'open' | 'closed' | 'cancelled';
export type OrderStatus = 'sent' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'pix' | 'credit' | 'debit' | 'other';

export type Profile = {
  id: string;
  restaurant_id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
};
