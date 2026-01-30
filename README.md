# BeatMap - Next.js Application

<div align="center">
<img width="1200" height="475" alt="BeatMap Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

Aplicação de descoberta musical integrada com Spotify API e Supabase. **Migrado de Vite para Next.js 15**.

## 🚀 Tecnologias

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Supabase** - Backend-as-a-Service com autenticação
- **Spotify API** - Integração com Spotify
- **Lucide React** - Ícones

## 📁 Estrutura do Projeto

```
C:\BeatMap
├── app/                    # App Router (Next.js 13+)
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial (login)
│   ├── globals.css        # Estilos globais
│   ├── providers.tsx      # Provedores de contexto (Auth)
│   ├── auth/
│   │   └── callback/
│   │       └── page.tsx   # Callback OAuth
│   └── dashboard/
│       └── page.tsx       # Dashboard do usuário
├── components/            # Componentes React
│   ├── BeatMapLogo.tsx
│   ├── LoginPage.tsx
│   └── ...
├── lib/                   # Bibliotecas e utilidades
│   ├── env.ts            # Configuração de ambiente
│   ├── supabase.ts       # Cliente Supabase
│   └── ...
├── types/                 # Definições de tipos TypeScript
│   └── index.ts
├── middleware.ts          # Middleware de autenticação
├── next.config.js         # Configuração do Next.js
├── package.json           # Dependências
└── tsconfig.json          # Configuração TypeScript
```

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Passos

1. **Instalar dependências:**
```bash
npm install
```

2. **Configurar variáveis de ambiente:**
Crie um arquivo `.env.local` na raiz do projeto:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Spotify Configuration
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your-spotify-client-id

# Gemini API Configuration (Opcional)
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# Application Configuration
NEXT_PUBLIC_APP_NAME=BeatMap
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_API_BASE_URL=https://api.spotify.com/v1

# Cache Configuration
NEXT_PUBLIC_CACHE_TTL=1800000
NEXT_PUBLIC_CACHE_PREFIX=beatmap_

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_DISCOVERY=true
```

3. **Executar em desenvolvimento:**
```bash
npm run dev
```

Acesse em: http://localhost:3000

4. **Build para produção:**
```bash
npm run build
npm start
```

## 🔐 Autenticação

A aplicação usa **Supabase Auth** com OAuth do Spotify:

1. Usuário clica em "Entrar com Spotify"
2. Redirecionado para autenticação OAuth do Spotify
3. Após autenticação, redirecionado para `/auth/callback`
4. Token armazenado em cookie seguro
5. Usuário redirecionado para `/dashboard`

## 🎵 Integrações

### Spotify API
- Autenticação OAuth 2.0
- Busca de lançamentos
- Criação de playlists
- Upload de capas
- Descoberta semanal

### Supabase
- Autenticação (OAuth Spotify)
- Banco de dados PostgreSQL
- Row Level Security (RLS)
- Real-time subscriptions

## 📋 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm start` - Inicia servidor de produção
- `npm run lint` - Executa ESLint

## 🔧 Configuração de Deploy

### Vercel (Recomendado)
1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente no dashboard
3. Deploy automático a cada push

### Outras Plataformas
- Configure `NEXT_PUBLIC_*` variáveis no ambiente
- Execute `npm run build`
- Inicie com `npm start`

## 📝 Migração de Vite para Next.js

Esta aplicação foi migrada de Vite/React para Next.js:

| Vite | Next.js |
|------|---------|
| `vite.config.ts` | `next.config.js` |
| `index.html` | `app/layout.tsx` |
| `src/App.tsx` | `app/page.tsx` |
| `import.meta.env` | `process.env` |
| `VITE_*` | `NEXT_PUBLIC_*` |
| `main.tsx` | `app/layout.tsx` |

### Mudanças Principais
- **Routing**: Sistema de arquivo do Next.js App Router
- **Variáveis de ambiente**: Prefixo `NEXT_PUBLIC_` para variáveis públicas
- **Auth**: `@supabase/auth-helpers-nextjs` para SSR/CSR
- **Middleware**: Proteção de rotas via `middleware.ts`

## 📚 Documentação

- [API Documentation](./API_DOCUMENTATION.md) - Documentação da API
- [Migration Guide](./MIGRATION_GUIDE.md) - Guia de migração

## 🔒 Segurança

- Middleware de autenticação protege rotas privadas
- Tokens armazenados em cookies HttpOnly
- Row Level Security no Supabase
- Input sanitization contra XSS/SQL injection
- Rate limiting nas chamadas Spotify API

## 🤝 Contribuição

1. Faça fork do projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

---

**BeatMap** - Mapeando o som do seu mundo 🎵

Live URL: https://beat-map-ten.vercel.app/
