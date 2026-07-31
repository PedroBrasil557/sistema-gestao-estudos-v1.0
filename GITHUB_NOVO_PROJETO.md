# Publicar a versão 1.0 no GitHub como projeto novo

Este procedimento parte de uma pasta nova da versão `sistema-gestao-estudos-v1.0` e foi escrito pensando no **Prompt de Comando (CMD) do Windows**.

## 1. Antes de começar

Confirme que o Git está instalado:

```cmd
git --version
```

Confirme que você está na pasta correta:

```cmd
echo %cd%
```

O caminho deve terminar em `sistema-gestao-estudos-v1.0`.

## 2. Proteção do `.env.local`

O arquivo `.env.local` contém a configuração local do Supabase e **não deve ser enviado ao GitHub**.

O `.gitignore` desta versão já ignora `.env*`, mantendo somente `.env.example` versionado.

Depois de iniciar o Git, confirme explicitamente:

```cmd
git check-ignore -v .env.local
```

O comando deve informar que `.env.local` está sendo ignorado. Se não estiver, **não execute `git add .`** até corrigir isso.

## 3. Criar o repositório local

```cmd
git init
git branch -M main
git add .
git status
```

No resultado de `git status`, `.env.local` não pode aparecer em "Changes to be committed".

Faça o primeiro commit:

```cmd
git commit -m "release: Sistema de Gestão de Estudos v1.0.0"
```

## 4. Criar o projeto novo no GitHub

No GitHub:

1. Clique em **New repository**.
2. Nome recomendado: `sistema-gestao-estudos-roberta`.
3. Escolha **Private** enquanto o projeto ainda estiver em ajustes e homologação.
4. Não marque a criação automática de README, `.gitignore` ou licença, pois estes arquivos já estão no projeto.
5. Clique em **Create repository**.

O GitHub mostrará a URL do novo repositório. Copie-a.

## 5. Conectar a pasta local ao GitHub

Substitua a URL abaixo pela URL do repositório criado:

```cmd
git remote add origin https://github.com/SEU-USUARIO/sistema-gestao-estudos-roberta.git
git remote -v
git push -u origin main
```

## 6. Criar a marca oficial da versão 1.0

Depois que o primeiro push terminar:

```cmd
git tag -a v1.0.0 -m "Versão 1.0.0 homologável"
git push origin v1.0.0
```

A tag registra um ponto estável para que ajustes posteriores possam ser comparados com a versão originalmente aprovada.

## 7. Como trabalhar nos ajustes pedidos depois da v1.0

A v1.0 não deve ser sobrescrita. Ajustes posteriores devem ser feitos em novas versões e commits.

Exemplos de versionamento:

- `v1.0.1`: correção pequena, sem mudança de funcionalidade;
- `v1.1.0`: melhoria ou nova funcionalidade compatível;
- `v2.0.0`: mudança estrutural ou incompatível.

Para um ajuste solicitado pelo usuário/cliente, crie uma branch:

```cmd
git checkout -b ajuste/nome-do-ajuste
```

Depois de programar e testar:

```cmd
git add .
git commit -m "ajuste: descreva o que mudou"
git push -u origin ajuste/nome-do-ajuste
```

Depois o ajuste pode ser revisado e incorporado à `main` por Pull Request no GitHub.

## 8. Arquivos que nunca devem ser enviados

Não versionar:

- `.env.local`;
- chaves secretas do Supabase;
- `SUPABASE_SERVICE_ROLE_KEY`;
- senhas;
- tokens pessoais;
- arquivos de backup reais da conta;
- certificados pessoais baixados do Storage.

O arquivo `.env.example` existe somente para documentar os nomes das variáveis necessárias, usando placeholders.
