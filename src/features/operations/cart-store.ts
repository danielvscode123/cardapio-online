import { create } from 'zustand';

import { DraftOrderItem, MenuItem } from './types';

type OrderDraftState = {
  sessionId: string | null;
  items: Record<string, DraftOrderItem>;
  begin: (sessionId: string) => void;
  setQuantity: (item: MenuItem, quantity: number) => void;
  setNotes: (itemId: string, notes: string) => void;
  clear: () => void;
};

export const useOrderDraft = create<OrderDraftState>((set) => ({
  sessionId: null,
  items: {},
  begin: (sessionId) =>
    set((state) => (state.sessionId === sessionId ? state : { sessionId, items: {} })),
  setQuantity: (item, quantity) =>
    set((state) => {
      const items = { ...state.items };
      if (quantity <= 0) {
        delete items[item.id];
      } else {
        items[item.id] = {
          menuItem: item,
          quantity: Math.min(quantity, 99),
          notes: items[item.id]?.notes ?? '',
        };
      }
      return { items };
    }),
  setNotes: (itemId, notes) =>
    set((state) => ({
      items: state.items[itemId]
        ? { ...state.items, [itemId]: { ...state.items[itemId], notes } }
        : state.items,
    })),
  clear: () => set({ sessionId: null, items: {} }),
}));
