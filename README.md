# Sistema de Gestão de Estudos – Roberta — v1.1.2

Atualização única de **redesign completo** do Sistema de Gestão de Estudos. A versão preserva autenticação, Supabase, dados cadastrados, regras de negócio, arquivos privados e rotas da v1.0, mas reorganiza a experiência para ficar mais próxima das imagens de referência: plataforma pessoal, colorida, leve e confortável para uso diário.

## Correção v1.1.2

Esta revisão mantém as correções de responsividade da v1.1.1 e resolve falhas de TypeScript, ESLint e build encontradas na integração com o GitHub/Vercel. Não há migration nova e nenhum dado do Supabase é alterado.

Consulte `TESTES_V1.1.2.md` antes de atualizar a branch no GitHub.


## Principais mudanças

- menu lateral azul-marinho, recolhível e responsivo;
- cabeçalhos padronizados com data dinâmica em pt-BR;
- design system com cartões pastel, botões, badges, barras, filtros e estados vazios reutilizáveis;
- tela **Estudos** voltada ao uso diário, com Planejar e Registrar separados;
- duração em horas e minutos, atalhos rápidos e habilidades de idiomas;
- **Cursos** em cartões coloridos, separados entre Idiomas e Profissionalizantes;
- formulário de curso simplificado e detalhes organizados em abas;
- **Dashboard** com quatro indicadores e painéis realmente úteis;
- **Anotações** em mural de cartões coloridos, checklist, rascunho, revisões e dúvidas;
- **Certificados** em cartões com miniatura, validade, código e conquistas recentes;
- personalização de cor principal, menu, botões, cursos, categorias e tonalidade dos cartões;
- responsividade para desktop, notebook, tablet e celular;
- preservação integral dos registros existentes.

## Tecnologias

- Next.js 16 / App Router;
- React 19;
- TypeScript;
- Tailwind CSS;
- Supabase Auth, PostgreSQL e Storage;
- Lucide React;
- GitHub Desktop e Vercel.

## Instalação local

No CMD, dentro da pasta do projeto:

```cmd
npm install
```

Antes de iniciar o sistema, execute a migration descrita em `supabase/SETUP_V1.1.md`.

Depois:

```cmd
npm run typecheck
npm run lint
npm run build
npm run dev
```

Abra:

```text
http://localhost:3000
```

## Variáveis de ambiente

O pacote não inclui `.env.local`. Preserve o arquivo já configurado na pasta do repositório; ele continua **ignorado pelo Git** e não deve aparecer no GitHub Desktop.

Variáveis utilizadas:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
```

Nenhuma Secret Key, `service_role`, senha ou token privado foi incluído.

Na Vercel, configure as mesmas variáveis públicas em **Settings → Environment Variables** e use a URL real de produção em `NEXT_PUBLIC_SITE_URL`.

## Supabase

A v1.1.0 exige uma migration nova e não destrutiva:

```text
supabase/migrations/202608060007_v1_1_redesign.sql
```

Ela adiciona campos visuais e de organização, classifica os cursos existentes e define cores iniciais sem apagar registros. Consulte:

```text
supabase/SETUP_V1.1.md
```

## Testes

O roteiro funcional completo está em:

```text
TESTES_V1.1.md
```

Comando técnico completo:

```cmd
npm run check
```

## Atualizar o projeto pelo GitHub Desktop

Siga:

```text
GITHUB_DESKTOP_V1.1.md
```

A recomendação é manter `main` como v1.0 estável, publicar a branch `redesign-v1.1.0`, testar na Vercel e somente depois fazer o merge e criar a tag `v1.1.0`.

## Documentos da versão

- `RELEASE_V1.1.md`
- `TESTES_V1.1.md`
- `GITHUB_DESKTOP_V1.1.md`
- `supabase/SETUP_V1.1.md`
- `CHANGELOG.md`
