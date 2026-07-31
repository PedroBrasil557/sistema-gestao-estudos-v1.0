# Configuração do Supabase — versão 0.7

Esta versão usa o mesmo projeto Supabase e o mesmo `.env.local` das versões anteriores.

## Executar a migração

1. Abra o projeto no Supabase.
2. Entre em **SQL Editor**.
3. Clique em **New query**.
4. Copie todo o conteúdo de:

```text
supabase/migrations/202607240004_v0_7_study_sessions.sql
```

5. Cole no editor e clique em **Run**.

## Conferência

No **Table Editor**, confirme a tabela:

```text
study_sessions
```

Na tabela `courses`, confirme a nova coluna:

```text
studied_hours
```

Não apague as tabelas nem execute novamente migrações antigas.

## O que a migração protege

- Cada sessão pertence ao usuário autenticado.
- O curso e o tipo de estudo precisam pertencer ao mesmo usuário.
- A soma diária de horas não pode ultrapassar 24.
- Excluir uma sessão remove suas horas dos totais sem apagar o histórico.
- Restaurar a sessão recalcula novamente as horas do curso.
