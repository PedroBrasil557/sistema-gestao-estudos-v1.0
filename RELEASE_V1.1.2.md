# Release v1.1.2 — Correção de qualidade e build

Esta versão corrige os erros encontrados em `npm run typecheck`, `npm run lint` e `npm run build` após a atualização do redesign.

## Arquivos corrigidos

- `src/app/api/lists/[kind]/route.ts`
- `src/app/api/lists/[kind]/[id]/route.ts`
- `src/components/courses/course-detail-client.tsx`

## Banco de dados

Não existe migration nova. Não execute SQL adicional no Supabase.

## Testes obrigatórios

```cmd
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```
