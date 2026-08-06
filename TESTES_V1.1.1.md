# Testes da versão 1.1.1

## Preparação

```cmd
npm install
npm run dev
```

Não há migration nova nesta versão.

## Tela Estudos — desktop

Testar em 1366×768, 1440×900 e 1920×1080.

- O menu deve permanecer alinhado e com largura estável.
- O cabeçalho deve mostrar título, subtítulo, data e dois botões.
- Hoje, Semana e Sequência devem aparecer na mesma faixa.
- Estudos planejados devem aparecer em até três cartões por linha.
- Idiomas e Profissionalizantes devem aparecer lado a lado.
- Cada grupo deve apresentar até quatro cartões compactos.
- Registros recentes e Consistência devem aparecer lado a lado.
- Com a conta vazia, os estados vazios devem ser compactos e não criar grandes espaços.

## Menu móvel

Testar em 375×812, 390×844 e 430×932.

- O botão do menu deve ficar no canto superior esquerdo sem cobrir o título.
- O drawer deve abrir pela esquerda e deixar uma faixa escura do conteúdo ao fundo.
- O logotipo não pode ficar em uma única linha nem sobrepor o botão de fechar.
- Todos os seis nomes das abas devem aparecer.
- Ícones e textos devem começar na mesma linha vertical.
- O item ativo deve ocupar a largura útil do drawer.
- Perfil, Recolher menu e Sair da conta devem ficar alinhados.
- Não deve existir rolagem horizontal.
- A página atrás do drawer não deve rolar enquanto ele estiver aberto.
- A tecla Esc deve fechar o drawer.

## Tela Estudos — celular

- Resumo superior em cartões compactos empilhados.
- Botões Registrar estudo e Planejar estudo visíveis.
- Cartões de Hoje em uma coluna.
- Idiomas e Profissionalizantes em uma coluna.
- Dentro dos grupos, dois cartões por linha em telas maiores e um por linha até 480 px.
- Textos, barras e botões não podem ser cortados.
- Calendário de consistência deve caber na largura disponível.

## Regressão

Testar:

- Cursos;
- Dashboard;
- Anotações;
- Certificados;
- Configurações;
- Perfil;
- login e logout;
- abertura e fechamento de modais.

## Validação técnica

```cmd
npm run typecheck
npm run lint
npm run build
```
