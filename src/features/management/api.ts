import { supabase } from '@/lib/supabase';

import { CreateEmployeeInput, Employee } from './types';

type FunctionError = { error?: string };

export async function listEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, active')
    .eq('role', 'employee')
    .order('name');

  if (error) throw new Error(error.message);
  return (data ?? []) as Employee[];
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const { data, error } = await supabase.functions.invoke<Employee & FunctionError>('manage-employee', {
    body: { action: 'create', ...input },
  });

  if (error) throw new Error(error.message);
  if (!data || data.error) throw new Error(data?.error ?? 'Não foi possível criar o funcionário.');
  return data;
}

export async function setEmployeeActive(userId: string, active: boolean) {
  const { data, error } = await supabase.functions.invoke<FunctionError>('manage-employee', {
    body: { action: 'set_active', userId, active },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}
