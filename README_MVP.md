# IGCA — MVP Upgrade

This ZIP keeps the original HTML/CSS/Vanilla JS UI and adds a real Supabase backend foundation.

## Current project
- 16 HTML pages
- 13 JS modules
- Responsive CSS + animations
- Mock DATA layer powering most screens
- Login/signup were previously mock-only
- Messaging/network/discover/appointments/notifications were previously local/mock

## Added in this MVP upgrade
- `backend/schema.sql`: PostgreSQL schema + relationships + indexes + RLS + realtime tables
- `js/config.js`: browser-safe Supabase URL/anon key configuration
- `js/backend.js`: reusable Supabase data-access layer
- Real Supabase email/password login and signup
- Real onboarding profile persistence
- Supabase CDN loaded on all pages

## Important
The browser may contain ONLY the Supabase anon/publishable key. Never put a service_role key in HTML/JS.

## Setup
1. Create a Supabase project.
2. Open SQL Editor and run `backend/schema.sql`.
3. In Supabase Authentication > URL Configuration, add your local/live site URL.
4. Configure email confirmation according to your project.
5. Edit `js/config.js`:
   - SUPABASE_URL = your project URL
   - SUPABASE_ANON_KEY = your publishable/anon key
6. Serve the folder from a local web server. Do not open the pages with `file://`.
7. Test signup -> email confirmation -> login -> onboarding.

## MVP feature completion status
DONE FOUNDATION:
- Authentication
- User profiles
- Company model
- Connections model
- Messaging model + realtime table
- Appointments model
- Notifications model
- Posts/comments/likes/save models
- Insights/opportunities models
- RLS baseline
- Search index
- Realtime publication

STILL NEEDS FRONTEND WIRING:
- Replace mock `DATA` rendering in dashboard/discover/network/messages/appointments/notifications with `IGCA_API` calls
- Profile edit/save UI
- Connection accept/decline buttons wired to DB
- Conversation list + message composer wired to DB
- Appointment recipient picker + request submit wired to DB
- Posts/feed UI (LinkedIn-like feed)
- Company CRUD/profile UI
- AI Research Edge Function and rate limiting
- Admin/moderation dashboard
- Storage upload UI for avatars/company logos
- Production security test and RLS review

## Product boundary
This is a professional/investor networking platform, not LinkedIn and not a trading/investment-advice product.
MVP excludes trading, payments, portfolio management, complex personalized recommendations, and financial advice.
