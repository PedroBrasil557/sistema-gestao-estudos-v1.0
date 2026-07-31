# Supabase — versão 0.12

A versão 0.12 **não exige uma nova migração SQL**.

Ela reutiliza as tabelas e políticas das versões 0.4 a 0.10 e adiciona, no código da aplicação:

- exportação autenticada de cursos, sessões, anotações e certificados;
- backup lógico completo em JSON;
- registro das exportações em `audit_logs`;
- paginação interna para exportar mais de 1.000 registros;
- cabeçalhos de segurança no Next.js.

## Conferência recomendada

Antes dos testes, confirme no Supabase que continuam existentes:

- `profiles`
- `user_settings`
- `platforms`
- `areas`
- `study_types`
- `note_categories`
- `courses`
- `study_sessions`
- `notes`
- `certificates`
- `course_imports`
- `audit_logs`

O bucket `certificates` deve continuar privado.

Nenhuma `Secret key` ou `service_role` é necessária para as exportações da v0.12.
