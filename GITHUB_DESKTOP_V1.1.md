# Atualizar para v1.1.0 usando GitHub Desktop

## 1. Preservar a versão estável

No GitHub Desktop, abra o repositório atual `sistema-gestao-estudos-v1.0`.

1. Clique em **Current branch**.
2. Clique em **New branch**.
3. Nomeie:

```text
redesign-v1.1.0
```

4. Crie a branch a partir de `main`.
5. Clique em **Publish branch**.

Não altere a `main` durante os testes do redesign.

## 2. Aplicar os arquivos da nova versão

Com a branch `redesign-v1.1.0` selecionada:

1. Feche o servidor local.
2. Faça uma cópia de segurança da pasta atual.
3. Copie o conteúdo da pasta `sistema-gestao-estudos-v1.1.0` para a pasta local do repositório.
4. Confirme a substituição dos arquivos de código.
5. Não copie `node_modules` nem `.next`.
6. O `.env.local` pode permanecer no computador, mas não pode aparecer em **Changes**.

## 3. Conferência obrigatória antes do commit

No GitHub Desktop, verifique que não aparecem:

```text
.env.local
node_modules
.next
```

Também não devem aparecer chaves que comecem com:

```text
sb_secret_
```

## 4. Executar localmente

No VS Code:

```cmd
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```

Execute a migration da v1.1.0 no Supabase antes dos testes funcionais.

## 5. Primeiro commit

No campo **Summary**, use:

```text
Implementa redesign completo v1.1.0
```

Clique em:

```text
Commit to redesign-v1.1.0
```

Depois:

```text
Push origin
```

## 6. Preview na Vercel

A Vercel criará um deploy de Preview para a branch. Confirme que as variáveis públicas do Supabase estão habilitadas para **Preview**.

No Supabase, adicione a URL de Preview em **Authentication → URL Configuration → Redirect URLs**, quando necessário.

## 7. Aprovar e juntar à main

Depois que os testes e o Preview forem aprovados:

1. Abra um Pull Request no GitHub de `redesign-v1.1.0` para `main`.
2. Confirme que o GitHub Actions ficou verde.
3. Faça o merge.
4. No GitHub Desktop, volte para `main` e clique em **Fetch origin / Pull origin**.
5. Crie a tag/release `v1.1.0` no GitHub.

A branch pode ser mantida por alguns dias como segurança e removida somente depois da homologação em produção.
