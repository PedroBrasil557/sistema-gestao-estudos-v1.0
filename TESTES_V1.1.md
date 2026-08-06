# Testes de homologação — v1.1.0

Marque cada item apenas depois de testar com a mesma conta e os registros usados na v1.0.

## 1. Preparação

- [ ] Fiz backup JSON pela v1.0 antes da migration.
- [ ] Executei `202608060007_v1_1_redesign.sql` uma única vez.
- [ ] As tabelas antigas continuam no Supabase.
- [ ] Cursos, sessões, anotações e certificados antigos continuam presentes.
- [ ] O `.env.local` não aparece no GitHub Desktop.

## 2. Testes técnicos

```cmd
npm run typecheck
npm run lint
npm run build
```

- [ ] TypeScript sem erros.
- [ ] ESLint sem erros.
- [ ] Build de produção concluído.
- [ ] Console do navegador sem erros críticos.

## 3. Navegação e identidade visual

- [ ] Menu lateral aparece em todas as páginas internas.
- [ ] Item atual fica destacado.
- [ ] Menu pode ser recolhido no desktop.
- [ ] Drawer abre e fecha no celular.
- [ ] Perfil abre corretamente.
- [ ] Data é real, em pt-BR, e não está fixa em 2025.
- [ ] Cartões possuem cores suaves e não são todos brancos.
- [ ] Foco por teclado é visível.

## 4. Estudos

- [ ] Resumo mostra Hoje, Semana e Sequência.
- [ ] Planejamentos de hoje aparecem em cartões.
- [ ] Concluir planejamento atualiza horas, progresso e consistência.
- [ ] Reagendar cria um novo planejamento sem apagar o histórico concluído.
- [ ] Registrar estudo abre modal próprio.
- [ ] Planejar estudo abre modal diferente.
- [ ] Atalhos 15, 30, 45, 60, 90 e 120 minutos funcionam.
- [ ] Campo manual de minutos funciona.
- [ ] Curso de idioma permite habilidade estudada.
- [ ] Planejamento permite horário, recurso, recorrência e lembrete.
- [ ] Cursos em andamento aparecem separados por grupo.
- [ ] Registros recentes e drawer de todos os registros funcionam.
- [ ] Calendário de consistência responde aos dados reais.

## 5. Cursos

- [ ] Busca por nome, área ou plataforma funciona.
- [ ] Chips Todos, Idiomas, Profissionalizantes, Em andamento, Concluídos e Arquivados funcionam.
- [ ] Cartões mostram cor, ícone, status, progresso e plataforma.
- [ ] Curso atual possui etiqueta.
- [ ] Novo curso permite escolher grupo, cor e ícone.
- [ ] Idioma permite níveis, meta semanal e objetivo.
- [ ] Profissionalizante permite carga, datas e certificado.
- [ ] Editar, definir como atual, arquivar, restaurar e excluir respeitam as regras anteriores.
- [ ] Detalhe mantém o menu lateral.
- [ ] Abas Visão geral, Progresso, Recursos, Anotações, Certificados e Histórico funcionam.

## 6. Dashboard

- [ ] Exibe quatro indicadores principais.
- [ ] Abas Visão geral, Idiomas e Profissionalizantes filtram corretamente.
- [ ] Evolução das horas usa os registros reais.
- [ ] Distribuição do tempo soma corretamente por curso.
- [ ] Progresso dos cursos confere com a aba Cursos.
- [ ] Calendário de consistência confere com Estudos.
- [ ] Habilidades de idiomas aparecem quando existem registros.
- [ ] Drawer de filtros abre, aplica e limpa filtros.
- [ ] Estado vazio é compacto e compreensível.

## 7. Anotações

- [ ] Anotações aparecem em cartões, não em tabela principal.
- [ ] Busca e chips funcionam.
- [ ] Cor pode vir do curso, categoria ou seleção manual.
- [ ] Nova anotação salva título, categoria e conteúdo.
- [ ] Checklist reconhece `[ ]` e `[x]`.
- [ ] Rascunho, importante, revisão e dúvida funcionam.
- [ ] Revisões de hoje e dúvidas pendentes aparecem no painel lateral.
- [ ] Editar, excluir, lixeira e restaurar continuam funcionando.

## 8. Certificados

- [ ] Quatro indicadores mostram valores reais.
- [ ] Busca e filtros por status, tipo e instituição funcionam.
- [ ] Certificados aparecem em cartões.
- [ ] Miniatura, status, emissão, validade, código e link aparecem quando cadastrados.
- [ ] Visualizar e baixar arquivo privado continuam funcionando.
- [ ] Editar, excluir, lixeira e restaurar continuam funcionando.
- [ ] Validade próxima e vencimento são sinalizados.
- [ ] Conquistas recentes usam certificados reais.

## 9. Configurações

- [ ] Cor principal altera destaques.
- [ ] Cor do menu altera a barra lateral.
- [ ] Cor dos botões altera ações principais.
- [ ] Tonalidade suave, neutra e viva funciona.
- [ ] Cores dos cursos podem ser alteradas.
- [ ] Cores das categorias de anotação podem ser alteradas.
- [ ] Restaurar tema padrão volta à paleta das imagens.
- [ ] Preferências continuam salvas após F5 e novo login.

## 10. Responsividade

Testar aproximadamente em 1440px, 1024px, 768px, 390px e 360px.

- [ ] Nenhuma página possui rolagem horizontal indevida.
- [ ] Cartões quebram para 4, 3, 2 e 1 coluna adequadamente.
- [ ] Modais possuem rolagem e não ficam cortados.
- [ ] Filtros ficam acessíveis no celular.
- [ ] Botões principais permanecem visíveis.
- [ ] Gráficos e calendários continuam legíveis.

## 11. Segurança e regressão

- [ ] Usuário A não acessa dados do usuário B.
- [ ] Rotas internas redirecionam usuário desconectado.
- [ ] Certificados continuam privados.
- [ ] Exportações e backup continuam funcionando.
- [ ] Logout funciona.
- [ ] Recuperação de senha continua funcionando.
- [ ] Vercel Preview e Production possuem as variáveis públicas necessárias.
