# Testes — versão 0.9

Execute a migração `202607240005_v0_9_notes.sql` antes dos testes funcionais.

## 1. Banco e segurança

- [ ] Tabela `notes` aparece no Supabase.
- [ ] RLS está ativado na tabela.
- [ ] Usuário autenticado consegue criar sua própria anotação.
- [ ] Uma segunda conta não consegue consultar/alterar anotações da primeira.
- [ ] Curso de outro usuário é rejeitado pelo backend.
- [ ] Categoria de outro usuário é rejeitada pelo backend.

## 2. Criar anotação

Acesse `/anotacoes` e crie um registro com:

- Data: hoje;
- Curso: qualquer curso ativo;
- Título: `Função PROCX com exemplos`;
- Categoria: `Conceito`;
- Assunto: `Funções de pesquisa`;
- Conteúdo com negrito, lista e link usando os botões do editor;
- Importante: Sim;
- Revisar em: amanhã;
- Tags: `excel, procx, funcoes`.

Verifique:

- [ ] mensagem de sucesso;
- [ ] registro aparece na tabela;
- [ ] estrela fica ativa;
- [ ] tags aparecem com `#`;
- [ ] contador Total aumenta;
- [ ] contador Importantes aumenta.

## 3. Validações

- [ ] título vazio é bloqueado;
- [ ] conteúdo vazio é bloqueado;
- [ ] curso vazio é bloqueado;
- [ ] categoria vazia é bloqueada;
- [ ] URL inválida é bloqueada;
- [ ] data de revisão inválida é bloqueada.

## 4. Dúvidas e ideias

Crie:

1. uma anotação na categoria `Dúvida`, não revisada;
2. uma anotação na categoria `Ideia`.

Verifique:

- [ ] Dúvidas pendentes aumenta;
- [ ] Ideias para projetos aumenta;
- [ ] ambas aparecem nos painéis laterais correspondentes.

## 5. Revisões

Crie três anotações não revisadas:

- uma com data de ontem;
- uma com data de hoje;
- uma com data futura.

Verifique:

- [ ] ontem aparece em **Atrasadas**;
- [ ] hoje aparece em **Hoje**;
- [ ] futura aparece em **Próximas**;
- [ ] o contador Revisões para hoje usa somente a data atual.

Clique em **Marcar como revisada**:

- [ ] status muda para Revisado;
- [ ] sai das listas de revisão pendente;
- [ ] `reviewed_at` é preenchido no Supabase.

Use **Reagendar revisão**:

- [ ] nova data é salva;
- [ ] anotação volta a ficar pendente;
- [ ] `reviewed_at` anterior continua registrado.

## 6. Edição

- [ ] edite título, conteúdo, categoria, tags e revisão;
- [ ] atualize a página com F5;
- [ ] alterações continuam salvas.

## 7. Pesquisa e filtros

Teste:

- [ ] pesquisa pelo título;
- [ ] pesquisa por texto do conteúdo;
- [ ] pesquisa por tag;
- [ ] filtro por curso;
- [ ] filtro por categoria;
- [ ] filtro Pendentes;
- [ ] filtro Revisadas;
- [ ] filtro Atrasadas;
- [ ] filtro Para hoje;
- [ ] filtro Só importantes;
- [ ] período por data inicial e final;
- [ ] Limpar filtros restaura a lista.

## 8. Exclusão lógica e restauração

- [ ] exclua uma anotação;
- [ ] ela deixa de aparecer em Ativas;
- [ ] aparece na Lixeira;
- [ ] restaure;
- [ ] volta para Ativas;
- [ ] registros permanecem no banco com `deleted_at` coerente.

## 9. Integração com Cursos

Abra `/cursos`, entre no detalhe de um curso e verifique:

- [ ] botão **Nova anotação**;
- [ ] botão abre `/anotacoes` com o curso pré-selecionado;
- [ ] após criar, a anotação aparece em **Anotações vinculadas** no detalhe do curso.

## 10. Responsividade

Teste em aproximadamente 390 × 844:

- [ ] cards não cortam;
- [ ] filtros se adaptam à largura;
- [ ] tabela vira cards;
- [ ] modal abre pela parte inferior;
- [ ] editor permanece utilizável;
- [ ] ações principais são acessíveis.

## 11. Testes técnicos

```cmd
npm run typecheck
npm run lint
npm run build
```

Todos devem terminar sem erros.
