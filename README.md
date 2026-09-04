# Mesa Boa

Aplicativo mobile para operação de salão, cozinha e caixa de restaurantes.

## Tecnologias

- Expo SDK 57, React Native e TypeScript
- Expo Router
- Supabase (Auth, Postgres, Realtime e Edge Functions)
- TanStack Query, Zustand e Zod
- Iconify API com renderização SVG e cache local

## Desenvolvimento

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env` e preencha os dados do Supabase.
3. Execute `npm start` e abra o projeto no Expo Go ou em um development build.

## Qualidade

- `npm run lint`
- `npm run typecheck`

As migrations e funções locais do Supabase ficam em `supabase/`.
