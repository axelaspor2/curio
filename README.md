# Curio

AI-powered Personalized Curation Platform.
「情報の洪水」から高価値なインサイトを抽出する、パーソナライズド・キュレーションアプリ。

## Tech Stack (2026)

| Layer               | Technology                                                       | Location                  |
| :------------------ | :--------------------------------------------------------------- | :------------------------ |
| **Frontend**        | React + Vite                                                     | `apps/web/`               |
| **Backend**         | [Hono](https://hono.dev/) (Cloud Run)                            | `apps/api/`               |
| **Database**        | PostgreSQL 17 + [pgvector](https://github.com/pgvector/pgvector) | `apps/packages/database/` |
| **ORM**             | [Prisma 7](https://www.prisma.io/)                               |                           |
| **Infra**           | Terraform (GCP)                                                  | `infra/`                  |
| **Package Manager** | pnpm 10 (Workspaces)                                             |                           |

## Quick Start

```bash
# 1. Start PostgreSQL with pgvector
docker compose up -d

# 2. Install dependencies
cd apps
pnpm install

# 3. Run migrations
pnpm db:migrate

# 4. Seed data (optional)
pnpm --filter @curio/database db:seed
```

## Directory Structure

```
.
├── apps/                      # pnpm Monorepo
│   ├── api/                   # Backend API (Hono)
│   ├── web/                   # Frontend (React)
│   └── packages/
│       ├── database/          # Prisma + pgvector
│       └── shared/            # Shared types
│
├── docker-compose.yml         # Local PostgreSQL
├── infra/                     # Terraform
└── docs/                      # Documentation
```

詳細は [docs/directory_structure.md](docs/directory_structure.md) を参照。

## Documentation

- [Product Spec](docs/product_spec.md)
- [Directory Structure](docs/directory_structure.md)
- [Database Package](apps/packages/database/README.md)
