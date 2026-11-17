# ADR-001: Technology Stack & Architectural Decisions

## Status
Accepted

## Context
MAGIC is an academic research tracking and doctoral dissertation supervision platform requiring high responsiveness, WCAG 2.2 AA accessibility, strict authorization, and an editorial dark-themed visual identity ("Academic Editorial Architecture").

## Decision
1. **Frontend Architecture**: Single Page Application (SPA) built with React 18/19, TypeScript, and Vite. SPA is chosen over SSR because MAGIC is an authenticated private platform with no public SEO indexing requirements; client-side execution and reactive data synchronization provide superior ergonomics for dissertation editing and multi-step reviews.
2. **Styling & Design System**: Tailwind CSS v4 with modern CSS `@theme` tokens matching the editorial dark umber palette (`#1e1c1a`), high-contrast paper parchment cards (`#faf8f5`), Newsreader typography for headings and Manrope for administrative interfaces.
3. **State Management & Caching**: TanStack Query (React Query) for server state caching and optimistic UI updates; React Hook Form with Zod for typed schema validation.
4. **Backend & Persistence**: Isolated Supabase instance leveraging PostgreSQL with Row Level Security (RLS), private Storage for thesis evidence, and transactional RPC functions.
5. **Hosting & Deployment**: Vercel for SPA hosting with rewrite rules, connected to a dedicated GitHub repository.

## Consequences
- Clean separation between frontend presentation and backend security boundaries.
- Ultra-fast build times (<6s) and deterministic bundle sizes.
