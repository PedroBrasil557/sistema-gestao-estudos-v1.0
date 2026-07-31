# Release 1.0 — Sistema de Gestão de Estudos

## Estado da entrega

Esta versão consolida o MVP completo do projeto em uma base pronta para homologação final e publicação.

## Módulos incluídos

- Autenticação e conta.
- Configurações e listas persistentes.
- Cursos e certificações.
- Importação da trilha de 56 registros.
- Sessões de estudo.
- Tela Estudos dinâmica.
- Anotações e revisões.
- Certificados e arquivos privados.
- Dashboard analítico.
- Exportação e backup lógico.
- Segurança, responsividade e acessibilidade básica.

## Banco de dados

A v1.0 não adiciona uma nova migração. Ela usa cumulativamente todas as migrações existentes entre v0.4 e v0.10.

## Arquivos importantes

- `README.md` — visão geral e execução.
- `TESTES_V1.0.md` — homologação final.
- `GITHUB_NOVO_PROJETO.md` — publicação como repositório novo.
- `DEPLOY_VERCEL.md` — publicação web.
- `docs/AJUSTES_POS_V1.md` — processo de alterações futuras.
- `supabase/BACKUP_RESTORE_V1.0.md` — restauração controlada.
- `.env.example` — modelo sem credenciais reais.

## Próxima fase

Depois da homologação, o sistema entra em manutenção evolutiva. Novos pedidos devem ser versionados e testados sem sobrescrever a referência `v1.0.0`.
