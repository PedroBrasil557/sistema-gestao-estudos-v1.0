# Testes da versão 0.4

## Parte 1 — Instalação

1. Extraia a pasta `sistema-gestao-estudos-v0.4`.
2. Abra a pasta no VS Code.
3. Execute:

```bash
npm install
```

4. Confirme que o arquivo `.env.local` existe na raiz.
5. Não adicione nenhuma chave secreta.

## Parte 2 — Migração do Supabase

1. Abra o projeto no Supabase.
2. Acesse **SQL Editor → New query**.
3. Abra localmente:

```text
supabase/migrations/202607240001_v0_4_settings_and_lists.sql
```

4. Copie tudo, cole no SQL Editor e clique em **Run**.
5. Confirme a mensagem de sucesso.

## Parte 3 — Conferência das tabelas

No **Table Editor**, confirme:

- `profiles`
- `user_settings`
- `platforms`
- `areas`
- `study_types`
- `note_categories`
- `audit_logs`

Para a conta já existente, confira:

- 1 perfil;
- 1 configuração;
- 8 plataformas;
- 18 áreas;
- 6 tipos de estudo;
- 7 categorias de anotação.

## Parte 4 — Iniciar

```bash
npm run dev
```

Abra `http://localhost:3000`, entre com a conta da v0.3 e acesse **Configurações**.

## Parte 5 — Preferências gerais

1. Altere o fuso horário.
2. Altere a página inicial para Dashboard.
3. Desative “Exibir dicas e sugestões”.
4. Salve.
5. Atualize com F5.
6. Confirme que os valores permanecem.
7. Saia e entre novamente.
8. Confirme que o login abre o Dashboard.

## Parte 6 — Metas

1. Altere a meta mensal para `50`.
2. Altere a meta anual para `15`.
3. Defina o calendário para `60 dias`.
4. Salve e atualize a página.
5. Confirme os valores no Supabase em `user_settings`.

## Parte 7 — Aparência

1. Selecione tema escuro e salve.
2. Confirme a alteração no sistema.
3. Troque a cor principal.
4. Teste densidade compacta e confortável.
5. Teste arredondamento menor e maior.
6. Volte ao tema claro ao final, caso prefira.

## Parte 8 — Listas

Para cada seção:

- crie um item;
- atualize a página e confirme persistência;
- renomeie o item;
- arquive;
- confirme que ele saiu dos ativos;
- restaure;
- tente criar outro item com o mesmo nome e confirme o bloqueio.

## Parte 9 — Isolamento por usuário

1. Crie uma segunda conta de teste.
2. Entre nela.
3. Confirme que as listas são as listas padrão, sem os itens personalizados da primeira conta.
4. Volte para a conta principal e confirme que os itens continuam lá.

## Parte 10 — Perfil

1. Altere o nome em `/perfil`.
2. Atualize a página.
3. Confirme o nome novo no menu lateral e na tabela `profiles`.

## Parte 11 — Testes técnicos

```bash
npm run typecheck
npm run lint
npm run build
```

Todos devem terminar sem erro.
