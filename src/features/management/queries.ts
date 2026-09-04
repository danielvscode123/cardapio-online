import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createEmployee, deleteEmployee, listEmployees, setEmployeeActive, updateEmployee } from './api';
import { CreateEmployeeInput, Employee, UpdateEmployeeInput } from './types';

const employeeKey = ['management', 'employees'] as const;

export function useEmployees() {
  return useQuery({ queryKey: employeeKey, queryFn: listEmployees });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => createEmployee(input),
    onSuccess: (created) => {
      queryClient.setQueryData<Employee[]>(employeeKey, (employees = []) =>
        [...employees, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      return queryClient.invalidateQueries({ queryKey: employeeKey });
    },
  });
}

export function useSetEmployeeActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) => setEmployeeActive(userId, active),
    onSuccess: ({ id, active }) => {
      queryClient.setQueryData<Employee[]>(employeeKey, (employees = []) =>
        employees.map((employee) => employee.id === id ? { ...employee, active } : employee),
      );
      return queryClient.invalidateQueries({ queryKey: employeeKey });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateEmployeeInput) => updateEmployee(input),
    onSuccess: (updated) => {
      queryClient.setQueryData<Employee[]>(employeeKey, (employees = []) =>
        employees
          .map((employee) => employee.id === updated.id ? updated : employee)
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      return queryClient.invalidateQueries({ queryKey: employeeKey });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteEmployee(userId),
    onSuccess: ({ id }) => {
      queryClient.setQueryData<Employee[]>(employeeKey, (employees = []) =>
        employees.filter((employee) => employee.id !== id),
      );
      return queryClient.invalidateQueries({ queryKey: employeeKey });
    },
  });
}
