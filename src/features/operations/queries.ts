import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CloseSessionInput, SendOrderInput } from './types';
import {
  closeTableSession,
  getDiningTable,
  listCashierSessions,
  listDiningTables,
  listKitchenOrders,
  listMenu,
  openTableSession,
  sendOrder,
  updateOrderStatus,
} from './api';
import { OrderStatus } from '@/types/domain';

export const operationKeys = {
  all: ['operations'] as const,
  tables: ['operations', 'tables'] as const,
  table: (tableId: string) => ['operations', 'tables', tableId] as const,
  menu: ['operations', 'menu'] as const,
  kitchen: ['operations', 'kitchen'] as const,
  cashier: ['operations', 'cashier'] as const,
};

function useRefreshOperations() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: operationKeys.all });
}

export function useDiningTables() {
  return useQuery({ queryKey: operationKeys.tables, queryFn: listDiningTables });
}

export function useDiningTable(tableId: string) {
  return useQuery({
    queryKey: operationKeys.table(tableId),
    queryFn: () => getDiningTable(tableId),
    enabled: Boolean(tableId),
  });
}

export function useMenu() {
  return useQuery({ queryKey: operationKeys.menu, queryFn: listMenu, staleTime: 60_000 });
}

export function useKitchenOrders() {
  return useQuery({ queryKey: operationKeys.kitchen, queryFn: listKitchenOrders });
}

export function useCashierSessions() {
  return useQuery({ queryKey: operationKeys.cashier, queryFn: listCashierSessions });
}

export function useOpenTableSession() {
  const refresh = useRefreshOperations();
  return useMutation({
    mutationFn: ({ tableId, guestCount }: { tableId: string; guestCount: number }) =>
      openTableSession(tableId, guestCount),
    onSuccess: refresh,
  });
}

export function useSendOrder() {
  const refresh = useRefreshOperations();
  return useMutation({ mutationFn: (input: SendOrderInput) => sendOrder(input), onSuccess: refresh });
}

export function useUpdateOrderStatus() {
  const refresh = useRefreshOperations();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus(orderId, status),
    onSuccess: refresh,
  });
}

export function useCloseTableSession() {
  const refresh = useRefreshOperations();
  return useMutation({
    mutationFn: ({ sessionId, method }: CloseSessionInput) => closeTableSession(sessionId, method),
    onSuccess: refresh,
  });
}
