# Atualizar a correção v1.1.1 pelo GitHub Desktop

Use o mesmo repositório e a mesma branch do redesign.

## Passos

1. Faça uma cópia da pasta atual do repositório.
2. Abra o GitHub Desktop e confirme que a branch correta está selecionada.
3. Copie os arquivos da pasta `sistema-gestao-estudos-v1.1.1` para a pasta local do repositório.
4. Não copie `node_modules` nem `.next`.
5. Confirme que `.env.local` não aparece em **Changes**.
6. Execute:

```cmd
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```

7. Teste os tamanhos descritos em `TESTES_V1.1.1.md`.
8. No GitHub Desktop, use o resumo:

```text
Corrige responsividade e tela Estudos v1.1.1
```

9. Clique em **Commit** e depois em **Push origin**.
10. Teste o Preview da Vercel antes de atualizar a produção.

## Supabase

Não execute SQL novo. A migration da v1.1.0 deve continuar instalada.
