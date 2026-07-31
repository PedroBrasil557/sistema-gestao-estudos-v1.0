# Supabase — versão 0.8

A versão 0.8 **não cria tabelas, colunas ou políticas novas**.

Ela utiliza estruturas já criadas anteriormente:

- `user_settings.current_course_id` — versões 0.4/0.5;
- `courses` e `courses.studied_hours` — versões 0.5/0.7;
- `study_sessions` — versão 0.7;
- `areas`, `platforms` e `study_types` — versão 0.4.

Portanto, se as versões 0.4 a 0.7 já foram configuradas e testadas, não execute SQL adicional para a v0.8.

## Conferência rápida

No Table Editor confirme que existem:

```text
user_settings
courses
study_sessions
areas
platforms
study_types
```

Na tabela `user_settings`, confirme a coluna:

```text
current_course_id
```

Na tabela `courses`, confirme:

```text
studied_hours
```

O `.env.local` continua usando o mesmo projeto Supabase das versões anteriores.
