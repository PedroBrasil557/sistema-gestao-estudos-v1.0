# Processo de ajustes após a versão 1.0

A versão 1.0 é o primeiro ponto estável do sistema. Ela pode receber alterações solicitadas posteriormente, mas cada alteração deve preservar a rastreabilidade do que foi aprovado.

## Regra principal

Não alterar a tag `v1.0.0`. Ela representa o estado homologado.

## Classificação recomendada

- **Correção (`1.0.x`)**: erro, texto, validação, responsividade ou ajuste sem ampliar o escopo.
- **Melhoria (`1.x.0`)**: recurso novo compatível com o sistema atual.
- **Versão maior (`2.0.0`)**: mudança estrutural, de fluxo ou de modelo de dados que exija migração/replanejamento significativo.

## Fluxo para cada solicitação

1. Registrar o pedido com descrição e imagem/referência quando houver.
2. Definir impacto: tela, banco, regra de negócio, segurança e dados existentes.
3. Criar branch própria no GitHub.
4. Implementar sem modificar dados históricos desnecessariamente.
5. Criar migração nova se houver alteração de banco — nunca editar migração que já foi aplicada em produção.
6. Executar testes específicos e regressão das áreas afetadas.
7. Homologar antes do merge na `main`.
8. Atualizar `CHANGELOG.md` e número da versão.
9. Criar nova tag após aprovação.

## Controle de banco

As migrações em `supabase/migrations` são cumulativas. Depois que uma migração foi executada no banco oficial, ela deve ser tratada como imutável. Toda mudança posterior entra em um novo arquivo SQL com timestamp/ordem nova.

## Controle do `.env.local`

O `.env.local` continua apenas no computador de desenvolvimento e é ignorado pelo Git. Em GitHub/Vercel, variáveis devem ser configuradas pelo painel do serviço, nunca commitadas.
