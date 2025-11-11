# AML_Airlines

A minimal airline booking front-end + API built with Next.js (App Router). This repository powers a demo airline site with Cognito OIDC authentication, Amadeus flight search integration (server-side), and a SQL database for user/profile storage.

This README contains everything you need to run the project locally and deploy to AWS Amplify.

## Quick links
- App (production example): https://main.d1qa9zz5auewcc.amplifyapp.com/
# AML_Airlines

A small, developer-friendly demo of an airline booking application built with Next.js (App Router). This repo demonstrates a complete flow: OIDC authentication with AWS Cognito, server-side flight search (Amadeus), and a SQL Server backend for bookings and users.

Live demo: https://main.d1qa9zz5auewcc.amplifyapp.com/

Why this repo
- Realistic server+client structure using Next.js App Router
- Secure OIDC flow (Cognito) with proper production redirect handling
- Example integration with Amadeus flight search APIs
- A minimal, extendable SQL schema for bookings, passengers, payments and loyalty

Table of contents
- Quick start
- Features
- Prerequisites
- Environment variables
- Local development
- Database
- Build & production
- AWS Amplify & Cognito notes
- Troubleshooting
- Appendix & further reading

---

Quick start (dev)
1. Copy `.env.example` to `.env.local` and fill in values (see Appendix for examples).
2. Install and start the dev server:

```powershell
npm ci
npm run dev
```

3. Open http://localhost:3000

Features
- Next.js App Router with server functions under `app/api`
- AWS Cognito (OIDC) authentication flow
- Server-side Amadeus flight search and mapping
- Booking & passenger management with SQL Server schema
- Session cookie-based auth and server-side session handling

Prerequisites
- Node.js 18 (project includes `.nvmrc`)
- npm (or pnpm)
- SQL Server instance (or adapt `lib/server-utils.js` to your DB)
- Amadeus developer credentials (optional for live search)

Environment variables (high level)
Create `.env.local` for development. For production, set these in the Amplify Console.

- DB_*
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`
- Amadeus
   - `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`
- Cognito / OIDC
   - `COGNITO_ISSUER` (issuer URL)
   - `COGNITO_DOMAIN` (user pool domain)
   - `COGNITO_CLIENT_ID`
   - `COGNITO_CLIENT_SECRET` (if using confidential client)
   - `COGNITO_REDIRECT_URI` (e.g. `https://<your-domain>/api/auth/oidc/callback`)
   - `COGNITO_LOGOUT_REDIRECT_URI` (e.g. `https://<your-domain>/`)
   - `COGNITO_SCOPES` (space-separated scopes like `openid profile email`)
- Session / security
   - `AUTH_SESSION_SECRET` (random secret used to sign session cookies)

Important: never commit secrets. Use Amplify environment variables for production.

Database (schema)
- Schema script included: `database/FlightApp_schema.sql` — creates `Users`, `Bookings`, `Passengers`, `Payments`, `LoyaltyTransactions`, and `Admins`.
- To apply locally with `sqlcmd` (example):

```powershell
sqlcmd -S <server> -U <user> -P <password> -i "c:\Users\Admin\Downloads\AWS Project\database\FlightApp_schema.sql"
```

Build & run (production mode)

```powershell
npm ci
npm run build
npm run start
```

AWS Amplify & Cognito (deploy notes)
- Connect the repo and point Amplify to `main` (or your chosen branch).
- In Amplify Console → App → Environment variables: add the production values listed above.
- Ensure the Cognito App Client's Allowed callback URL includes:
   - `https://<your-amplify-domain>/api/auth/oidc/callback`
   - and the sign-out URL includes: `https://<your-amplify-domain>/`
- Use Node 18 in Amplify (this repo includes `.nvmrc` and `amplify.yml` sample).

Troubleshooting (quick hits)
- Redirects return to `localhost:3000` after sign-in:
   - Clear cookies or use a private window.
   - Confirm Amplify env var `COGNITO_REDIRECT_URI` matches your production callback URL.
   - Server-side login route passes `redirect_uri` explicitly; caching the OIDC client was removed so runtime env is used.
- Next.js build fails on static export for API routes using `request.url`/cookies:
   - Mark those API handlers dynamic: `export const dynamic = 'force-dynamic'`.
- Flights API errors / syntax issues:
   - Check `app/api/flights/route.js` for provider lists or string literals (recent fixes applied).

Testing & utilities
- `scripts/test-db-connection.js` — quick database connection check.
- Logs and server messages include helpful prefixes (e.g., `[LOGIN]`, `[CALLBACK]`) for tracing auth flow.

Appendix & further reading
- Sample environment and code snippets: `APPENDIX_A.md`
- Deployment-focused instructions are maintained in `README_DEPLOYMENT.md` (pending)

Contributing
- Feel free to open issues or PRs. If adding env-dependent features, update `APPENDIX_A.md` and the README with examples.