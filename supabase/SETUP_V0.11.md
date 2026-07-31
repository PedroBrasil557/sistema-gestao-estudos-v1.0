# Supabase — v0.11 Dashboard

A versão 0.11 não exige nova migração SQL.

Ela utiliza somente tabelas e políticas já criadas e aprovadas até a v0.10:

- `user_settings`
- `areas`
- `platforms`
- `study_types`
- `courses`
- `study_sessions`
- `certificates`

## Conferência recomendada

No Supabase, em **Table Editor**, confirme que essas tabelas continuam disponíveis.

Não execute novamente as migrações antigas apenas para instalar a v0.11.

## Segurança

A rota `/api/dashboard` obtém o usuário autenticado no servidor e todas as consultas são limitadas ao `user_id` dessa sessão. As políticas RLS das versões anteriores permanecem ativas.

Nenhuma Secret Key é necessária para o Dashboard.
