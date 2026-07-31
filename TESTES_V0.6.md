# Testes da versão 0.6 — Importação de cursos

## 1. Preparação

- [ ] A v0.5 funciona com a mesma conta e o mesmo projeto Supabase.
- [ ] O `.env.local` está presente e não contém chave `sb_secret_`.
- [ ] `npm install` terminou sem erro fatal.
- [ ] A migração `202607240003_v0_6_course_imports.sql` foi executada.
- [ ] A tabela `course_imports` aparece no Table Editor.
- [ ] A tabela `courses` e as tabelas de listas continuam existentes.

## 2. Abrir a importação

- [ ] Faça login.
- [ ] Abra `/cursos`.
- [ ] Clique em **Importar** no cabeçalho ou no painel da trilha.
- [ ] A janela possui as etapas Origem, Conferência e Relatório.
- [ ] O botão para baixar o modelo CSV funciona.

## 3. Pré-visualizar a trilha oficial

- [ ] Selecione **Trilha oficial do projeto**.
- [ ] Clique em **Pré-visualizar trilha**.
- [ ] O resumo mostra 56 linhas.
- [ ] O conteúdo apresenta 49 cursos e 7 certificações.
- [ ] As plataformas Microsoft e Scrum Study aparecem como novas, caso ainda não existam.
- [ ] Nenhuma informação é gravada antes da confirmação final.

## 4. Importar a trilha oficial

Em uma conta sem os registros oficiais:

- [ ] Escolha **Manter o existente e ignorar duplicados**.
- [ ] Clique em **Importar registros válidos**.
- [ ] O relatório informa os registros importados.
- [ ] Clique em **Atualizar lista de cursos**.
- [ ] A página mostra 56 registros ativos, descontando cursos que já existiam e foram ignorados.
- [ ] O indicador Certificações mostra 7.
- [ ] A plataforma Microsoft foi criada.
- [ ] A plataforma Scrum Study foi criada.
- [ ] Os cursos concluídos aparecem com 100%.
- [ ] O Excel Avançado aparece Em andamento.

## 5. Evitar repetição

- [ ] Abra a importação novamente.
- [ ] Pré-visualize a trilha oficial.
- [ ] O sistema informa que essa importação já foi concluída.
- [ ] O botão de importar fica desabilitado.
- [ ] Nenhum registro é duplicado.

## 6. Duplicidades parciais

Em outra conta de teste ou após remover o registro de histórico em ambiente controlado:

- [ ] Cadastre manualmente `Excel Básico` como Curso.
- [ ] Pré-visualize a trilha oficial.
- [ ] A linha aparece como Duplicado.
- [ ] Com estratégia **Ignorar**, o curso manual permanece sem alteração.
- [ ] Com estratégia **Atualizar**, o curso recebe os dados da importação.
- [ ] Um registro arquivado pode ser restaurado pela estratégia Atualizar.

## 7. Modelo CSV

- [ ] Baixe o modelo CSV.
- [ ] Abra no Excel ou editor de texto.
- [ ] Confirme que os acentos aparecem corretamente.
- [ ] Remova a linha de exemplo antes do teste real.

## 8. CSV válido

Crie um arquivo com:

```text
ID;Nome;Tipo;Plataforma;Área;Carga Horária;Status;Prioridade
1;Curso Teste CSV;Curso;Plataforma Teste;Área Teste;12,5;Planejado;Alta
2;Certificação Teste CSV;Certificação;Microsoft;Certificações;0;Planejado;Média
```

- [ ] O arquivo é aceito.
- [ ] A pré-visualização mostra 2 linhas prontas.
- [ ] Plataforma Teste e Área Teste são indicadas como novos itens.
- [ ] A importação cria os dois registros.
- [ ] A carga `12,5` é salva corretamente.

## 9. CSV com erros

Crie linhas com nome vazio, carga negativa, status desconhecido e URL inválida.

- [ ] Cada erro aparece na linha correspondente.
- [ ] Linhas inválidas ficam marcadas em vermelho.
- [ ] Linhas válidas continuam disponíveis para importação.
- [ ] Linhas inválidas não são gravadas.

## 10. Duplicidade dentro do arquivo

- [ ] Repita o mesmo Nome e Tipo em duas linhas.
- [ ] A segunda linha é marcada como inválida por duplicidade interna.
- [ ] Apenas uma linha pode ser importada.

## 11. Relatório

- [ ] O resumo final informa importados, atualizados, ignorados e erros.
- [ ] Clique em **Baixar relatório CSV**.
- [ ] O relatório contém uma linha para cada registro processado.
- [ ] Em `course_imports`, o campo `report` contém o relatório completo.
- [ ] O histórico está vinculado ao `user_id` correto.

## 12. Segurança e isolamento

- [ ] Uma segunda conta não vê os relatórios da primeira.
- [ ] Uma segunda conta pode importar sua própria trilha oficial.
- [ ] Não existe chave secreta no navegador ou no `.env.local`.

## 13. Responsividade

- [ ] A janela de importação cabe no desktop.
- [ ] A tabela de pré-visualização possui rolagem interna.
- [ ] No celular, as opções de origem ficam em uma coluna.
- [ ] Os botões finais ocupam largura confortável.
- [ ] O modal pode ser rolado sem esconder as ações.

## 14. Testes técnicos

```cmd
npm run typecheck
npm run lint
npm run build
```

- [ ] TypeScript sem erros.
- [ ] ESLint sem erros.
- [ ] Build concluído.
- [ ] Console do navegador sem erros vermelhos.
