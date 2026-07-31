# Testes da versão 0.7 — Sessões de estudo

## 1. Preparação

- [ ] A v0.6 funciona com a mesma conta e o mesmo projeto Supabase.
- [ ] O `.env.local` está presente e não contém chave `sb_secret_`.
- [ ] `npm install` terminou sem erro fatal.
- [ ] A migração `202607240004_v0_7_study_sessions.sql` foi executada.
- [ ] A tabela `study_sessions` aparece no Table Editor.
- [ ] A coluna `studied_hours` aparece na tabela `courses`.
- [ ] Os 56 registros importados anteriormente continuam disponíveis.

## 2. Abrir a tela Estudos

- [ ] Faça login.
- [ ] Abra `/estudos`.
- [ ] A tela não informa que a migração está pendente.
- [ ] Os indicadores aparecem com valores reais.
- [ ] O botão **Registrar estudo** abre o formulário.
- [ ] Os cursos importados aparecem na seleção.
- [ ] Os tipos Aula, Revisão, Exercício, Projeto, Simulado e Leitura aparecem.

## 3. Criar uma sessão planejada

Cadastre:

```text
Data: hoje
Curso: Excel Avançado
Assunto: Tabelas dinâmicas
Horas planejadas: 2
Horas estudadas: 0
Status: Planejado
Tipo: Aula
```

- [ ] A sessão é salva.
- [ ] A mensagem de sucesso aparece.
- [ ] O registro entra na lista.
- [ ] O card Foco de Hoje aumenta.
- [ ] As horas estudadas do curso continuam iguais, pois o valor realizado é zero.

## 4. Registrar uma sessão concluída

Cadastre:

```text
Data: hoje
Curso: Excel Avançado
Assunto: Funções PROCX e PROCV
Horas planejadas: 2
Horas estudadas: 1,5
Status: Concluído
Tipo: Exercício
```

- [ ] O sistema aceita vírgula decimal.
- [ ] A lista mostra `1h 30m`.
- [ ] O card Horas estudadas aumenta 1h30.
- [ ] O card Concluídas aumenta.
- [ ] O curso Excel Avançado mostra 1,5 hora estudada na página Cursos.
- [ ] O progresso do curso é recalculado usando a carga horária.

## 5. Testar cálculo do progresso

Crie um curso de teste com carga de 30 horas.

- [ ] Registre uma sessão de 15 horas.
- [ ] Abra Cursos.
- [ ] O progresso exibido é 50%.
- [ ] Abra o detalhe do curso.
- [ ] O histórico mostra a sessão.
- [ ] Horas estudadas = 15h e horas restantes = 15h.

## 6. Editar uma sessão

- [ ] Clique no lápis de uma sessão.
- [ ] Altere o assunto.
- [ ] Altere as horas de 1,5 para 2.
- [ ] Salve.
- [ ] A lista exibe os novos valores.
- [ ] O total do curso é recalculado sem somar a sessão antiga e a nova ao mesmo tempo.

## 7. Mudar o curso da sessão

- [ ] Edite uma sessão e selecione outro curso.
- [ ] Salve.
- [ ] As horas são removidas do curso anterior.
- [ ] As horas são adicionadas ao novo curso.
- [ ] Os dois progressos ficam corretos.

## 8. Duplicar

- [ ] Clique no ícone de duplicar.
- [ ] O formulário abre com curso, assunto, tipo e observação copiados.
- [ ] A data é hoje.
- [ ] O status é Planejado.
- [ ] As horas estudadas são zero.
- [ ] Salve e confirme que um novo registro foi criado.

## 9. Cancelamento com horas

- [ ] Edite uma sessão que possua horas.
- [ ] Altere o status para Cancelado.
- [ ] Ao salvar, aparece a confirmação para manter ou zerar as horas.
- [ ] Teste uma vez mantendo as horas.
- [ ] Teste outra vez zerando as horas.
- [ ] O total do curso respeita a decisão tomada.

## 10. Limite diário

- [ ] Registre uma sessão de 20 horas para uma data de teste.
- [ ] Tente registrar outra de 5 horas no mesmo dia.
- [ ] O sistema bloqueia e explica que o total diário não pode ultrapassar 24 horas.
- [ ] Edite uma sessão para também tentar ultrapassar o limite.
- [ ] O banco bloqueia o valor mesmo se a requisição for feita fora da interface.

## 11. Validações

- [ ] Assunto vazio é bloqueado.
- [ ] Data inválida é bloqueada.
- [ ] Curso vazio é bloqueado.
- [ ] Tipo de estudo vazio é bloqueado.
- [ ] Horas negativas são bloqueadas.
- [ ] Horas individuais acima de 24 são bloqueadas.
- [ ] Texto digitado permanece no formulário quando o servidor retorna erro.

## 12. Busca, filtros e ordenação

- [ ] Busque pelo nome do curso.
- [ ] Busque pelo assunto.
- [ ] Busque por texto das observações.
- [ ] Filtre por curso.
- [ ] Filtre por status.
- [ ] Filtre por tipo de estudo.
- [ ] Filtre por data inicial e final.
- [ ] Ordene por curso.
- [ ] Ordene por horas estudadas.
- [ ] Ordene por horas planejadas.
- [ ] Limpe todos os filtros.

## 13. Paginação

- [ ] Cadastre mais de 10 sessões.
- [ ] A paginação aparece.
- [ ] Avançar e voltar de página funciona.
- [ ] Alterar um filtro retorna à primeira página.

## 14. Exclusão lógica

- [ ] Exclua uma sessão com horas.
- [ ] A confirmação informa que será possível restaurar.
- [ ] A sessão some da lista ativa.
- [ ] As horas são removidas do total do curso.
- [ ] Selecione **Lixeira**.
- [ ] A sessão aparece com visual de excluída.
- [ ] Clique em Restaurar.
- [ ] A sessão volta à lista ativa.
- [ ] As horas voltam para o curso.

## 15. Integração com Cursos

- [ ] Em `/cursos`, cada curso ativo possui ação para registrar estudo.
- [ ] A ação abre `/estudos` com o curso já selecionado.
- [ ] No detalhe do curso, o botão Registrar estudo funciona.
- [ ] O detalhe mostra as dez sessões mais recentes.
- [ ] Cursos arquivados não aparecem na seleção de novas sessões.

## 16. Segurança e isolamento

- [ ] Crie uma segunda conta.
- [ ] A segunda conta não vê sessões da primeira.
- [ ] Tentar usar o ID de um curso de outra conta é bloqueado.
- [ ] Tentar usar um tipo de estudo de outra conta é bloqueado.
- [ ] Tentar abrir ou alterar uma sessão de outra conta retorna não encontrado ou acesso negado.

## 17. Responsividade

- [ ] No celular, o formulário abre como painel inferior rolável.
- [ ] Os campos possuem largura confortável.
- [ ] A lista vira cards sem rolagem horizontal indevida.
- [ ] Os botões de editar, duplicar, excluir e restaurar podem ser tocados.
- [ ] O conteúdo não fica escondido pela navegação inferior.

## 18. Testes técnicos

```cmd
npm run typecheck
npm run lint
npm run build
```

- [ ] TypeScript sem erros.
- [ ] ESLint sem erros.
- [ ] Build concluído.
- [ ] Console do navegador sem erros vermelhos.
