# Testes da versão 0.8 — Tela Estudos dinâmica

Esta versão não exige nova migração SQL. Ela utiliza as tabelas e campos criados nas versões 0.4 a 0.7.

## 1. Preparação

- [ ] A v0.7 estava funcionando com a mesma conta e o mesmo projeto Supabase.
- [ ] O `.env.local` está presente e contém somente URL pública, Publishable Key e URL local.
- [ ] Não existe chave `sb_secret_` no projeto.
- [ ] As migrações v0.4, v0.5, v0.6 e v0.7 já foram executadas.
- [ ] Existem cursos importados e pelo menos algumas sessões de estudo.
- [ ] `npm install` terminou sem erro fatal.

## 2. Seis indicadores obrigatórios

Abra `/estudos` e confira:

- [ ] **Cursos ativos** conta somente cursos com status Em andamento.
- [ ] **Horas estudadas** soma as horas das sessões ativas.
- [ ] **Meta do mês** usa apenas horas do mês atual.
- [ ] O percentual da meta pode passar de 100%, embora a barra fique visualmente limitada.
- [ ] **Sequência** conta dias consecutivos com horas maiores que zero.
- [ ] Se hoje ainda não tiver estudo, mas ontem tiver, aparece `estude hoje para manter`.
- [ ] **Concluídos** conta cursos com status Concluído.
- [ ] **Progresso geral** é ponderado pela carga horária.

### Teste controlado do progresso

Crie dois cursos de teste:

```text
Curso A: 10h
Curso B: 30h
```

Registre 5h no A e 15h no B.

- [ ] O progresso geral considerado para esses dois cursos é 50%.
- [ ] Marcar um curso como Concluído o leva a 100% no cálculo individual.
- [ ] Curso cancelado não participa do progresso geral.
- [ ] Curso sem carga horária não provoca divisão por zero.

## 3. Curso Atual

- [ ] A lista exibe os cursos disponíveis.
- [ ] Selecione um curso.
- [ ] Aparecem plataforma, área, status, carga, horas, restante e progresso.
- [ ] A meta de conclusão aparece quando cadastrada.
- [ ] Atualize a página com F5.
- [ ] O mesmo curso continua selecionado.
- [ ] Saia da conta e entre novamente.
- [ ] O Curso Atual continua salvo.
- [ ] Trocar o Curso Atual atualiza `user_settings.current_course_id` no Supabase.

## 4. Foco de Hoje

Crie ao menos três sessões para hoje com cursos de prioridades diferentes.

- [ ] Apenas sessões de hoje e não canceladas aparecem.
- [ ] Prioridade Alta aparece antes de Média e Baixa.
- [ ] O botão **Iniciar** muda uma sessão Planejada para Em andamento.
- [ ] O botão **Concluir** conclui uma sessão que já possua horas.
- [ ] Tentar concluir sessão com zero hora abre a edição e pede para informar horas.
- [ ] O botão de lápis abre a sessão correta.
- [ ] Sem sessões para hoje, aparece o estado vazio com **Planejar estudo de hoje**.

## 5. Últimos Estudos

- [ ] Exibe no máximo cinco registros.
- [ ] Só entram sessões com horas estudadas maiores que zero.
- [ ] A ordem usa data mais recente e atualização mais recente.
- [ ] Cada item mostra curso, assunto, data, tipo e horas.
- [ ] Clicar em um item abre a edição correta.

## 6. Horas por Área

- [ ] As horas são agrupadas pela área atual do curso.
- [ ] Alterar a área de um curso faz o histórico aparecer na nova área.
- [ ] Excluir uma sessão remove suas horas do gráfico.
- [ ] Restaurar a sessão devolve as horas ao gráfico.
- [ ] Áreas são ordenadas da maior carga estudada para a menor.

## 7. Evolução Semanal

- [ ] Exibe as últimas oito semanas.
- [ ] A semana começa na segunda-feira.
- [ ] Semana sem estudo aparece com zero.
- [ ] Passar o mouse sobre uma coluna mostra intervalo e total no `title` do navegador.
- [ ] Registrar uma sessão em semana anterior atualiza a coluna correspondente.

## 8. Calendário de Consistência

- [ ] Exibe a quantidade de dias configurada em Configurações.
- [ ] O padrão é 30 dias.
- [ ] Hoje possui contorno especial.
- [ ] Dias sem horas ficam neutros.
- [ ] Dias com horas têm intensidade crescente.
- [ ] Cada quadrado possui número do dia, não dependendo somente de cor.
- [ ] Passar o mouse mostra data, horas e quantidade de sessões.
- [ ] Clicar em um dia abre a lista das sessões daquela data.
- [ ] Clicar em uma sessão abre sua edição.

## 9. Atualização automática após CRUD

Sem recarregar a página:

- [ ] Crie uma nova sessão com horas.
- [ ] Horas totais atualizam.
- [ ] Meta mensal atualiza quando a sessão é do mês atual.
- [ ] Sequência atualiza se a sessão for hoje.
- [ ] Curso Atual atualiza se a sessão pertencer ao curso selecionado.
- [ ] Últimos Estudos atualiza.
- [ ] Horas por Área atualiza.
- [ ] Evolução Semanal atualiza.
- [ ] Calendário de Consistência atualiza.
- [ ] Edite as horas e confirme novo recálculo.
- [ ] Exclua e restaure a sessão e confirme os dois recálculos.

## 10. Registro de Estudos

- [ ] Busca continua funcionando.
- [ ] Filtros por curso, status, tipo e período continuam funcionando.
- [ ] Lixeira continua funcionando.
- [ ] Ordenação continua funcionando.
- [ ] Paginação continua funcionando.
- [ ] Criar, editar, duplicar, excluir e restaurar continuam funcionando.

## 11. Fuso horário

Em Configurações, confirme o fuso `America/Sao_Paulo`.

- [ ] O sistema usa esse fuso para determinar hoje.
- [ ] Foco de Hoje usa a data local do fuso configurado.
- [ ] Sequência usa a mesma referência de hoje.
- [ ] Dias futuros não entram na sequência.

## 12. Responsividade

Teste no DevTools:

```text
390 x 844
375 x 812
768 x 1024
```

- [ ] Os seis cards não estouram a largura.
- [ ] Curso Atual continua legível.
- [ ] Foco de Hoje reorganiza ações sem cortar conteúdo.
- [ ] Registro de Estudos vira cards no celular.
- [ ] Gráfico semanal cabe na tela.
- [ ] Calendário muda o número de colunas conforme a largura.
- [ ] Detalhe do dia aparece abaixo do calendário em telas menores.
- [ ] Não existe rolagem horizontal indevida.

## 13. Persistência e segurança

- [ ] Segunda conta não vê Curso Atual, sessões ou métricas da primeira.
- [ ] Cada conta possui sua própria meta mensal.
- [ ] Alterar Curso Atual em uma conta não altera a outra.
- [ ] RLS das versões anteriores continua ativa.

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
