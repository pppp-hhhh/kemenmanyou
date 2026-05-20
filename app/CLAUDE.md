<!-- nuxt-skill-hub:start -->
Use the `nuxt-frontend-workspace` skill as the Nuxt router/entrypoint for tasks in this repository.
<!-- nuxt-skill-hub:end -->

# CLAUDE.md — Frontend Workspace

This file provides additional guidance for working on the frontend portion of 课文漫游.

## Key Paths

- **Nuxt app**: `app/` (current directory when working on frontend)
- **Server routes (API proxy)**: `app/server/api/`
- **Pages**: `app/pages/`
- **Components**: `app/components/`
- **Stores**: `app/stores/`
- **Composables**: `app/composables/`

## API Routes

The frontend uses Nuxt server routes to proxy API calls to the backend:

| File | Endpoint | Backend |
|------|----------|---------|
| `api/analyze.post.ts` | POST `/api/analyze` | `POST /api/analyze` |
| `api/generate.post.ts` | POST `/api/generate` | `POST /api/generate` |
| `api/task/[taskId].get.ts` | GET `/api/task/{taskId}` | `GET /api/task/{task_id}` |
| `api/works.get.ts` | GET `/api/works` | `GET /api/works` |
| `api/works.post.ts` | POST `/api/works` | `POST /api/works` |
| `api/works/public.get.ts` | GET `/api/works/public` | `GET /api/works/public` |
| `api/works/[id].get.ts` | GET `/api/works/{id}` | `GET /api/works/{work_id}` |
| `api/works/[id].put.ts` | PUT `/api/works/{id}` | `PUT /api/works/{work_id}` |
| `api/works/[id].delete.ts` | DELETE `/api/works/{id}` | `DELETE /api/works/{work_id}` |
| `api/works/[id]/export.get.ts` | GET `/api/works/{id}/export` | `GET /api/works/{work_id}/export` |
| `api/lessons.get.ts` | GET `/api/lessons` | `GET /api/lessons` |
| `api/lessons.post.ts` | POST `/api/lessons` | `POST /api/lessons` |
| `api/lessons/[id].put.ts` | PUT `/api/lessons/{id}` | `PUT /api/lessons/{lesson_id}` |
| `api/lessons/[id].delete.ts` | DELETE `/api/lessons/{id}` | `DELETE /api/lessons/{lesson_id}` |
| `api/auth/login.post.ts` | POST `/api/auth/login` | `POST /api/auth/login` |
| `api/auth/register.post.ts` | POST `/api/auth/register` | `POST /api/auth/register` |
| `api/auth/logout.post.ts` | POST `/api/auth/logout` | `POST /api/auth/logout` |
| `api/auth/refresh.post.ts` | POST `/api/auth/refresh` | `POST /api/auth/refresh` |
| `api/auth/me.get.ts` | GET `/api/auth/me` | `GET /api/auth/me` |

## State Management

Pinia store at `app/stores/workspace.ts` manages:

- `selectedTextId` — selected textbook ID
- `customText` — custom text input
- `selectedStyle` — art style (写实古风/水墨风格/彩色插画)
- `scenes` — scene list from AI analysis
- `taskId`, `taskStatus`, `generatedImages` — generation state
- `isGenerating`, `progressMsg` — UI state

## Composables

- `useApiFetch(url, options)` — base fetch with error handling
- `useAnalyze()` — calls POST /api/analyze, returns scenes
- `useGenerate()` — calls POST /api/generate, polls GET /api/task/{id}
- `useWorks()` — save/load works via /api/works
