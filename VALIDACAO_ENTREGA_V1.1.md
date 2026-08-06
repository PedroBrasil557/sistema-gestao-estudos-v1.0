# Validação da entrega — v1.1.0

## Verificações concluídas no ambiente de geração

- 93 arquivos TypeScript/TSX analisados quanto à sintaxe: sem erros.
- verificação estática de imports internos: nenhum arquivo ausente.
- verificação estática de imports não utilizados: nenhum encontrado.
- `package.json` e `tsconfig.json` válidos.
- número da aplicação e `VERSION.txt`: `1.1.0`.
- migration da v1.1.0 sem `DROP`, `TRUNCATE` ou `DELETE FROM`.
- nenhuma data ilustrativa fixa das imagens encontrada no código.
- nenhum padrão de Secret Key do Supabase encontrado no código/configuração versionável.
- `.env.local` permanece coberto pelo `.gitignore`.

## Validação que deve ser concluída no computador da usuária

O registro npm disponível no ambiente de geração não possui o pacote `@supabase/ssr`, portanto não foi possível concluir a instalação real das dependências nem executar o build completo aqui.

Execute localmente:

```cmd
npm install
npm run typecheck
npm run lint
npm run build
```

Depois faça os testes funcionais de `TESTES_V1.1.md` e valide o Preview da Vercel antes do merge para `main`.
