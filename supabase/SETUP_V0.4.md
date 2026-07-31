# Configuração do banco — versão 0.4

Esta versão usa o mesmo projeto Supabase já conectado na v0.3.

## 1. Abrir o SQL Editor

No Supabase, acesse **SQL Editor → New query**.

## 2. Executar a migração

Abra o arquivo:

```text
supabase/migrations/202607240001_v0_4_settings_and_lists.sql
```

Copie todo o conteúdo, cole no SQL Editor e clique em **Run**.

A migração é idempotente e pode ser executada novamente em caso de dúvida. Ela:

- cria `profiles` e `user_settings`;
- cria as listas `platforms`, `areas`, `study_types` e `note_categories`;
- cria políticas RLS por usuário;
- cria preferências e listas padrão para usuários novos;
- faz o preenchimento inicial para contas que já existiam na v0.3;
- cria `audit_logs` para ações importantes.

## 3. Conferir as tabelas

Em **Table Editor**, confirme a existência de:

- `profiles`
- `user_settings`
- `platforms`
- `areas`
- `study_types`
- `note_categories`
- `audit_logs`

## 4. Conferir seu usuário

Com a conta já criada na v0.3, as tabelas devem conter:

- 1 perfil em `profiles`;
- 1 registro em `user_settings`;
- 8 plataformas iniciais;
- 18 áreas iniciais;
- 6 tipos de estudo;
- 7 categorias de anotação.

## 5. Segurança

A chave secreta não é necessária para esta migração nem para as configurações. O arquivo `.env.local` desta entrega contém apenas URL e chave pública do projeto, ambas usadas pelo navegador.
