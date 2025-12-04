# Migration from Supabase to SQL Server

## Completed Tasks
- [x] Analyze current codebase and create migration plan
- [x] Install SQL Server driver (mssql package)
- [x] Create new database connection file (src/lib/sqlserver.ts)

## Pending Tasks
- [x] Convert PostgreSQL schema to SQL Server syntax (supabase/schema.sql)
- [x] Update AuthProvider to fetch profile from SQL Server
- [ ] Update all database queries in .tsx files (48 files)
  - [x] src/app/teacher/quizzes/page.tsx
  - [x] src/app/teacher/host/[quizId]/page.tsx
  - [x] src/app/teacher/create-quiz/page.tsx
  - [x] src/app/student/results/page.tsx
  - [x] src/app/student/quiz/[sessionId]/page.tsx
  - [x] src/app/student/join/page.tsx
  - [x] src/app/leaderboard/page.tsx
  - [x] src/app/dashboard/settings/page.tsx
  - [x] src/app/admin/page.tsx
  - [ ] src/app/student/join-names/page.tsx (no database operations - just UI)
  - [ ] src/app/student/join-quiz/page.tsx (no database operations - just UI)
  - [ ] src/app/student/join-short/page.tsx (no database operations - just UI)
  - [ ] src/app/teacher/create-names/page.tsx (no database operations - just UI)
  - [ ] src/app/teacher/create-short/page.tsx (no database operations - just UI)
  - [ ] And 33 more files...
- [x] Remove Supabase dependencies from package.json
- [x] Remove old supabase.ts file
- [x] Create .env.example with SQL Server configuration
- [ ] Test database connection and queries
- [ ] Verify authentication flow with database profiles
- [ ] Test all CRUD operations across the app
