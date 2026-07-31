# Supabase — versão 1.0

A versão 1.0 **não exige nova migração SQL**.

Ela utiliza cumulativamente as migrações já aplicadas:

1. `202607240001_v0_4_settings_and_lists.sql`
2. `202607240002_v0_5_courses.sql`
3. `202607240003_v0_6_course_imports.sql`
4. `202607240004_v0_7_study_sessions.sql`
5. `202607240005_v0_9_notes.sql`
6. `202607290006_v0_10_certificates.sql`

Se o banco usado é o mesmo que já funcionou na v0.12, **não execute novamente as migrações antigas**.

Para um banco novo/vazio, aplique as migrações na ordem acima.

## Ambiente local

O projeto utiliza:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
```

O `.env.local` deve permanecer apenas no computador e não deve ser enviado ao GitHub.

## Produção

Na Vercel, configure as variáveis pelo painel do projeto e atualize as URLs autorizadas em **Supabase → Authentication → URL Configuration**.
