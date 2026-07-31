# Deploy da versão 1.0 na Vercel

Faça esta etapa somente depois de a versão 1.0 estar no GitHub e de os testes locais terem sido aprovados.

## 1. Importar o repositório

1. Entre na Vercel.
2. Clique em **Add New → Project**.
3. Importe o repositório `sistema-gestao-estudos-roberta`.
4. O framework deve ser detectado como **Next.js**.

## 2. Variáveis de ambiente

Cadastre na Vercel, sem colocar os valores no GitHub:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
```

Em `NEXT_PUBLIC_SITE_URL`, use a URL final do projeto, por exemplo:

```text
https://seu-projeto.vercel.app
```

Se a exclusão definitiva de conta estiver habilitada no ambiente final, a chave elevada deve ser configurada somente como variável privada de servidor e nunca com prefixo `NEXT_PUBLIC_`.

## 3. Atualizar o Supabase Auth

No Supabase, em **Authentication → URL Configuration**:

- defina `Site URL` para a URL de produção;
- adicione a URL de produção nas `Redirect URLs`, incluindo as rotas de confirmação e recuperação.

Durante homologação, mantenha também `http://localhost:3000/**` se ainda houver testes locais.

## 4. Teste de produção

Depois do primeiro deploy, execute o roteiro `TESTES_V1.0.md` também na URL de produção, principalmente:

- criação e login de conta de teste;
- recuperação de senha;
- CRUD de cursos;
- sessão de estudo;
- anotações;
- certificados e arquivo privado;
- Dashboard;
- exportações;
- acesso no celular.

## 5. Deploys posteriores

A branch `main` representa a versão estável. Ajustes solicitados depois da v1.0 devem ser desenvolvidos em branches próprias e testados antes de entrar na `main`.
