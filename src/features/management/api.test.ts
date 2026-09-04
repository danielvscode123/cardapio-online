import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteEmployee, updateEmployee } from './api';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: { invoke },
  },
}));

describe('ações de gestão de funcionários', () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it('envia os dados editados e a senha opcional para a função administrativa', async () => {
    const updated = {
      id: 'employee-id',
      name: 'Marina Souza',
      email: 'marina@restaurante.com',
      active: true,
    };
    invoke.mockResolvedValue({ data: updated, error: null });

    await expect(updateEmployee({
      userId: 'employee-id',
      name: updated.name,
      email: updated.email,
      password: 'senha-segura',
    })).resolves.toEqual(updated);

    expect(invoke).toHaveBeenCalledWith('manage-employee', {
      body: {
        action: 'update',
        userId: 'employee-id',
        name: updated.name,
        email: updated.email,
        password: 'senha-segura',
      },
    });
  });

  it('envia a exclusão para a função administrativa', async () => {
    invoke.mockResolvedValue({ data: { id: 'employee-id', deleted: true }, error: null });

    await expect(deleteEmployee('employee-id')).resolves.toEqual({
      id: 'employee-id',
      deleted: true,
    });

    expect(invoke).toHaveBeenCalledWith('manage-employee', {
      body: { action: 'delete', userId: 'employee-id' },
    });
  });

  it('mostra a mensagem detalhada retornada pela Edge Function', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: {
        context: {
          json: async () => ({ error: 'Este e-mail já está sendo usado por outro acesso.' }),
        },
      },
    });

    await expect(updateEmployee({
      userId: 'employee-id',
      name: 'Marina Souza',
      email: 'email@duplicado.com',
    })).rejects.toThrow('Este e-mail já está sendo usado por outro acesso.');
  });
});
