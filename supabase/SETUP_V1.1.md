# Supabase — versão 1.1.0 (Redesign Completo)

A versão 1.1.0 preserva todas as tabelas e dados existentes. Ela adiciona apenas campos visuais e de organização necessários ao novo fluxo.

## Executar a migration

1. Abra o projeto Supabase usado na v1.0.
2. Entre em **SQL Editor → New query**.
3. Abra no VS Code:

```text
supabase/migrations/202608060007_v1_1_redesign.sql
```

4. Copie todo o conteúdo, cole no editor e clique em **Run**.
5. Não execute novamente as migrations antigas.

## Campos adicionados

- `courses`: grupo, cor, ícone, meta semanal, níveis e recursos.
- `study_sessions`: horário, habilidade de idioma, recurso, recorrência e lembrete.
- `notes`: cor, rascunho e checklist.
- `note_categories`: cor padrão.
- `user_settings`: cor do menu, botões e tonalidade dos cartões.

A migration classifica e colore cursos existentes sem apagar ou duplicar registros.
