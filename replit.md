# Libyan Learn Hub (EduLibya)

## Overview

A full-stack Libyan e-learning platform with a web app, mobile app, and backend API. Built in Arabic/English with JWT authentication, courses, live sessions, tutoring, and payments.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle for API server)
- **Web frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Mobile**: Expo (React Native)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080, path /api)
│   ├── lms-web/            # React + Vite web app (port 21957, path /)
│   ├── lms-mobile/         # Expo mobile app (port 21752, path /lms-mobile/)
│   └── mockup-sandbox/     # Design component sandbox
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
│   └── src/
│       ├── seed.ts         # Database seed script
│       └── reset_admin.ts  # Admin reset script
└── package.json
```

## API Routes

All routes are mounted under `/api`:
- `/api/auth` — Register, login, OTP verification
- `/api/categories` — Course categories
- `/api/courses` — Course management
- `/api/enrollments` — Course enrollments
- `/api/progress` — Course progress
- `/api/lesson-progress` — Lesson-level progress
- `/api/live-sessions` — Live session management
- `/api/room` — Live session room
- `/api/teachers` — Teacher profiles
- `/api/teacher` — Teacher management
- `/api/payments` — Payment processing
- `/api/admin` — Admin operations
- `/api/video` — Video management
- `/api/reports` — Content reports
- `/api/tutoring` — 1-on-1 tutoring requests
- `/api/expenses` — Expense tracking
- `/api/wishlists` — Course wishlists

## Database Schema

Tables:
- `users` — Students, teachers, admins with JWT auth
- `categories` — Course categories
- `courses` — Course listings with levels and language
- `lessons` — Course lessons with video content
- `enrollments` — Student course enrollments
- `progress` — Overall course progress
- `lesson_progress` — Per-lesson progress tracking
- `reviews` — Course reviews
- `live_sessions` — Live teaching sessions
- `session_registrations` — Live session registrations
- `session_questions` — Q&A for live sessions
- `payments` — Payment records
- `teacher_earnings` — Teacher revenue tracking
- `withdrawal_requests` — Withdrawal requests
- `reports` — Content/user reports
- `tutoring_requests` — 1-on-1 tutoring bookings
- `expenses` — Platform expenses
- `wishlists` — User course wishlists

## Web App Pages

- `/` — Home page (Arabic landing page)
- `/auth` — Login / Register
- `/courses` — Course catalog
- `/course/:id` — Course detail
- `/learn/:courseId/:lessonId` — Lesson player
- `/live` — Live sessions
- `/tutoring` — 1-on-1 tutoring
- `/teachers` — Teacher directory
- `/dashboard` — Student dashboard
- `/teacher-dashboard` — Teacher dashboard
- `/admin` — Admin dashboard
- `/checkout` — Payment checkout
- `/room/:id` — Live session room

## Auth

JWT-based auth. Secret: `JWT_SECRET` env var (defaults to `lms-libya-secret-2024`).
Roles: `student`, `teacher`, `admin`.

## Scripts

- `pnpm --filter @workspace/db run push` — Push DB schema changes
- `pnpm --filter @workspace/scripts run seed` — Seed database
- `pnpm --filter @workspace/scripts run reset_admin` — Reset admin user
- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API client

## Workflows

All 4 workflows are configured and running:
1. `artifacts/api-server: API Server` — Express backend
2. `artifacts/lms-web: web` — React web frontend
3. `artifacts/lms-mobile: expo` — Expo mobile app
4. `artifacts/mockup-sandbox: Component Preview Server` — Design sandbox
