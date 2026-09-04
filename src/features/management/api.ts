import { supabase } from '@/lib/supabase';

import { CreateEmployeeInput, Employee, UpdateEmployeeInput } from './types';

type FunctionError = { error?: string };

async function functionErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: { json?: () => Promise<unknown> } }).context;

    if (context && typeof context.json === 'function') {
      try {
        const payload = (await context.json()) as FunctionError;
        if (payload?.error) return payload.error;
      } catch {
        // The response did not contain JSON, so use the SDK message below.
      }
    }
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

async function invokeEmployeeAction<T>(body: object, fallback: string): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T & FunctionError>('manage-employee', { body });

  if (error) throw new Error(await functionErrorMessage(error, fallback));
  if (!data || data.error) throw new Error(data?.error ?? fallback);
  return data;
}

export async function listEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, active')
    .eq('role', 'employee')
    .is('deleted_at', null)
    .order('name');

  if (error) throw new Error(error.message);
  return (data ?? []) as Employee[];
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  return invokeEmployeeAction<Employee>({ action: 'create', ...input }, 'Não foi possível criar o funcionário.');
}

export async function setEmployeeActive(userId: string, active: boolean) {
  return invokeEmployeeAction<{ id: string; active: boolean }>(
    { action: 'set_active', userId, active },
    'Não foi possível atualizar o funcionário.',
  );
}

export async function updateEmployee(input: UpdateEmployeeInput): Promise<Employee> {
  return invokeEmployeeAction<Employee>(
    { action: 'update', ...input },
    'Não foi possível editar o funcionário.',
  );
}

export async function deleteEmployee(userId: string) {
  return invokeEmployeeAction<{ id: string; deleted: true }>(
    { action: 'delete', userId },
    'Não foi possível excluir o funcionário.',
  );
}
