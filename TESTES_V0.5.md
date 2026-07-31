# Testes da versão 0.5 — Cursos

## 1. Preparação

- [ ] A v0.4 já funciona com a mesma conta do Supabase.
- [ ] O `.env.local` está presente e não contém chave `sb_secret_`.
- [ ] `npm install` terminou sem erro fatal.
- [ ] A migração `202607240002_v0_5_courses.sql` foi executada no SQL Editor.
- [ ] A tabela `courses` aparece no Table Editor.

## 2. Primeiro acesso

- [ ] Faça login com a conta já criada.
- [ ] Abra `/cursos`.
- [ ] A página carrega sem erro vermelho no console.
- [ ] Os indicadores começam zerados quando ainda não há cursos.
- [ ] O estado vazio oferece o botão **Cadastrar primeiro curso**.

## 3. Criar curso

Cadastre um curso com:

```text
Nome: Excel Avançado
Tipo: Curso
Plataforma: Fundação Bradesco
Área: Excel
Carga: 31
Status: Em andamento
Prioridade: Alta
Data de início: data atual ou anterior
Meta de conclusão: data posterior ao início
Emite certificado: Sim
```

- [ ] O registro é salvo.
- [ ] A tabela e os indicadores atualizam sem recarregar manualmente.
- [ ] O curso aparece no Table Editor vinculado ao seu `user_id`.
- [ ] O progresso fica em 0% enquanto não houver sessões de estudo.

## 4. Validações

- [ ] Nome vazio bloqueia o salvamento.
- [ ] Carga negativa é bloqueada.
- [ ] Curso em andamento sem data de início é bloqueado.
- [ ] Meta anterior ao início é bloqueada.
- [ ] Link sem `http://` ou `https://` é bloqueado.
- [ ] Criar outro Curso chamado `Excel Avançado` retorna aviso de duplicidade.
- [ ] Uma Certificação com o mesmo nome pode ser cadastrada separadamente.

## 5. Editar

- [ ] Edite nome, carga, prioridade, datas e observações.
- [ ] Atualize a página com `F5`.
- [ ] As alterações permanecem.
- [ ] Marque como Concluído e confirme a data de conclusão.
- [ ] O progresso passa a 100%.

## 6. Pesquisa e filtros

Cadastre pelo menos três registros diferentes.

- [ ] Pesquise pelo nome.
- [ ] Pesquise pelo nome da plataforma.
- [ ] Filtre por status.
- [ ] Filtre por tipo.
- [ ] Filtre por prioridade.
- [ ] Filtre por área.
- [ ] Filtre por plataforma.
- [ ] Teste as opções de ordenação.
- [ ] Use vários filtros juntos.

## 7. Curso Atual

- [ ] Clique na estrela de um curso ativo.
- [ ] Aparece a confirmação de Curso Atual.
- [ ] Atualize a página.
- [ ] A identificação permanece salva.
- [ ] Abra `/configuracoes` e confirme que as configurações continuam funcionando.

## 8. Detalhes

- [ ] Clique no ícone de visualização.
- [ ] A rota `/cursos/[id]` abre.
- [ ] Nome, plataforma, área, datas, carga e observações estão corretos.
- [ ] O botão Editar salva as mudanças.
- [ ] O link externo abre em nova aba quando informado.

## 9. Arquivamento e exclusão

- [ ] Arquive um curso.
- [ ] Ele desaparece de **Somente ativos**.
- [ ] Selecione **Somente arquivados**.
- [ ] Restaure o curso.
- [ ] Arquive novamente e exclua permanentemente.
- [ ] A exclusão exige confirmação explícita.

## 10. Proteção das listas

- [ ] Crie um curso usando uma plataforma e uma área.
- [ ] Em Configurações, tente arquivar a plataforma usada.
- [ ] O sistema informa que o item está vinculado a curso(s).
- [ ] Renomear o item continua permitido e o novo nome aparece no curso.

## 11. Exportação

- [ ] Aplique um filtro.
- [ ] Clique em **Exportar CSV**.
- [ ] O arquivo abre com acentos corretos e somente os registros filtrados.

## 12. Isolamento por usuário

- [ ] Crie uma segunda conta de teste.
- [ ] Confirme que ela não enxerga os cursos da primeira conta.
- [ ] Copiar a URL de detalhe de outro usuário resulta em página não encontrada.

## 13. Responsividade

- [ ] Desktop sem rolagem horizontal da página inteira.
- [ ] Tablet com cards e tabela utilizáveis.
- [ ] Celular transforma a tabela em cards.
- [ ] Modal de cadastro cabe na tela e pode ser rolado.
- [ ] Botões ficam acessíveis acima da navegação inferior.

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
