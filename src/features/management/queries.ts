import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createEmployee, listEmployees, setEmployeeActive } from './api';
import { CreateEmployeeInput } from './types';

const employeeKey = ['management', 'employees'] as const;

export function useEmployees() {
  return useQuery({ queryKey: employeeKey, queryFn: listEmployees });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => createEmployee(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKey }),
  });
}

export function useSetEmployeeActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) => setEmployeeActive(userId, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKey }),
  });
}
