# Mihraby UI Redesign — Design Spec

## Context

Mihraby's frontend is functional but visually generic — default Geist font, grayscale/indigo Tailwind theme, no brand identity. Phases 0–3 of the MVP are complete (auth, courses, time slots, bookings, Paymob payment). Before continuing with Phases 4–6 (InstaPay, Zoom, cancellations), the user wants a proper UI that reflects the Mihraby brand.

A design direction was brainstormed and confirmed in a previous session. This spec defines the workflow to go from confirmed tokens to production UI.

## Confirmed Design Tokens

### Color Palette

| Token | Hex | Role |
|---|---|---|
| Deep Teal | `#1D4040` | Navigation, headings, dark elements |
| Warm Linen | `#EBE0CC` | Cards, surfaces, secondary backgrounds |
| Gold | `#D4920A` | CTAs, prices, accent, active states |
| Off-white | `#F7F4EF` | Page base background |

Derived tokens (to be defined during implementation): hover states, disabled states, error red, success green, text-on-dark, text-on-light, border colors.

### Typography

| Context | Font | Weight Range |
|---|---|---|
| EN Headings | Lora (serif) | 500–700 |
| AR Headings + AR Body | Cairo | 400–700 |
| EN Body / UI | DM Sans | 400–600 |

### Scope

All three roles: Student, Instructor, Admin.

---

## Workflow

### Phase A: Visual Mockup Generation

**Tools:** Nano Banana 2 (Gemini image gen) + Google Stitch (UI prototyping)
**Output:** Mockup images saved to `docs/design/mockups/`
**Purpose:** Visual north star — no code generated from these.

**Page groups (in order):**

1. **Landing page** — Hero section with value prop, features grid, social proof / testimonials, CTA to register. Arabic-ready layout (RTL-aware spacing).
2. **Auth pages** — Login and Register forms. Clean, branded, minimal.
3. **Student dashboard** — Upcoming bookings summary, quick actions, recent courses.
4. **Course browse + detail** — Card grid with filters, course detail with slot picker + booking CTA + price display in EGP.
5. **Booking flow** — Slot selection → payment method → checkout redirect → return/confirmation page.
6. **Instructor dashboard** — Course list management, time slot calendar, booking requests.
7. **Admin dashboard** — InstaPay approval queue, booking overview, user management stub.

**Mockup prompt guidelines:**
- Include the exact hex palette in every generation prompt
- Specify Lora headings + DM Sans body in the prompt
- Include sample Arabic text in at least one variant per page
- Request both desktop (1440px) and mobile (375px) for landing + auth pages
- Dashboard pages: desktop only for mockup phase

### Phase B: Production UI Build

**Tools:** 21st.dev (selective component sourcing) + UI/UX Pro Max skill
**Output:** Restyled production code across all ~25 UI files

#### B.1 — Design System Foundation

Modify before any page work:

- **`app/globals.css`** — Replace current `@theme inline` tokens with Mihraby palette. Add semantic aliases (e.g., `--color-primary: #1D4040`, `--color-accent: #D4920A`, `--color-surface: #EBE0CC`, `--color-bg: #F7F4EF`).
- **`app/layout.tsx`** — Swap Geist Sans/Mono imports for Lora + Cairo + DM Sans via `next/font/google`. Set CSS variables for font families.
- **Create `lib/design-tokens.ts`** — Export palette and font constants for any JS-side usage (e.g., chart colors, dynamic styles).

#### B.2 — 21st.dev Component Sourcing (Selective)

Pull only high-impact primitives to conserve API quota (~4–5 components max):

1. **Navigation bar / sidebar** — responsive nav with role-based menu
2. **Card component** — course cards, booking cards, admin review cards
3. **Form inputs** — styled text fields, selects, file upload
4. **Badge / pill** — booking status badges, course status indicators
5. **Button variants** — primary (gold), secondary (teal outline), ghost

Restyle each to Mihraby tokens immediately after sourcing.

#### B.3 — Page-by-Page Build (UI/UX Pro Max)

Build order follows mockup priority:

1. **Root layout + navigation** — sidebar/topbar, role switching, responsive shell
2. **Landing page** (`app/page.tsx`) — hero, features, CTA
3. **Auth pages** (`app/(auth)/login/page.tsx`, `register/page.tsx`)
4. **Student pages:**
   - Dashboard (`student/page.tsx`)
   - Course browse (`student/courses/page.tsx`)
   - Course detail + slot picker (`student/courses/[id]/page.tsx`)
   - My Bookings (`student/bookings/page.tsx`)
   - Payment return (`student/bookings/[id]/return/page.tsx`)
5. **Instructor pages:**
   - Dashboard (`instructor/page.tsx`)
   - Course list (`instructor/courses/page.tsx`)
   - Course detail + time slot manager (`instructor/courses/[id]/page.tsx`)
   - New course form (`instructor/courses/new/page.tsx`)
6. **Admin pages:**
   - Dashboard (`admin/page.tsx`) — InstaPay queue, booking overview

**Feature components to restyle:**
- `features/bookings/components/my-bookings.tsx`
- `features/bookings/components/booking-cart.tsx`
- `features/bookings/components/admin-bookings.tsx`
- `features/bookings/components/instructor-bookings.tsx`
- `features/courses/components/courses-list.tsx`
- `features/time-slots/components/slot-picker.tsx`
- `features/time-slots/components/course-time-slots-manager.tsx`
- `features/time-slots/components/time-slot-calendar.tsx`
- `features/time-slots/components/time-slot-form.tsx`

### Phase C: Hardening

Sequential skill passes after all pages are built:

| Order | Skill | Focus |
|---|---|---|
| 1 | `/normalize` | Align spacing, tokens, design system consistency across all pages |
| 2 | `/polish` | Fix alignment, visual rhythm, micro-interactions, final quality |
| 3 | `/harden` | Error states, loading skeletons, empty states, edge cases |
| 4 | `/adapt` | Responsive breakpoints (mobile, tablet, desktop), RTL layout prep |
| 5 | `/clarify` | UX copy review — error messages, labels, microcopy (EN + AR-ready) |
| 6 | `/audit` | Accessibility (WCAG 2.1 AA), performance, semantic HTML |

---

## Constraints

- **No new features.** This is a visual redesign only. All existing functionality must continue working. No API changes, no new routes, no backend modifications.
- **Tailwind v4 only.** Use `@theme inline` in `globals.css` for all token definitions. No `tailwind.config.ts` (Tailwind v4 doesn't use it).
- **Preserve architecture.** Feature module structure (`features/<domain>/{api,components}`) stays intact. Components are restyled in place, not moved.
- **21st.dev budget.** Maximum ~5 component pulls. Everything else built from scratch.
- **MCPs must be connected.** Nano Banana 2, Stitch, and 21st.dev are configured in `~/.claude.json` but require a Claude Code restart to connect.
- **No dark mode for MVP.** Single light theme using the confirmed palette. Dark mode is post-launch.

## Verification

After each phase:

- **Phase A:** Mockup images visually reviewed by user in `docs/design/mockups/`
- **Phase B:** Each page verified via preview server — screenshot comparison against mockups, check responsive layout, verify no broken functionality
- **Phase C:** Each skill's output verified — `/audit` produces a report, `/adapt` tested at 375px/768px/1440px breakpoints

Final verification: full click-through of student booking flow (browse → detail → slot pick → checkout → return page) with both desktop and mobile viewports.
