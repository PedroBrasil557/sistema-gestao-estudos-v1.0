# Supabase — versão 0.9

A v0.9 adiciona a tabela `notes` para anotações e revisões.

## Executar

1. Abra o projeto Supabase já usado pelas versões anteriores.
2. Entre em **SQL Editor** → **New query**.
3. Copie todo o conteúdo de `supabase/migrations/202607240005_v0_9_notes.sql`.
4. Cole no editor e clique em **Run**.
5. Em **Table Editor**, confirme a nova tabela `notes`.

Não remova as tabelas ou migrações anteriores.

## Segurança

A tabela possui Row Level Security. Cada usuário autenticado só pode selecionar, criar, alterar ou excluir logicamente suas próprias anotações. O backend também valida a propriedade do curso e da categoria.

## `.env.local`

A v0.9 mantém o mesmo `.env.local` público da v0.8. Nenhuma Secret Key está incluída ou é necessária para esta etapa.
