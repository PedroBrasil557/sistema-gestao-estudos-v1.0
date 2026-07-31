# Homologação final — versão 1.0

A versão 1.0 só deve ser considerada pronta para produção após a execução dos testes abaixo.

## A. Testes técnicos

No CMD, dentro da pasta do projeto:

```cmd
npm install
npm run typecheck
npm run lint
npm run build
```

Ou:

```cmd
npm run check
```

Todos devem terminar sem erro.

Depois, revise as dependências:

```cmd
npm audit
```

Não use `npm audit fix --force` automaticamente. Se houver alertas, avalie quais dependências são afetadas antes de aceitar mudanças que possam quebrar o projeto.

## B. Autenticação e conta

- [ ] Criar uma conta de teste.
- [ ] Confirmar o e-mail.
- [ ] Entrar com senha correta.
- [ ] Bloquear senha incorreta.
- [ ] Atualizar a página e manter a sessão.
- [ ] Fazer logout e impedir acesso às páginas privadas.
- [ ] Recuperar senha por e-mail.
- [ ] Alterar nome no perfil e confirmar persistência.

## C. Configurações

- [ ] Alterar meta mensal e salvar.
- [ ] Alterar meta anual de certificados.
- [ ] Alterar fuso horário.
- [ ] Alterar Curso Atual.
- [ ] Criar, renomear, arquivar e restaurar uma plataforma/área de teste.
- [ ] Confirmar que valores em uso não são removidos de forma destrutiva.

## D. Cursos

- [ ] Criar curso de teste com carga de 30h.
- [ ] Editar o curso.
- [ ] Pesquisar e filtrar.
- [ ] Registrar 15h de estudo e confirmar progresso de 50%.
- [ ] Marcar como concluído e confirmar 100% e data de conclusão.
- [ ] Criar curso com carga zero e confirmar ausência de divisão por zero.
- [ ] Arquivar curso com histórico e confirmar preservação dos registros.

## E. Importação

- [ ] Abrir a importação da trilha oficial.
- [ ] Conferir os 56 registros na pré-visualização.
- [ ] Testar arquivo com linha válida e inválida.
- [ ] Repetir uma importação e confirmar proteção contra duplicidade.
- [ ] Baixar o relatório de importação.

## F. Estudos

- [ ] Criar sessão planejada para hoje.
- [ ] Confirmar em Foco de Hoje.
- [ ] Iniciar e concluir a sessão.
- [ ] Criar duas sessões no mesmo dia e conferir soma diária.
- [ ] Confirmar atualização de Horas Estudadas, Meta do Mês e Progresso Geral.
- [ ] Confirmar Últimos Estudos.
- [ ] Confirmar Horas por Área.
- [ ] Confirmar Evolução Semanal.
- [ ] Clicar em um dia do Calendário de Consistência.
- [ ] Atualizar a página e confirmar persistência do Curso Atual.

## G. Anotações

- [ ] Criar anotação vinculada a curso.
- [ ] Pesquisar pelo título e conteúdo.
- [ ] Criar revisão vencida e confirmar painel de revisão.
- [ ] Marcar como revisada e conferir `reviewedAt` pela interface/comportamento.
- [ ] Reagendar revisão.
- [ ] Arquivar/excluir logicamente e restaurar.

## H. Certificados

- [ ] Criar certificado vinculado a curso.
- [ ] Cadastrar certificado apenas com código/link.
- [ ] Enviar PDF válido.
- [ ] Visualizar e baixar o arquivo usando acesso autenticado.
- [ ] Substituir o arquivo.
- [ ] Rejeitar arquivo inválido ou acima do limite.
- [ ] Confirmar alerta de validade próxima quando aplicável.
- [ ] Confirmar que o bucket continua privado.

## I. Dashboard

- [ ] Conferir os seis indicadores com dados conhecidos.
- [ ] Filtrar por 7 dias, 30 dias, mês e ano.
- [ ] Filtrar por área.
- [ ] Filtrar por plataforma.
- [ ] Filtrar por status de curso.
- [ ] Filtrar por tipo de estudo.
- [ ] Combinar filtros e confirmar que todos os cards/gráficos reagem em conjunto.
- [ ] Limpar os filtros.
- [ ] Conferir estado vazio em um período sem dados.

## J. Backup e exportação

- [ ] Baixar backup JSON.
- [ ] Confirmar `backupFormat = gestao-estudos-backup`.
- [ ] Confirmar `schemaVersion = 1.0`.
- [ ] Baixar CSV de Cursos, Estudos, Anotações e Certificados.
- [ ] Abrir os CSVs no Excel e conferir acentos.
- [ ] Confirmar que arquivos privados de certificados não são incorporados diretamente ao JSON.

## K. Segurança entre contas

Use duas contas de teste diferentes.

- [ ] Conta A não enxerga cursos da Conta B.
- [ ] Conta A não enxerga sessões da Conta B.
- [ ] Conta A não enxerga anotações da Conta B.
- [ ] Conta A não abre certificado privado da Conta B.
- [ ] Tentativa de usar ID de outra conta retorna acesso negado/não encontrado.

## L. Responsividade e acessibilidade

Testar pelo menos em 375×812, 390×844 e 768×1024.

- [ ] Sem rolagem horizontal indevida.
- [ ] Menu móvel funcionando.
- [ ] Formulários utilizáveis no celular.
- [ ] Cards e gráficos legíveis.
- [ ] Navegação por teclado no desktop.
- [ ] Foco visual presente.
- [ ] Link “Pular para o conteúdo principal” funcionando.
- [ ] Labels dos campos legíveis.

## M. GitHub e produção

- [ ] `.env.local` está ignorado pelo Git.
- [ ] Nenhuma Secret Key aparece no repositório.
- [ ] Workflow de qualidade executa no GitHub.
- [ ] Tag `v1.0.0` criada após aprovação.
- [ ] Variáveis de ambiente configuradas na Vercel.
- [ ] URLs de produção cadastradas no Supabase Auth.
- [ ] Fluxos críticos repetidos na URL de produção.

## Aprovação

Quando todos os itens críticos estiverem aprovados, registre a versão como `v1.0.0` e mantenha essa tag como referência estável. Ajustes posteriores entram em novas versões, sem reescrever a v1.0.
