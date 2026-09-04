import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CreateEmployeeBody = {
  action: 'create';
  name: string;
  email: string;
  password: string;
};

type SetActiveBody = {
  action: 'set_active';
  userId: string;
  active: boolean;
};

type UpdateEmployeeBody = {
  action: 'update';
  userId: string;
  name: string;
  email: string;
  password?: string;
};

type DeleteEmployeeBody = {
  action: 'delete';
  userId: string;
};

type ResetPasswordBody = {
  action: 'reset_password';
  userId: string;
  password: string;
};

type RequestBody =
  | CreateEmployeeBody
  | SetActiveBody
  | UpdateEmployeeBody
  | DeleteEmployeeBody
  | ResetPasswordBody;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function authErrorMessage(message: string | undefined, fallback: string) {
  if (message?.toLowerCase().includes('already') || message?.toLowerCase().includes('registered')) {
    return 'Este e-mail já está sendo usado por outro acesso.';
  }

  return fallback;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Autenticação obrigatória.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Configuração do servidor incompleta.' }, 500);
  }

  const callerClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const token = authorization.slice('Bearer '.length);
  const { data: userData, error: userError } = await callerClient.auth.getUser(token);
  if (userError || !userData.user) {
    return jsonResponse({ error: 'Sessão inválida.' }, 401);
  }

  const { data: manager, error: managerError } = await adminClient
    .from('profiles')
    .select('restaurant_id, role, active')
    .eq('id', userData.user.id)
    .single();

  if (managerError || !manager?.active || manager.role !== 'manager') {
    return jsonResponse({ error: 'Apenas gerentes podem administrar funcionários.' }, 403);
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido.' }, 400);
  }

  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'Corpo da requisição inválido.' }, 400);
  }

  if (body.action === 'create') {
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();

    if (!name || name.length < 2 || name.length > 80 || !email || !isEmail(email) || body.password?.length < 8) {
      return jsonResponse({ error: 'Informe nome, e-mail e uma senha de pelo menos 8 caracteres.' }, 400);
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (createError || !created.user) {
      return jsonResponse({
        error: authErrorMessage(createError?.message, 'Não foi possível criar o funcionário.'),
      }, 400);
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .update({
        restaurant_id: manager.restaurant_id,
        name,
        email,
        role: 'employee',
        active: true,
      })
      .eq('id', created.user.id)
      .select('id')
      .single();

    if (profileError || !profile) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return jsonResponse({ error: 'Não foi possível ativar o perfil do funcionário.' }, 500);
    }

    return jsonResponse({ id: created.user.id, name, email, role: 'employee', active: true }, 201);
  }

  if (!isUuid(body.userId)) {
    return jsonResponse({ error: 'Funcionário inválido.' }, 400);
  }

  const { data: employee } = await adminClient
    .from('profiles')
    .select('id, restaurant_id, role, name, email, active, deleted_at')
    .eq('id', body.userId)
    .eq('restaurant_id', manager.restaurant_id)
    .is('deleted_at', null)
    .single();

  if (!employee || employee.role !== 'employee') {
    return jsonResponse({ error: 'Funcionário não encontrado.' }, 404);
  }

  if (body.action === 'set_active') {
    if (typeof body.active !== 'boolean') {
      return jsonResponse({ error: 'Estado de acesso inválido.' }, 400);
    }

    const { error } = await adminClient
      .from('profiles')
      .update({ active: body.active })
      .eq('id', employee.id);

    if (error) {
      return jsonResponse({ error: 'Não foi possível atualizar o funcionário.' }, 500);
    }

    return jsonResponse({ id: employee.id, active: body.active });
  }

  if (body.action === 'update') {
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = typeof body.password === 'string' && body.password.length > 0
      ? body.password
      : undefined;

    if (
      !name
      || name.length < 2
      || name.length > 80
      || !email
      || !isEmail(email)
      || (body.password !== undefined && typeof body.password !== 'string')
      || (password !== undefined && password.length < 8)
    ) {
      return jsonResponse({ error: 'Revise o nome, o e-mail e a nova senha.' }, 400);
    }

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ name, email })
      .eq('id', employee.id)
      .eq('restaurant_id', manager.restaurant_id);

    if (profileError) {
      return jsonResponse({ error: 'Não foi possível atualizar o perfil do funcionário.' }, 500);
    }

    const { error: authError } = await adminClient.auth.admin.updateUserById(employee.id, {
      email,
      email_confirm: true,
      user_metadata: { full_name: name },
      ...(password ? { password } : {}),
    });

    if (authError) {
      await adminClient
        .from('profiles')
        .update({ name: employee.name, email: employee.email })
        .eq('id', employee.id);

      return jsonResponse({
        error: authErrorMessage(authError.message, 'Não foi possível atualizar o acesso do funcionário.'),
      }, 400);
    }

    return jsonResponse({
      id: employee.id,
      name,
      email,
      active: employee.active,
    });
  }

  if (body.action === 'delete') {
    const deletedAt = new Date().toISOString();
    const { error: archiveError } = await adminClient
      .from('profiles')
      .update({ active: false, deleted_at: deletedAt })
      .eq('id', employee.id)
      .eq('restaurant_id', manager.restaurant_id);

    if (archiveError) {
      return jsonResponse({ error: 'Não foi possível remover o funcionário.' }, 500);
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(employee.id, true);

    if (deleteError) {
      await adminClient
        .from('profiles')
        .update({ active: employee.active, deleted_at: null })
        .eq('id', employee.id);

      return jsonResponse({ error: 'Não foi possível excluir o acesso do funcionário.' }, 500);
    }

    return jsonResponse({ id: employee.id, deleted: true });
  }

  if (body.action === 'reset_password') {
    if (!body.password || body.password.length < 8) {
      return jsonResponse({ error: 'A senha deve ter pelo menos 8 caracteres.' }, 400);
    }

    const { error } = await adminClient.auth.admin.updateUserById(employee.id, {
      password: body.password,
    });

    if (error) {
      return jsonResponse({ error: 'Não foi possível redefinir a senha.' }, 500);
    }

    return jsonResponse({ id: employee.id, passwordUpdated: true });
  }

  return jsonResponse({ error: 'Ação inválida.' }, 400);
});
