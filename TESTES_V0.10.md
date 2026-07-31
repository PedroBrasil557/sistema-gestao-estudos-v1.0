# Testes da versão 0.10 — Certificados

## 1. Preparação

1. Extraia a v0.10 em pasta nova.
2. Execute `npm install`.
3. No Supabase, execute `supabase/migrations/202607290006_v0_10_certificates.sql` uma única vez.
4. Confirme `certificates` no Table Editor.
5. Confirme o bucket privado `certificates` no Storage.
6. Execute `npm run dev` e entre com a mesma conta das versões anteriores.

## 2. Cadastro sem arquivo

1. Abra `/certificados`.
2. Clique em **Novo certificado**.
3. Escolha um curso.
4. Marque **Certificado já emitido / disponível**.
5. Informe código e link de validação, sem anexar arquivo.
6. Salve.

**Esperado:** registro criado, indicadores atualizados e ações de arquivo não aparecem.

## 3. Cadastro com PDF

1. Crie outro certificado.
2. Anexe um PDF menor que 10 MB.
3. Salve.
4. Clique em visualizar.
5. Clique em baixar.

**Esperado:** o arquivo abre/baixa por link temporário; o bucket permanece privado.

## 4. Imagens permitidas

Teste JPG, JPEG e PNG válidos menores que 10 MB.

**Esperado:** todos são aceitos.

## 5. Arquivos inválidos

Tente enviar:

- `.exe`, `.zip` ou `.docx`;
- PDF ou imagem maior que 10 MB.

**Esperado:** o sistema bloqueia e mantém os dados do formulário.

## 6. Substituição de arquivo

1. Edite um certificado que já possui arquivo.
2. Escolha outro PDF ou imagem.
3. Salve.
4. Abra o novo arquivo.

**Esperado:** novo arquivo funciona e o anterior é removido do Storage após a atualização bem-sucedida.

## 7. Datas

Teste:

- emissão anterior à conclusão;
- validade anterior à emissão;
- validade futura dentro de 60 dias;
- validade já vencida.

**Esperado:** datas incoerentes são bloqueadas; validade próxima aparece em âmbar e expirada em vermelho.

## 8. Filtros

Teste:

- busca por nome, código e observação;
- Disponível / Não emitido;
- área;
- plataforma;
- validade próxima;
- expirados;
- lixeira;
- limpar filtros.

**Esperado:** lista e paginação acompanham os filtros.

## 9. Exclusão e restauração

1. Exclua um certificado.
2. Abra a Lixeira.
3. Restaure.
4. Verifique o arquivo novamente.

**Esperado:** exclusão é lógica, o arquivo é preservado e volta a funcionar após restauração.

## 10. Integração com Cursos

1. Abra um curso que possua certificado.
2. Confira **Certificados vinculados**.
3. Use **Novo certificado** na página do curso.

**Esperado:** `/certificados?curso=<id>&novo=1` abre o formulário com o curso pré-selecionado.

## 11. Meta anual e gráficos

Confira:

- certificados obtidos;
- obtidos no ano configurado;
- pendentes;
- validade próxima;
- meta anual;
- evolução mensal;
- distribuição por área.

Altere a meta anual em Configurações e recarregue Certificados.

**Esperado:** a meta usa a configuração salva no Supabase.

## 12. Isolamento entre contas

Com uma segunda conta:

1. tente acessar `/api/certificates/<id-da-primeira-conta>/file`;
2. tente editar ou excluir o ID de outra conta.

**Esperado:** 404/negação de acesso; nenhuma informação ou arquivo de outra conta é revelado.

## 13. Responsividade

Teste aproximadamente:

- 375 × 812;
- 390 × 844;
- 768 × 1024;
- desktop.

**Esperado:** formulário, filtros, cards e tabela/cards continuam utilizáveis sem rolagem horizontal indevida.

## 14. Testes técnicos

Pare o servidor e execute:

```cmd
npm run typecheck
npm run lint
npm run build
```

Todos devem concluir sem erros.
