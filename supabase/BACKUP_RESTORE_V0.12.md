# Backup e restauração — v0.12

## O que o backup contém

O botão **Configurações → Privacidade → Baixar backup completo** gera um JSON autenticado contendo:

- perfil e preferências;
- plataformas, áreas, tipos de estudo e categorias;
- cursos e certificações;
- sessões de estudo;
- anotações;
- certificados e metadados de arquivo;
- histórico de importações;
- logs técnicos da própria conta;
- contagens para conferência.

Os binários PDF/JPG/PNG do bucket privado não são incorporados ao JSON. O `storageManifest` mantém `fileKey`, nome, tipo e tamanho para conferência.

## Procedimento seguro de restauração

1. Gere um backup novo do ambiente atual antes de qualquer alteração.
2. Nunca restaure diretamente em produção como primeiro teste.
3. Crie ou utilize um projeto Supabase de homologação.
4. Aplique todas as migrações, da v0.4 à v0.10, na ordem.
5. Valide `backupFormat = gestao-estudos-backup` e `schemaVersion = 0.12`.
6. Compare as contagens do bloco `counts` com os arrays do backup.
7. Restaure primeiro listas configuráveis, preservando o mapeamento dos UUIDs.
8. Restaure cursos.
9. Restaure sessões, anotações e certificados respeitando as relações com cursos/listas.
10. Reenvie manualmente os arquivos privados de certificados quando necessário e atualize `file_key` somente após confirmar o upload.
11. Compare totais, horas, progresso, revisões e certificados com o ambiente original.
12. Execute os testes end-to-end antes de considerar a restauração aprovada.

## Regra de produção

Na v0.12 a restauração permanece deliberadamente **controlada/manual**. Não existe botão de “restaurar tudo” na interface para evitar duplicação, sobrescrita acidental e corrupção de relacionamentos.
