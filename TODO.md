# TODO: Switch Authentication to Clerk.dev

## Tasks
- [x] Update src/app/layout.tsx to use ClerkProvider instead of AuthProvider
- [x] Rewrite src/components/auth/AuthProvider.tsx to use Clerk hooks (useUser, useAuth, etc.)
- [x] Update src/app/auth/login/page.tsx to use Clerk's SignIn and SignUp components
- [x] Remove Supabase auth dependencies from AuthProvider and login page
- [x] Fix Navigation component to handle Clerk user metadata
- [x] Fix SignIn/SignUp routing to allow both sign in and sign up
- [ ] Test authentication flow after changes

## Notes
- Keep Supabase for database operations (src/lib/supabase.ts remains unchanged)
- Ensure Clerk keys are properly set in .env.local
- Update any components using the old AuthProvider to work with Clerk
