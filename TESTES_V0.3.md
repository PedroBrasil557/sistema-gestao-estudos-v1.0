# Testes de homologação — v0.3

Marque cada item depois de testar. Não avance para a v0.4 enquanto houver falhas relevantes.

## 1. Testes técnicos

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```

Resultado esperado: todos os comandos terminam sem erro.

## 2. Teste sem Supabase configurado

1. Renomeie temporariamente `.env.local`, caso exista.
2. Abra `/estudos`.
3. Confirme que o sistema abre no modo demonstração e exibe o aviso amarelo.
4. Abra `/entrar` e tente enviar o formulário.
5. Confirme que aparece a orientação para configurar o Supabase, sem quebrar a página.

## 3. Configuração necessária

No Supabase, confirme:

- Site URL: `http://localhost:3000`.
- Redirect URL: `http://localhost:3000/**`.
- Provedor Email habilitado.
- `.env.local` com URL e publishable key corretas.

Reinicie `npm run dev` depois de editar o ambiente.

## 4. Cadastro

1. Acesse `/criar-conta`.
2. Tente nome com menos de três caracteres.
3. Tente senha sem maiúscula ou número.
4. Tente senhas diferentes.
5. Tente continuar sem aceitar os termos.
6. Crie uma conta válida.
7. Verifique o e-mail de confirmação.
8. Clique no link e confirme que o sistema abre em `/estudos`.

Resultado esperado: validações claras, formulário preservado em erro e conta criada apenas com dados válidos.

## 5. Login e proteção de rotas

1. Saia da conta.
2. Acesse diretamente `/dashboard`.
3. Confirme redirecionamento para `/entrar?retorno=/dashboard`.
4. Tente senha incorreta.
5. Entre com credenciais corretas.
6. Confirme retorno para `/dashboard`.
7. Atualize a página com F5.
8. Feche e reabra a aba.

Resultado esperado: sessão permanece válida e páginas internas não ficam acessíveis sem login.

## 6. Logout

1. Clique em **Sair da conta** no menu lateral.
2. Confirme redirecionamento para `/entrar`.
3. Tente voltar para uma rota interna pelo histórico do navegador.

Resultado esperado: a rota interna volta a exigir login.

## 7. Recuperação de senha

1. Em `/entrar`, clique em **Esqueci minha senha**.
2. Informe o e-mail cadastrado.
3. Abra a mensagem recebida.
4. Crie uma senha válida em `/nova-senha`.
5. Confirme redirecionamento para `/estudos`.
6. Saia e entre usando a nova senha.

Resultado esperado: a senha antiga deixa de funcionar e a nova passa a funcionar.

## 8. Meu perfil

1. Clique em **Ver perfil** no menu lateral.
2. Altere o nome e salve.
3. Atualize a página e confirme o novo nome no menu.
4. Informe uma URL válida de avatar e salve.
5. Altere o e-mail e confira as mensagens de confirmação enviadas pelo Supabase.
6. Tente trocar a senha usando uma senha atual incorreta.
7. Troque a senha usando a senha atual correta.

Resultado esperado: dados persistem no usuário autenticado e a troca de senha exige confirmação da senha atual.

## 9. Exclusão de conta — teste opcional

Este teste exige `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`.

1. Crie uma conta exclusiva para o teste.
2. Abra `/perfil`.
3. Tente excluir sem digitar `EXCLUIR`.
4. Digite `EXCLUIR` e confirme.
5. Tente entrar novamente com o mesmo usuário.

Resultado esperado: exclusão bloqueada sem confirmação e usuário removido quando confirmado.

## 10. Responsividade e acessibilidade

Teste em 390 × 844, 768 × 1024 e desktop:

- Páginas de autenticação sem rolagem horizontal.
- Campos e botões totalmente visíveis.
- Menu móvel abre e fecha.
- Logout funciona no menu móvel.
- Foco visível usando apenas Tab e Enter.
- Mensagens de erro são legíveis e associadas à operação.

## 11. Console

Abra o DevTools e confirme ausência de erros vermelhos relacionados a:

- hidratação;
- cookies;
- Proxy;
- Supabase;
- componentes React;
- rotas ausentes.

## Critério de aprovação

A v0.3 está aprovada quando cadastro, confirmação, login, proteção de rotas, logout, recuperação e atualização de perfil funcionarem sem erros.
