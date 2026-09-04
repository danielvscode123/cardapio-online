# Mesa Boa

Aplicativo mobile de comanda para restaurantes. A equipe abre uma mesa, envia pedidos para a cozinha, acompanha o preparo em tempo real, registra a entrega e fecha a conta no caixa.

## Fluxos incluídos

- **Garçom:** mapa do salão, abertura da mesa, cardápio por categoria, observações e envio do pedido.
- **Cozinha:** fila em tempo real e transições Recebido → Em preparo → Pronto.
- **Caixa:** totais por mesa, pagamento em Pix, dinheiro, crédito, débito ou outro e liberação da mesa.
- **Gerente:** tudo que um funcionário acessa, mais cadastro e suspensão de funcionários.
- **Primeiro acesso:** criação segura do primeiro gerente; os próximos usuários são criados pelo painel de Gestão.

As comandas pagas são encerradas, não apagadas. Isso mantém o histórico e deixa a mesa disponível para um novo atendimento.

## Tecnologias

- Expo SDK 57, React Native 0.86 e TypeScript
- Expo Router
- Supabase Auth, Postgres, Row Level Security, Realtime e Edge Functions
- TanStack Query, Zustand, React Hook Form e Zod
- API do Iconify com SVG e cache local em SQLite
- Vitest

## Rodar no Expo

Requisitos: Node.js 22+, npm e o aplicativo Expo Go em um celular na mesma rede do computador.

```powershell
cd "F:\Projetos Git\CardapioVirtual"
npm install
Copy-Item .env.example .env
```

Preencha o `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
```

Inicie o projeto e leia o QR code com o Expo Go:

```powershell
npm start
```

Também é possível testar no navegador com `npm run web`.

## Configurar o Supabase

O schema completo está em [`supabase/migrations/20260904053901_initial_restaurant_schema.sql`](supabase/migrations/20260904053901_initial_restaurant_schema.sql). Ele cria as tabelas, índices, RLS, RPCs transacionais, publicação Realtime, 12 mesas e um cardápio demonstrativo.

Com o Supabase CLI autenticado e o projeto vinculado:

```powershell
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
npx supabase functions deploy manage-employee
```

A função `manage-employee` usa `SUPABASE_SERVICE_ROLE_KEY` somente no servidor. Essa chave nunca deve ser adicionada ao `.env` do Expo.

Depois da publicação:

1. Abra o aplicativo e selecione **Criar primeiro gerente**.
2. Cadastre o gerente. Se a confirmação de e-mail estiver ativa, confirme e entre novamente.
3. Abra **Gestão** para criar os acessos dos funcionários.
4. Funcionários verão as abas **Garçom**, **Cozinha** e **Caixa**.

## Comandos de qualidade

```powershell
npm test
npm run typecheck
npm run lint
npx expo-doctor
npx expo export --platform web
```

## Estrutura principal

```text
src/app/                 rotas e telas do Expo Router
src/components/          componentes visuais reutilizáveis
src/features/operations/ regras, consultas e tempo real da operação
src/features/management/ gestão de funcionários
src/providers/           autenticação e cache de consultas
supabase/migrations/     banco de dados versionado
supabase/functions/      função administrativa protegida
```

## Git

Na raiz do projeto:

```powershell
git push -u origin main
```

O `.gitignore` protege `.env`, dependências, builds, relatórios e arquivos temporários do Supabase.
