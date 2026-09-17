# CLAUDE.md - REMAX Gifts Catalog

## 1. Project Overview

- **Name**: REMAX Gifts Catalog
- **Description**: A modern, fast, SEO-friendly headless commerce product catalog for REMAX Indonesia official merchandise
- **Goal**: Provide a centralized digital catalog for REMAX agents, franchise offices, corporate clients, and event organizers â€” converting product discovery into WhatsApp inquiries (leads), not e-commerce checkout
- **Target Users**: REMAX agents, REMAX marketing, franchise offices, corporate clients, event organizers; secondary: vendors, purchasing staff, business owners
- **Version**: MVP v1.0
- **Status**: Active development

> MVP is intentionally **not** a marketplace or full e-commerce â€” no customer login, checkout, or payment gateway. Focus: product discovery + WhatsApp inquiry (lead) conversion.

---

## 2. Tech Stack

- **Language**: TypeScript (strict mode)
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **UI Library**: shadcn/ui, Framer Motion
- **CMS (content)**: Hygraph â€” Products, Categories, Banners, Static Pages
- **Database (operational)**: Supabase PostgreSQL â€” Analytics, Leads, SearchLog, Events, Cart, Settings
- **ORM**: Prisma
- **Storage**: Supabase Storage (all images; Hygraph only stores URLs)
- **Validation**: Zod
- **Package Manager**: pnpm
- **Deployment**: Vercel

> **Never use npm or yarn â€” always use pnpm.**

---

## 3. Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Run production build
pnpm lint             # Run linter
pnpm format           # Format code

# Package Management
pnpm add [package]    # Install new package

# Database (Prisma + Supabase)
pnpm db:migrate       # Run Prisma migrations
pnpm db:seed          # Seed initial data
pnpm db:reset         # Reset database
pnpm db:studio        # Open Prisma Studio

# Testing
pnpm test             # Run all tests
```

---

## 4. Project Structure

**Architecture**: Feature/module based

```
/
  src/
    app/                    # Next.js App Router â€” pages and layouts
      (public)/             # Public website routes
      (admin)/              # Admin dashboard routes
      api/                  # Route Handlers (Server-side only)
    components/             # Reusable UI components
      ui/                   # shadcn/ui base components
      [feature]/            # Feature-specific components
    lib/                    # Utilities, helpers, config
      hygraph/              # Hygraph GraphQL client and queries
      supabase/             # Supabase client
      prisma/               # Prisma client instance
    services/               # Data fetching functions (never in components)
      content/              # Hygraph content fetchers
      operational/          # Supabase/Prisma data functions
    types/                  # TypeScript types and interfaces
    hooks/                  # Custom React hooks
    actions/                # Next.js Server Actions
  prisma/
    schema.prisma           # Supabase operational data model
  public/                   # Static assets
```

**File placement rules:**
- New UI components always in `src/components/`
- Business logic always in `src/services/` or `src/actions/`
- TypeScript types always in `src/types/`
- Helpers and utilities always in `src/lib/`
- Data fetch functions always in `src/services/` â€” never directly inside components
- Do not create new folders without confirmation

---

## 5. Architecture Principles

```
Public Website (Next.js) â†’ GraphQL API â†’ Hygraph CMS
Admin Dashboard (Next.js) â†’ Hygraph Management API â†’ Hygraph CMS
Operational Data: Next.js API/Actions â†’ Prisma â†’ Supabase PostgreSQL
```

**Content** (products, categories, banners, static pages) â†’ managed in Hygraph.
**Operational data** (analytics, leads, search logs, events, cart, settings) â†’ managed in Supabase via Prisma.

This separation is intentional so Phase 2 (auth, checkout, payment) can be added without architecture migration.

---

## 6. Naming Conventions

```
# Files and Folders
Components       : PascalCase     e.g. ProductCard.tsx
Non-components   : camelCase      e.g. useCart.ts, getProductBySlug.ts
Folders          : kebab-case     e.g. product-detail/
Pages            : page.tsx
Layouts          : layout.tsx
Test files       : [name].test.ts or [name].spec.ts

# In Code
Variables        : camelCase      e.g. productData, isLoading
Constants        : UPPER_SNAKE    e.g. MAX_RETRY, WA_BASE_URL
Functions        : camelCase      e.g. getProductBySlug, formatPrice
Types/Interfaces : PascalCase     e.g. ProductType, ApiResponse
Enums            : PascalCase     e.g. ProductStatus, LeadStatus
CSS classes      : kebab-case     e.g. product-card, nav-item

# Git Branches
New features     : feat/[feature-name]
Bug fixes        : fix/[bug-name]
Hotfixes         : hotfix/[name]
Refactors        : refactor/[name]
```

---

## 7. Code Conventions

```
# TypeScript
- strict mode is required at all times
- Never use 'any' type â€” use unknown, generics, or proper types
- Always write explicit return types on functions
- Use interface for object shapes; type for unions/intersections

# Import Order
1. External libraries (React, Next.js, etc.)
2. Internal absolute (@/components, @/lib, etc.)
3. Internal relative (./Component, ../utils)
4. Types and Interfaces
5. Assets and styles

# Export Pattern
- Named export for all components and functions
- Default export only for page.tsx and layout.tsx

# Error Handling
- Always use try-catch for async functions
- Never leave errors silently unhandled
- Write specific, informative error messages
- Return consistent API response format: { success: boolean, data: T | null, message: string }

# Validation
- Always validate user input with Zod at system boundaries
- Never trust raw client input in Server Actions or Route Handlers
```

---

## 8. Component Rules

```
# Component Structure Order
1. Imports
2. Types/Interface for props
3. Component definition
4. Hooks (useState, useEffect, etc.)
5. Handlers and local functions
6. Return JSX
7. Export

# Props Rules
- Always write explicit prop types
- Use default values for optional props

# Server vs Client Components (Next.js App Router)
- Default: Server Component
- Add 'use client' only when needed:
    useState / useEffect / other hooks
    Event listeners (onClick, onChange, etc.)
    Browser APIs (localStorage, window, etc.)
    Libraries that don't support SSR

# Component Splitting
- Extract to its own file if used in more than one place
- Can be co-located in one file if only used by one parent component
```

---

## 9. Styling Rules

```
# Approach
- Tailwind CSS v4 utility classes directly in JSX
- Never use inline styles except for truly dynamic values
- Never use !important
- Use cn() (from lib/utils) for conditional classes

# Class Order
layout > spacing > sizing > color > typography > state

# Responsive Design (mobile-first)
- Default: mobile styles
- sm: 640px | md: 768px | lg: 1024px | xl: 1280px
- Grid: desktop 4 cols | tablet 3 cols | mobile 2 cols (featured products)

# Visual Style
- Minimal, premium, corporate â€” inspired by Apple & Shopify
- Generous white space, large images, 16px border-radius, soft shadows
- Design tokens via CSS variables â€” never hardcode color hex values
```

---

## 10. Data Fetching Rules

```
# Server vs Client Fetch
- Server fetch  : initial page data that doesn't need user interaction
- Client fetch  : data that changes after user interaction
- Never use useEffect for data fetching

# Hygraph (Content)
- Use GraphQL queries in src/services/content/
- Fetch via Server Components by default for SSR/SSG performance
- Use ISR (revalidate) for product/category pages

# Supabase / Prisma (Operational)
- All writes go through Server Actions or Route Handlers â€” never from client directly
- Prisma client instance lives in src/lib/prisma/

# API Routes
- Always return consistent format: { success: boolean, data: T | null, message: string }
- Return correct HTTP status codes (200, 400, 401, 404, 500)
- Never expose error details to client in production
```

---

## 11. Security Rules

```
# Critical
- ALL write operations go through Server Actions or Route Handlers
- Hygraph Management API token must NEVER be exposed to the browser
- Supabase credentials must NEVER be exposed to the client
- All environment variables managed via Vercel
- Never expose API keys or secrets to the client side
- Never bypass user input validation
- Never skip error handling in API routes or Server Actions

# Data
- Cart stored by sessionId â€” no login required (by design for MVP)
- Lead data (WhatsApp numbers) stored in Supabase â€” respect data retention policy
```

---

## 12. Performance Rules

```
# Targets (Lighthouse)
Performance  : 95+
Accessibility: 95+
SEO          : 100
Best Practices: 100
Page Load    : < 2 seconds

# Images
- Always use next/image â€” never plain <img> tags
- Specify width and height for every image
- All images stored in Supabase Storage; Hygraph only stores URLs

# Bundle Size
- Import only what you need:
  Correct : import { debounce } from 'lodash'
  Wrong   : import _ from 'lodash'

# SSR / SSG
- Default to Server Components to minimize client JavaScript
- Use Static Generation for pages with infrequently-changing data
- Use ISR for product/category pages
```

---

## 13. SEO Requirements

Every public page must include:
- `<title>` and `<meta name="description">`
- Open Graph tags
- Twitter Card tags
- Canonical URL
- JSON-LD structured data (Product schema where applicable)
- Breadcrumb structured data
- robots.txt and sitemap.xml
- Friendly, human-readable URLs (slugs)

---

## 14. Git Rules

After every completed change or addition, commit to git before moving to the next task. This ensures changes are reviewable and reversible.

```
# Commit Message Format
feat     : [description of new feature]
fix      : [description of bug fixed]
refactor : [description of refactor]
style    : [styling or formatting changes]
docs     : [documentation changes]
test     : [test additions or changes]
chore    : [config or tooling changes]

# Examples
feat: add product detail page with gallery and WhatsApp CTA
fix: resolve cart session not persisting on page refresh
refactor: extract ProductCard into reusable component

# Rules
- Never commit .env or any file containing secrets
- One commit per specific, focused change
- Do not mix unrelated changes in one commit
```

---

## 15. Sitemap

```
# Public Website
/                       Home
/search                 Search
/categories             Category listing
/categories/[slug]      Category detail
/products/[slug]        Product detail
/cart                   Quotation cart
/contact                Contact

# Admin Dashboard
/admin                  Admin login/entry
/dashboard              Dashboard overview
/products               Product management
/categories             Category management
/banners                Banner management
/media                  Media library
/leads                  Leads management
/analytics              Analytics
/settings               Company settings
/profile                Admin profile
```

---

## 16. Features

```
# Completed and working
  (none yet â€” project starting)

# In progress â€” do not modify without confirmation
  (none yet)

# Planned (MVP scope)
- [ ] Home page (hero banner, categories, featured products, why choose REMAX, WA CTA)
- [ ] Search with autocomplete, filters, sort, SearchLog tracking
- [ ] Category listing and category detail pages
- [ ] Product detail page (gallery, specs, variants, related products, WA button)
- [ ] Cart (quotation cart, sessionId-based, WhatsApp message generator)
- [ ] Contact page
- [ ] Admin dashboard overview
- [ ] Admin product management (CRUD, bulk actions)
- [ ] Admin category management
- [ ] Admin banner management
- [ ] Admin media library
- [ ] Admin leads management (table + CSV export)
- [ ] Admin analytics (views, WA clicks, popular searches)
- [ ] Admin settings and profile
- [ ] SEO hardening (all metadata, JSON-LD, sitemap, robots.txt)

# Phase 2 â€” added (customer accounts & quotation orders)
- [x] Customer Google login (OAuth) + dedicated /account/login page
- [x] Login-gated checkout everywhere (product card, detail, cart) â†’ records a pending order
- [x] Customer order history (/account/orders) + profile edit (/account/profile, stored in Supabase Auth user metadata)
- [x] Navbar account menu (login icon / avatar dropdown / logout)
- [x] Admin order confirmation with atomic stock decrement (Supabase)
- [x] Customer email/password auth alongside Google: sign in, register (with email verification), and password reset via Supabase (`/account/login`, `/account/register`, `/account/forgot-password`, `/account/reset-password`, `/auth/confirm`)

# Out of scope â€” do not implement
- Payment gateway / online payment
- Shipping / fulfillment / delivery tracking
- Wishlist, product reviews, blog
```

---

## 17. Operational Data Models (Supabase / Prisma)

```
ProductStats  : id, productId, views, waClick, cartCount, createdAt, updatedAt
Lead          : id, products, qty, createdAt
SearchLog     : id, keyword, createdAt
Event         : id, type, productId, sessionId, createdAt
Cart          : id, sessionId, productId, qty
Setting       : companyName, whatsapp, email, maps, socialMedia
```

---

## 18. Content Models (Hygraph)

```
Product   : id, name, slug, category, description, price, MOQ, images, variants, seoTitle, seoDescription, status
Category  : id, name, slug, icon, banner, seoTitle, seoDescription
Banner    : id, title, subtitle, imageDesktop, imageMobile, button, order, status
Page      : About, Contact, FAQ
```

---

## 19. Environment Variables

```
# Setup
Copy .env.example to .env.local for local development.
Never commit .env or .env.local to the repository.

# Public Variables â€” safe for client use
NEXT_PUBLIC_SITE_URL          # Base URL of the website
NEXT_PUBLIC_WA_NUMBER         # REMAX official WhatsApp number for inquiry
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon/public key

# Server-only Variables â€” NEVER expose to client
DATABASE_URL                  # Supabase PostgreSQL connection string (Prisma)
SUPABASE_SERVICE_ROLE_KEY     # Supabase service role key for server-side ops
HYGRAPH_ENDPOINT              # Hygraph GraphQL read API endpoint
HYGRAPH_TOKEN                 # Hygraph read API token
HYGRAPH_MANAGEMENT_ENDPOINT   # Hygraph Management API endpoint
HYGRAPH_MANAGEMENT_TOKEN      # Hygraph Management API token â€” NEVER expose to browser
```

---

## 20. Do Not

If a prompt or instruction is ambiguous, **ask first before coding**. Do not assume and proceed without confirmation.

```
# Structure and Files
- Do not create new folders without confirmation
- Do not delete files without confirmation
- Do not move files without confirmation
- Do not change existing folder structure

# Code
- Never use 'any' type in TypeScript
- Never hardcode values that should come from environment variables
- Never commit .env or any file containing secrets
- Never install new packages without confirmation
- Never remove or modify working features without clear instruction

# Forbidden Patterns
- Never expose Hygraph Management API token to the browser
- Never write fetch functions directly inside components (use services/)
- Never use useEffect for data fetching
- Never use plain <img> tags â€” always use next/image
- Never use inline styles for values expressible as Tailwind utilities

# Database
- Never run commands that modify or delete production data
- Never create Prisma migrations without confirmation
- Never expose database credentials to the client side

# Scope
- Never implement a payment gateway or online payment
- Never implement shipping / fulfillment / delivery tracking
- Never implement wishlist or product reviews
- Enforce the "Out of Scope" list strictly â€” new features go in a separate PRD
```


