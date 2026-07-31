# Roteiro de testes — versão 0.12

## 1. Instalação e verificação técnica

```cmd
npm install
npm run typecheck
npm run lint
npm run build
```

Todos devem concluir sem erro.

## 2. Configurações → Privacidade

1. Entre com a mesma conta das versões anteriores.
2. Abra `/configuracoes`.
3. Entre em **Privacidade**.
4. Confirme que aparecem os blocos de segurança, backup, exportações individuais e restauração.

## 3. Backup completo JSON

1. Clique em **Baixar backup completo (JSON)**.
2. Abra o arquivo em um editor de texto.
3. Confirme:
   - `backupFormat` = `gestao-estudos-backup`;
   - `schemaVersion` = `0.12`;
   - `account` contém apenas a conta autenticada;
   - existem `lists`, `data`, `storageManifest` e `counts`.
4. Compare pelo menos as contagens de cursos, sessões, anotações e certificados com o sistema.
5. Confirme no Supabase em `audit_logs` um evento `backup.downloaded`.

## 4. Exportações CSV

Baixe, uma por vez:

- Cursos;
- Sessões de estudo;
- Anotações;
- Certificados.

Abra cada CSV no Excel e confirme:

- acentos corretos;
- cabeçalhos legíveis;
- vírgulas, aspas e quebras de linha dentro de textos não quebram colunas;
- os dados pertencem somente à conta autenticada.

## 5. Volume acima de 1.000 registros

Se houver ambiente de teste com grande volume, confirme que a exportação inclui registros além da primeira página de 1.000. A rota usa paginação interna em blocos de 1.000.

## 6. Segurança

1. Faça logout.
2. Abra diretamente `/api/export?scope=backup&format=json`.
3. Deve retornar 401 e não baixar dados.
4. Entre com outra conta de teste e exporte os dados.
5. Não deve existir nenhum registro da primeira conta.
6. Confirme que o bucket `certificates` continua privado.

## 7. Cabeçalhos de segurança

No DevTools → Network, abra uma página e confira a resposta. Devem existir, entre outros:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`

## 8. Acessibilidade

1. Pressione `Tab` assim que carregar uma página interna.
2. O link **Pular para o conteúdo principal** deve aparecer.
3. Pressione Enter: o foco deve ir ao conteúdo principal.
4. Navegue por botões, links e formulários usando apenas teclado.
5. O foco deve estar visível.
6. Ative “reduzir movimento” no sistema operacional e confirme que animações deixam de ser relevantes para o uso.

## 9. Responsividade

Teste Configurações → Privacidade em:

- 375 × 812;
- 390 × 844;
- 768 × 1024;
- desktop.

Não deve existir rolagem horizontal indevida e os botões de download devem continuar acessíveis.

## 10. Regressão

Confirme que continuam funcionando:

- login/logout;
- Cursos;
- importação;
- Estudos;
- Anotações;
- Certificados;
- Dashboard;
- Configurações.

A v0.12 só é aprovada após todos os testes críticos passarem.
