# Supabase — preparação da versão 0.5

1. Confirme que a migração da v0.4 já foi executada.
2. No painel do Supabase, abra **SQL Editor → New query**.
3. Copie todo o arquivo `migrations/202607240002_v0_5_courses.sql`.
4. Cole no editor e clique em **Run**.
5. Em **Table Editor**, confirme a nova tabela `courses`.
6. Não crie cursos manualmente no painel: use a tela **Cursos** do sistema para testar as regras e o isolamento por usuário.

A migração é idempotente e pode ser executada novamente, mas o ideal é rodá-la uma única vez e registrar o resultado no checklist.
