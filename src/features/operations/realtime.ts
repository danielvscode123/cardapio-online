import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';

import { operationKeys } from './queries';

const realtimeTables = ['dining_tables', 'table_sessions', 'orders', 'order_items', 'payments'] as const;

export function useOperationalRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let channel = supabase.channel('restaurant-operations');

    for (const table of realtimeTables) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => void queryClient.invalidateQueries({ queryKey: operationKeys.all }),
      );
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
