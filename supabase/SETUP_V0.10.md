# Supabase — versão 0.10

1. Abra o projeto Supabase já utilizado pelas versões anteriores.
2. Vá em **SQL Editor** e execute `migrations/202607290006_v0_10_certificates.sql` uma única vez.
3. No **Table Editor**, confirme a tabela `certificates`.
4. Em **Storage**, confirme o bucket privado `certificates`.
5. Não altere o bucket para público. A aplicação gera URLs assinadas temporárias para visualizar ou baixar arquivos.
6. Formatos aceitos: PDF, JPG, JPEG e PNG. Limite: 10 MB.

A migração também cria as políticas RLS para que cada conta veja apenas seus próprios certificados e arquivos.
