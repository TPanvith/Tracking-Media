# Tracking Media

**Build a tracker for what matters. Keep private work private. Publish public data with its evidence attached.**

Tracking Media is a tracking and data-publishing platform for individuals, teams, and the public. It brings personal tracking, organization workspaces, and public source-backed trackers into one product while keeping their data and authorization boundaries distinct.

> This is an early, actively built prototype. The detailed product vision, data model, architecture, local setup, roadmap, security principles, and current implementation limits are documented in the [full product and build guide](tracking-media-app/README.md).

## The product

| Space | Purpose | Examples |
| --- | --- | --- |
| **Personal Trackers** | A private dashboard where each person creates and maintains trackers for their own goals and projects. | Habits, study, fitness, spending, applications, personal projects. |
| **Work / Organization Trackers** | A separate team environment protected by membership, roles, organization settings, and company SSO. | Team projects, milestones, risks, service indicators, operational updates. |
| **Public Trackers** | Maintained datasets anyone can inspect, with evidence, methodology, review status, and update history. | Government programme spending, public services, sports, entertainment. |

A single account can use the Personal dashboard and enter organization workspaces when authorized. Work mode must never pull personal records or public follows into its workspace. Public records are separately owned and published; they are not personal or company records made public by accident.

## Evidence-first public data

Public-interest trackers should distinguish approved or budgeted **allocation**, **funds released**, **reported expenditure**, **beneficiaries**, and **observed outcomes**. Per-beneficiary, per-household, and per-capita figures are shown only when their inputs, population, period, geography, and units align. Every published record should expose its source and retrieval time, calculation/method, reviewer status, uncertainty, and missing data.

The publishing path is **Draft → In review → Verified → Published**, with a correction path and visible history. “Verified” means a reviewer checked a record against its cited evidence and stated method at that time; it is not a political judgment, guarantee of source completeness, or proof of causation. Missing values remain unavailable, not zero.

## How it can be sustained

Potential revenue includes optional Personal upgrades, organization subscriptions for team and SSO features, creator/research tools, and paid API or bulk-data services where source rights allow. Public facts, source links, and methodology should remain accessible. Payment must never buy a verified status or affect editorial decisions; sponsorships must be disclosed.

## What exists today

The repository contains a Next.js/React/TypeScript application using PostgreSQL, Prisma, Better Auth, and Zod, alongside the original visual concept demo. The application foundation already includes email/password auth, verification and reset flows, Personal tracker creation, organization workspaces and roles, invites, work tracker records, audit events, and the start of organization SSO setup. Public data models are present, but public authoring, review, publication, and analysis screens remain planned work.

- [Open the original visual concept demo](index.html)
- [Read the full product and build guide](tracking-media-app/README.md)
- [Go to the application source](tracking-media-app/)

