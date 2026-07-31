# Configuração do Supabase — versão 0.6

A versão 0.6 adiciona o histórico e o relatório das importações de cursos. As tabelas das versões 0.4 e 0.5 devem continuar existentes.

## 1. Abrir o SQL Editor

No projeto Supabase usado desde a v0.3:

1. Acesse **SQL Editor**.
2. Clique em **New query**.
3. Abra no VS Code o arquivo `supabase/migrations/202607240003_v0_6_course_imports.sql`.
4. Copie todo o conteúdo.
5. Cole no SQL Editor.
6. Clique em **Run**.

## 2. Conferir a tabela

Em **Table Editor**, confirme a existência de:

- `course_imports`

Não apague as tabelas anteriores.

## 3. Segurança

A tabela utiliza Row Level Security. Cada conta só pode ver e alterar seus próprios relatórios de importação.

## 4. Configuração de ambiente

O `.env.local` público foi preservado da versão anterior. Nenhuma chave secreta deve ser adicionada para usar a importação.
