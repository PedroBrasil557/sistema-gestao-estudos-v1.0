# Release v1.1.0 — Redesign Completo

## Objetivo

Transformar o Sistema de Gestão de Estudos em uma plataforma pessoal moderna e colorida, fiel às imagens de referência, sem reconstruir o projeto do zero e sem perder dados existentes.

## Entrega funcional

### Estrutura visual
- novo menu lateral azul-marinho, perfil compacto e modo recolhido;
- navegação móvel por drawer;
- cabeçalhos consistentes com data real e timezone da conta;
- paleta pastel, cartões coloridos e componentes reutilizáveis;
- personalização de cores em Configurações.

### Estudos
- resumo compacto de Hoje, Semana e Sequência;
- cartões de planejamentos do dia;
- ações Concluir, Reagendar e Editar;
- cursos em andamento separados por Idiomas e Profissionalizantes;
- registros recentes e calendário de consistência;
- modais separados para Planejar e Registrar;
- duração por minutos com atalhos de 15 min a 2h;
- habilidade de idioma, recurso, recorrência e lembrete.

### Cursos
- grid responsivo de cartões coloridos;
- filtros Todos, Idiomas, Profissionalizantes, Em andamento, Concluídos e Arquivados;
- visão rápida compacta;
- cor, ícone, meta semanal, níveis e objetivo;
- formulário condicional simplificado;
- detalhes do curso em abas internas.

### Dashboard
- somente quatro indicadores principais;
- abas Visão geral, Idiomas e Profissionalizantes;
- evolução diária, distribuição do tempo, progresso dos cursos, consistência e habilidades de idiomas;
- drawer de filtros globais.

### Anotações
- mural responsivo de cartões coloridos;
- cor herdada do curso, categoria ou escolhida manualmente;
- checklist, rascunho, importante e revisão;
- painéis compactos para revisões e dúvidas.

### Certificados
- grid visual com miniatura, status, datas, código e validação;
- filtros simplificados;
- validade próxima e vencimento;
- conquistas recentes;
- upload privado preservado.

## Banco de dados

Migration nova:

```text
supabase/migrations/202608060007_v1_1_redesign.sql
```

A migration é aditiva: preserva tabelas, IDs, relacionamentos, arquivos e registros da v1.0.

## Segurança

- `.env.local` permanece ignorado pelo Git;
- nenhuma Secret Key foi incluída;
- políticas RLS existentes continuam válidas;
- upload de certificados continua privado;
- operações continuam validando usuário e propriedade no servidor.

## Critério para publicar

A release só deve ser incorporada à `main` depois de:

```cmd
npm run typecheck
npm run lint
npm run build
```

Também devem ser aprovados os testes de `TESTES_V1.1.md`, o deploy Preview da Vercel e a conferência dos dados antigos.
