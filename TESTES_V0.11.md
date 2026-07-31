# Roteiro de testes — v0.11 Dashboard

Realize os testes usando a mesma conta que já possui cursos, sessões e certificados das versões anteriores.

## 1. Preparação

1. Extraia a v0.11 em uma pasta nova.
2. Execute `npm install`.
3. Não execute SQL novo no Supabase.
4. Execute `npm run dev`.
5. Entre na mesma conta.
6. Abra `http://localhost:3000/dashboard`.

**Esperado:** o Dashboard abre sem dados demonstrativos fixos e carrega os dados reais da conta.

---

## 2. Filtro de período

Teste, um de cada vez:

- Últimos 7 dias;
- Últimos 30 dias;
- Mês atual;
- Ano atual;
- Todo o período;
- Personalizado.

No personalizado, escolha uma data inicial e final válidas.

**Esperado:** todos os cards e gráficos são atualizados em conjunto e o período ativo aparece claramente na tela.

---

## 3. Filtros globais

Teste separadamente e depois combinados:

- Área;
- Plataforma;
- Status do curso;
- Tipo de estudo.

Exemplo: `Mês atual + Excel + Em andamento + Exercício`.

**Esperado:** os mesmos filtros afetam os blocos correspondentes sem recarregar a página inteira.

Clique em **Limpar filtros**.

**Esperado:** volta ao padrão `Mês atual`, sem filtros adicionais.

---

## 4. Total de horas

Escolha um período em que você conheça as sessões registradas e some manualmente as horas.

**Esperado:** o card **Total de horas** é igual à soma das sessões não excluídas dentro dos filtros.

Sessões na lixeira não podem entrar no total.

---

## 5. Cursos concluídos

Escolha um curso concluído com `Data de conclusão` preenchida.

Filtre um período que inclua essa data e depois outro que não inclua.

**Esperado:** o card **Cursos concluídos** muda de acordo com o período.

---

## 6. Em andamento

Conte os cursos atuais com status **Em andamento**.

**Esperado:** o card mostra a mesma quantidade quando nenhum filtro incompatível estiver ativo.

Teste também o filtro de status `Concluído`.

**Esperado:** o card Em andamento passa a zero, pois os filtros são globais.

---

## 7. Certificados obtidos

Use um certificado marcado como **Disponível** e com data de emissão.

Filtre um período que inclua a emissão e outro que não inclua.

**Esperado:** o card **Certificados obtidos** acompanha o período.

Certificado pendente ou na lixeira não deve contar.

---

## 8. Progresso geral

Crie ou use este cenário simples:

- Curso A: carga 10h, 5h estudadas;
- Curso B: carga 30h, 15h estudadas.

Sem outros cursos nos filtros, o progresso deve ser 50%:

`(5 + 15) ÷ (10 + 30) = 50%`.

Depois marque o Curso A como Concluído.

**Esperado:** o Curso A passa a contribuir com 10h para o progresso global, mantendo a mesma regra da tela Estudos.

Cursos cancelados e cursos com carga zero não entram no denominador.

---

## 9. Evolução mensal

Selecione **Ano atual**.

**Esperado:** o gráfico apresenta os meses do período, mantendo zero para meses sem horas quando estiverem dentro da sequência exibida.

Selecione **Todo o período**.

**Esperado:** são mostrados até os 12 meses mais recentes com dados/período de cobertura.

---

## 10. Horas por área

Registre sessões em pelo menos duas áreas diferentes.

**Esperado:** as barras aparecem ordenadas da maior quantidade de horas para a menor.

A soma deve ser compatível com o card Total de horas.

---

## 11. Cursos por status

Compare a legenda do painel com a aba Cursos.

**Esperado:** a quantidade de cursos por status corresponde aos cursos não arquivados dentro dos filtros.

---

## 12. Progresso por curso

Abra o painel **Progresso por curso**.

**Esperado:**

- cursos concluídos/cancelados não aparecem como cursos ativos;
- prioridade influencia a ordenação;
- a barra usa o progresso real;
- as horas restantes são exibidas;
- clicar no nome abre o detalhe do curso.

---

## 13. Tipos de estudo

Registre sessões de Aula, Revisão e Exercício.

**Esperado:** o painel mostra as horas de cada tipo e respeita o filtro global de Tipo de estudo.

---

## 14. Plataformas

Use cursos de duas ou mais plataformas.

**Esperado:** o painel mostra horas por plataforma e continua mostrando plataformas dos cursos filtrados mesmo quando uma delas possui zero hora no período.

---

## 15. Próximos prazos

Configure metas de conclusão futuras em alguns cursos ativos.

**Esperado:**

- aparecem apenas metas futuras;
- são ordenadas pela data mais próxima;
- prazo nos próximos 7 dias recebe destaque;
- cursos concluídos/cancelados não aparecem;
- clicar no curso abre o detalhe.

---

## 16. Recentemente concluídos e Últimos estudos

**Esperado:**

- concluídos são ordenados da data de conclusão mais recente para a mais antiga;
- Últimos estudos mostra até cinco sessões com horas maiores que zero;
- data, assunto, tipo e horas correspondem aos registros reais.

---

## 17. Consistência

Use um período com dias estudados e dias sem estudo.

Passe o mouse sobre os quadrados.

**Esperado:** o tooltip nativo informa data, horas e quantidade de sessões; a intensidade aumenta conforme as horas.

No celular, o calendário deve quebrar em menos colunas sem rolagem horizontal.

---

## 18. Previsão de conclusão

Com cursos ativos e horas estudadas no período:

**Esperado:** o sistema mostra horas restantes e uma estimativa em semanas.

Use um período sem nenhuma hora.

**Esperado:** a previsão mostra `Sem média`, sem produzir erro ou divisão por zero.

---

## 19. Estados vazios

Escolha filtros que não retornem nenhum dado.

**Esperado:** nenhum gráfico fica vazio sem explicação. Cada painel apresenta uma mensagem contextual.

---

## 20. Lembrar filtros

Em Configurações, deixe **Lembrar filtros** ativado.

1. aplique filtros no Dashboard;
2. vá para outra aba;
3. volte ao Dashboard na mesma sessão do navegador.

**Esperado:** os filtros permanecem.

Desative a preferência em Configurações e repita.

**Esperado:** o Dashboard volta ao padrão ao abrir novamente.

---

## 21. Responsividade

No Chrome DevTools, teste aproximadamente:

- 390 × 844;
- 768 × 1024;
- desktop 1366 × 768 ou maior.

**Esperado:**

- sem rolagem horizontal indevida;
- filtros utilizáveis;
- cards legíveis;
- gráficos reorganizados em uma coluna no celular;
- navegação inferior continua acessível.

---

## 22. Segurança entre contas

Se possuir uma segunda conta de teste:

1. crie dados na conta A;
2. saia;
3. entre na conta B;
4. abra o Dashboard.

**Esperado:** nenhum curso, hora, certificado ou gráfico da conta A aparece na conta B.

---

## 23. Volume

Se houver muitos registros, altere filtros repetidamente.

**Esperado:** a interface continua respondendo e o backend consegue buscar mais de 1.000 sessões usando paginação interna.

---

## 24. Testes técnicos

Pare o servidor e execute:

```cmd
npm run typecheck
npm run lint
npm run build
```

Todos devem finalizar sem erros.

Abra novamente com `npm run dev`, pressione F12 e confira a aba **Console**.

**Esperado:** nenhum erro vermelho relevante.
