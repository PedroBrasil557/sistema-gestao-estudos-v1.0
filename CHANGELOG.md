# Versão 1.1.2 — Correção de qualidade e build

## Correções

- Corrigida a tipagem das consultas das listas configuráveis no Supabase.
- Removidos espaços dos campos de `.select(...)` que geravam `ParserError` no TypeScript.
- Corrigida a renderização dinâmica do ícone nos detalhes do curso para atender ao React Compiler.
- Mantidas integralmente as correções de menu móvel e tela Estudos da v1.1.1.
- Nenhuma alteração no banco de dados ou nos registros existentes.

# Versão 1.1.1 — Responsividade e fidelidade visual

## Correções

- Corrigido o menu lateral móvel para manter logotipo, nomes das abas, ícones, perfil e saída alinhados.
- Corrigido o conflito entre o menu recolhido do tablet e o drawer do celular.
- Drawer móvel agora usa altura dinâmica, bloqueia a rolagem da página e fecha com a tecla Esc.
- Tela Estudos reorganizada para seguir a imagem aprovada:
  - resumo Hoje, Semana e Sequência com ícones coloridos;
  - progresso semanal;
  - estudos do dia em cartões responsivos;
  - Idiomas e Profissionalizantes em painéis paralelos;
  - cartões compactos de cursos com botão Registrar;
  - estados vazios menores e sem áreas excessivas;
  - Registros recentes e Consistência alinhados.
- Ajustes específicos para 375 px, 390 px, 430 px, tablet, notebook e desktop.
- Nenhuma alteração no banco de dados ou nos registros existentes.

# Changelog

## v1.1.0 — Redesign completo

- Redesenhada toda a interface com base nas imagens aprovadas, preservando a estrutura funcional da v1.0.
- Criado novo menu lateral azul-marinho, recolhível e responsivo.
- Padronizados cabeçalhos com data dinâmica, botões, cartões pastel, badges, barras de progresso e estados vazios.
- Separados os fluxos Registrar estudo e Planejar estudo.
- Adicionados duração por minutos, atalhos rápidos, horário, habilidade de idioma, recurso, recorrência e lembrete.
- Reorganizada a aba Estudos para uso diário, com Hoje, Semana, Sequência, planejamentos, cursos em andamento, recentes e consistência.
- Substituída a tabela principal de Cursos por grid de cartões coloridos e filtros por Idiomas e Profissionalizantes.
- Simplificado o formulário de curso e reorganizados os detalhes em abas internas.
- Simplificado o Dashboard para quatro indicadores e cinco análises úteis.
- Transformada a aba Anotações em mural colorido com checklist e rascunho.
- Transformada a aba Certificados em grid visual com miniaturas, validade e conquistas recentes.
- Adicionada personalização de cor principal, menu, botões, cursos, categorias e tonalidade dos cartões.
- Criada migration aditiva `202608060007_v1_1_redesign.sql`, sem exclusão de dados.
- Adicionados roteiro de homologação, guia do GitHub Desktop e documentação da release.

## v1.0.0 — Versão final do MVP

- Consolidado o MVP completo em uma versão estável para homologação e publicação.
- Atualizado o número da aplicação para `1.0.0`.
- Atualizado o formato lógico de backup para `schemaVersion = 1.0`.
- Adicionado roteiro completo `TESTES_V1.0.md`.
- Adicionadas instruções para criar o projeto como repositório novo no GitHub.
- Adicionada orientação de deploy na Vercel e configuração de URLs de produção no Supabase.
- Adicionado workflow de qualidade para GitHub Actions com TypeScript, ESLint e build.
- Documentado o processo de ajustes e versionamento após a v1.0.
- Preservada a configuração local pública do Supabase em `.env.local`, que permanece ignorada pelo Git.
- Nenhuma nova migração SQL é exigida nesta versão.

## v0.11.0 — Dashboard analítico real

- Substituído o Dashboard demonstrativo por dados reais do Supabase.
- Implementados filtros globais por período, área, plataforma, status do curso e tipo de estudo.
- Implementados períodos de 7 dias, 30 dias, mês atual, ano atual, todo o período e intervalo personalizado.
- Implementada preservação de filtros em `sessionStorage` conforme a preferência da conta.
- Implementados os seis indicadores obrigatórios: horas, concluídos, em andamento, certificados, média mensal e progresso geral.
- Implementados evolução mensal, horas por área, cursos por status, progresso por curso, tipos de estudo e plataformas.
- Implementados próximos prazos, concluídos recentes, últimos estudos, resumo do período, consistência e previsão de conclusão.
- Adicionados estados de carregamento, erro e ausência de dados.
- Criada a rota autenticada `/api/dashboard`.
- Implementada paginação interna do backend para históricos acima do limite padrão de 1.000 registros.
- Preservados autenticação, configurações, cursos, importação, sessões, Estudos, Anotações, Certificados e `.env.local`.
- A v0.11 não requer nova migração SQL.

## v0.10.0 — Certificados e arquivos privados

- Criada a tabela `certificates` com Row Level Security.
- Criado bucket privado `certificates` no Supabase Storage.
- Implementado CRUD real de certificados vinculado a curso/certificação.
- Implementados disponibilidade, código de credencial, link de validação, conclusão, emissão, validade e observações.
- Implementado upload de PDF/JPG/JPEG/PNG até 10 MB.
- Implementadas visualização e download por URL assinada temporária.
- Implementada substituição segura do arquivo privado.
- Implementados certificados sem arquivo, usando somente código ou link.
- Implementados alertas de validade próxima e expiração.
- Implementadas busca, filtros, paginação visual, exclusão lógica e restauração.
- Implementados indicadores reais, meta anual, evolução mensal e distribuição por área.
- Integrados certificados à página de detalhes do curso.
- Preservados autenticação, configurações, cursos, importação, sessões, Estudos, Anotações e `.env.local`.

## v0.9.0 — Anotações e revisões

- Criada a tabela `notes` com Row Level Security.
- Implementado CRUD real de anotações vinculado a curso e categoria.
- Implementados título, assunto, conteúdo Markdown, importância, revisão, link externo e tags.
- Adicionado editor Markdown simples com atalhos de negrito, lista, link e bloco de código/fórmula.
- Implementadas busca, filtros, paginação visual e lixeira.
- Implementados indicadores reais da aba Anotações.
- Implementado painel de revisões atrasadas, de hoje e próximas.
- Implementadas marcação como revisada, reabertura e reagendamento.
- `reviewed_at` registra o momento da revisão sem apagar a data original.
- Implementadas exclusão lógica e restauração.
- Adicionadas validações de propriedade do curso e da categoria no backend e no banco.
- Integradas anotações recentes à página de detalhes do curso.
- Adicionada ação rápida de nova anotação a partir de um curso.
- Preservados autenticação, configurações, cursos, importação, sessões, tela Estudos e `.env.local`.

## v0.8.0 — Tela Estudos dinâmica

- Substituídos os indicadores centrados em sessões pelos seis indicadores obrigatórios do produto.
- Implementados Cursos Ativos, Horas Estudadas, Meta do Mês, Sequência, Concluídos e Progresso Geral.
- Implementado cálculo de sequência considerando o fuso horário configurado.
- Implementado progresso geral ponderado pela carga horária.
- Implementado Curso Atual persistente por `user_settings.current_course_id`.
- Adicionado painel do Curso Atual com plataforma, área, status, carga, horas, restante, progresso e meta de conclusão.
- Implementado Foco de Hoje com ordenação por prioridade e ações rápidas.
- Implementados Últimos Estudos com os cinco registros recentes que possuem horas.
- Implementado gráfico real de Horas por Área.
- Implementada Evolução Semanal contínua das últimas oito semanas, iniciando na segunda-feira.
- Implementado Calendário de Consistência com dias configuráveis e detalhe clicável por data.
- Todos os blocos recalculam imediatamente após criar, editar, excluir ou restaurar sessões.
- Preservados banco, autenticação, importação, CRUD de cursos, CRUD de sessões e `.env.local`.
- A v0.8 não requer nova migração SQL.

## v0.7.0 — Sessões de estudo

- Criada a tabela `study_sessions` com RLS.
- Adicionado o campo automático `studied_hours` em `courses`.
- Implementado cadastro, edição, duplicação, exclusão lógica e restauração de sessões.
- Adicionados filtros por curso, status, tipo, período e lixeira.
- Adicionadas busca, ordenação e paginação.
- Implementados indicadores reais da tela Estudos.
- Implementado limite diário de 24 horas no backend e no banco.
- Implementada validação de propriedade do curso e do tipo de estudo.
- Implementados gatilhos de recálculo das horas dos cursos.
- Adicionado histórico de sessões na página de detalhe do curso.
- Adicionadas ações rápidas para registrar estudo a partir do curso.
- Preservados autenticação, configurações, importação, dados e `.env.local`.

## v0.6.0 — Importação da trilha inicial

- Adicionada importação da trilha oficial com 56 registros.
- Transcritos os 49 cursos e 7 certificações do Apêndice A da especificação.
- Adicionada importação de arquivos CSV próprios.
- Adicionado download de modelo CSV.
- Implementada pré-visualização sem gravação no banco.
- Implementadas validações por linha e mensagens compreensíveis.
- Implementada identificação de duplicidades existentes e internas ao arquivo.
- Adicionadas estratégias **Ignorar duplicados** e **Atualizar existentes**.
- Implementada criação automática de plataformas e áreas ausentes.
- Implementada restauração de listas arquivadas durante a importação.
- Criada a tabela `course_imports` com RLS e relatório em JSON.
- Implementada chave idempotente para impedir repetição da mesma importação.
- Implementado relatório final por linha e exportação do relatório em CSV.
- Adicionado histórico técnico de importações.
- Preservados autenticação, configurações, cursos e `.env.local` da v0.5.

## v0.5.0 — Cursos e certificações

- CRUD real de cursos e certificações, detalhes, filtros, arquivamento, Curso Atual e exportação CSV.

## v0.4.0 — Configurações persistentes

- Perfis, preferências, metas, aparência e listas configuráveis no Supabase.

## v0.3.0 — Autenticação

- Cadastro, confirmação de e-mail, login, sessão, recuperação de senha e perfil.

## 0.12.0 — Qualidade, exportação e backup

- Backup lógico completo da conta em JSON.
- Exportações CSV de cursos, sessões, anotações e certificados.
- Paginação interna das exportações para históricos com mais de 1.000 registros.
- Registro das exportações e backups em `audit_logs`.
- Central de dados em Configurações → Privacidade.
- Documentação controlada de backup e restauração.
- Cabeçalhos HTTP de segurança no Next.js.
- Link “Pular para o conteúdo principal”.
- Reforço de foco visível e suporte a `prefers-reduced-motion`.
- Nenhuma nova migração SQL necessária.
