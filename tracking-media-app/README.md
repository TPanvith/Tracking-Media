# Tracking Media

The first application foundation is organized as a real multi-tenant web product rather than a standalone HTML demo.

## Stack

- **Next.js 16.3 / React / TypeScript** — app UI, server-rendered dashboards, and server-side route handlers.
- **PostgreSQL + Prisma 7** — persistent relational data and migration history.
- **Better Auth** — account sessions and organization membership/roles, with OIDC and SAML SSO plugins enabled for organization identity providers.
- **Zod** — server-side request validation.

Authentication proves the account identity. The organization membership and role decide which work data the account can read or change. The work API checks both on the server; client-side controls are only presentation. Better Auth's SSO plugin supports OIDC and SAML and can associate identity providers with organizations. Each organization still needs its own identity-provider registration and credentials before company sign-in will work.

## Data boundaries

- `PersonalTracker` and its entries are user-owned.
- `WorkTracker`, entries, and audit events are organization-owned and checked against `Member` for every request.
- `PublicTracker`, source-bearing entries, review states, and follows use separate models.
- The personal dashboard query loads personal trackers and public trackers the user owns or follows. It does not query organization tracker records.
- `/work/[organizationId]` loads only after the signed-in user is found in that organization's membership table.

Work tracker records support workspace-wide visibility or owner/admin-only visibility. The current roles are owner, admin, member, and viewer. Public data models already carry status, periods, units, methodology, and source details to support the evidence-backed publishing workflow in a later slice.

## Local setup

Requirements: Node.js 22.18+ and Docker Desktop (or a PostgreSQL 17 database you manage). Prisma 7 needs a recent supported Node release; the app was scaffolded for the installed Node 24 runtime.

1. Install packages with `npm install`.
2. Copy `.env.example` to `.env`.
3. Start PostgreSQL using `docker compose up -d database`.
4. Generate Better Auth's plugin schema with `npm run db:auth-schema`.
5. Format the generated schema and generate Prisma Client: `npx prisma format && npm run db:generate`.
6. Create the initial migration: `npm run db:migrate -- --name init`.
7. Start the app: `npm run dev` and open `http://localhost:3000`.

The Postgres volume persists between restarts. Local credentials in `compose.yaml` are for development only; use managed credentials and TLS in any shared or hosted environment.

## SSO setup

Organization owners/admins can register an OIDC provider in Work mode. First add the IdP issuer origin to `SSO_TRUSTED_ORIGINS`, then register the provider, set its callback URL at the IdP, and publish the requested DNS TXT record. Domain verification must succeed before the provider is trusted. Better Auth supports OIDC and SAML; this first admin setup form covers OIDC. User authorization remains tied to the resulting Tracking Media organization membership and role.

## Email and team invitations

Email/password accounts must verify their address. Work-space owners/admins can invite members or admins; the recipient must sign in with the invited address and accept the link. Configure `RESEND_API_KEY` and `EMAIL_FROM` with a verified sender domain before sign-up verification or invitations can send. Email API calls run server-side; credentials are not stored in browser code.

## Current implementation boundary

This slice establishes sign-in and email verification, organization creation, member invitations, isolated work routes/APIs, role-aware reads and writes, audit events, organization-scoped OIDC setup, and the personal dashboard's data separation. It does not yet include full public-tracker create/review/publish screens, a SAML setup form, or production deployment/operations. Those should build on the models and auth integration here rather than on the former one-file prototype.
