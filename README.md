# Curio

AI-powered Personalized Curation Platform.
「情報の洪水」から高価値なインサイトを抽出する、パーソナライズド・キュレーションアプリ。

## Tech Stack

| Layer               | Technology                                           | Status              |
| :------------------ | :--------------------------------------------------- | :------------------ |
| **Frontend**        | [TanStack Start](https://tanstack.com/start) + React | `apps/web`          |
| **Backend**         | [Hono](https://hono.dev/) (Cloud Run)                | `apps/api`          |
| **Database**        | Cloud SQL (PostgreSQL + pgvector)                    | `packages/database` |
| **Infra**           | Terraform (GCP)                                      | `infra`             |
| **Package Manager** | npm / bun (Workspaces)                               | root                |

## Directory Structure

```
.
├── apps/
│   ├── api/           # Backend (Business Logic here)
│   └── web/           # Frontend (UI/UX)
│
├── packages/
│   ├── database/      # Database Schema (Single Source of Truth)
│   └── shared/        # Shared Types & Constants
│
└── infra/             # Terraform
```
