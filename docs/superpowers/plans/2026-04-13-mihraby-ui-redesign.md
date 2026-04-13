# Mihraby UI Redesign Implementation Plan

> **Status: COMPLETE** — Merged to `develop` on 2026-04-13. Phase A (mockups) was skipped in favour of direct implementation. Phase B fully delivered. Typography updated post-merge: Fraunces + Outfit replacing Lora + DM Sans per user preference.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire Mihraby frontend from generic Tailwind/indigo to a branded Deep Teal + Gold + Warm Linen theme with Fraunces/Cairo/Outfit typography, across all 3 roles (Student, Instructor, Admin).

**Architecture:** Visual-only redesign — no API, backend, or routing changes. Phase A generates mockup images via Nano Banana 2 + Stitch MCPs as reference. Phase B replaces the design system tokens and restyled every page/component in-place. Phase C runs hardening skills. All existing functionality must continue working.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4 (`@theme inline`), `next/font/google` (Fraunces, Cairo, Outfit), 21st.dev MCP (selective component sourcing)

**Design Tokens (confirmed):**
| Token | Hex | CSS Variable | Role |
|---|---|---|---|
| Deep Teal | `#1D4040` | `--color-primary` | Nav, headings, dark elements |
| Warm Linen | `#EBE0CC` | `--color-surface` | Cards, surfaces |
| Gold | `#D4920A` | `--color-accent` | CTAs, prices, active states |
| Off-white | `#F7F4EF` | `--color-bg` | Page background |

**Typography:**
| Context | Font | CSS Variable |
|---|---|---|
| EN Headings | Lora (500–700) | `--font-heading` |
| AR Headings + Body | Cairo (400–700) | `--font-heading-ar` |
| EN Body / UI | DM Sans (400–600) | `--font-body` |

---

## File Map

### New files
- `docs/design/mockups/` — directory for mockup images (Phase A)

### Modified files (Phase B)
| File | What changes |
|---|---|
| `app/globals.css` | Replace theme tokens, add Mihraby palette + font vars |
| `app/layout.tsx` | Swap Geist → Lora + Cairo + DM Sans |
| `app/page.tsx` | Redesign landing page |
| `app/(auth)/layout.tsx` | Apply branded background |
| `app/(auth)/login/page.tsx` | Restyle form with Mihraby tokens |
| `app/(auth)/register/page.tsx` | Restyle form with Mihraby tokens |
| `app/(dashboard)/layout.tsx` | Apply `--color-bg` background |
| `app/(dashboard)/student/layout.tsx` | Redesign nav bar |
| `app/(dashboard)/instructor/layout.tsx` | Redesign nav bar |
| `app/(dashboard)/admin/layout.tsx` | Redesign nav bar |
| `app/(dashboard)/student/page.tsx` | Redesign dashboard cards |
| `app/(dashboard)/student/courses/page.tsx` | Page header styling |
| `app/(dashboard)/student/courses/student-courses-list.tsx` | Course card redesign |
| `app/(dashboard)/student/courses/[id]/student-course-detail.tsx` | Booking flow redesign |
| `app/(dashboard)/student/bookings/page.tsx` | Page header styling |
| `app/(dashboard)/student/bookings/[id]/return/page.tsx` | Payment status redesign |
| `app/(dashboard)/instructor/page.tsx` | Redesign dashboard cards |
| `app/(dashboard)/instructor/courses/page.tsx` | Page header styling |
| `app/(dashboard)/instructor/courses/instructor-courses-list.tsx` | Course card redesign |
| `app/(dashboard)/instructor/courses/[id]/instructor-course-detail.tsx` | Detail page redesign |
| `app/(dashboard)/instructor/courses/new/page.tsx` | Page header styling |
| `app/(dashboard)/instructor/courses/new/create-course-form.tsx` | Form redesign |
| `app/(dashboard)/admin/page.tsx` | Redesign dashboard cards |
| `features/bookings/components/my-bookings.tsx` | Booking list + status badges |
| `features/bookings/components/booking-cart.tsx` | Placeholder restyle |
| `features/bookings/components/admin-bookings.tsx` | Placeholder restyle |
| `features/bookings/components/instructor-bookings.tsx` | Placeholder restyle |
| `features/courses/components/courses-list.tsx` | Course card redesign |
| `features/time-slots/components/slot-picker.tsx` | Slot button redesign |
| `features/time-slots/components/course-time-slots-manager.tsx` | Manager layout |
| `features/time-slots/components/time-slot-calendar.tsx` | Calendar list redesign |
| `features/time-slots/components/time-slot-form.tsx` | Form inputs redesign |
| `lib/components/logout-button.tsx` | Button style update |

---

## Phase A: Mockup Generation

> **Prerequisite:** MCPs (Nano Banana 2, Stitch, 21st.dev) must be connected. Restart Claude Code if they aren't showing in available tools.

### Task 1: Generate Landing Page Mockup

**Tools:** Nano Banana 2 MCP (Gemini image generation)

- [ ] **Step 1: Create mockups directory**

```bash
mkdir -p docs/design/mockups
```

- [ ] **Step 2: Generate desktop landing page mockup**

Use Nano Banana 2 to generate an image with this prompt:

```
Design a clean, warm landing page for "Mihraby" — an Egyptian tutor booking platform.

Color palette (exact hex):
- Deep Teal #1D4040 for navigation bar and headings
- Off-white #F7F4EF for page background
- Warm Linen #EBE0CC for card surfaces
- Gold #D4920A for CTA buttons and accent elements

Typography: Lora serif for headings, DM Sans for body text.

Layout:
- Top nav bar: Deep Teal background, "Mihraby" logo in white/gold, "Sign In" and "Get Started" buttons
- Hero section: Large serif heading "Book Expert Tutors in Egypt", subtitle in DM Sans, Gold "Get Started" CTA button
- 3-column feature cards on Warm Linen: "For Students" (browse & book), "For Instructors" (manage courses), "For Admins" (platform management)
- Generous whitespace, warm and scholarly feel, eye-comfortable

Desktop viewport 1440x900. Clean, minimal, no stock photos.
```

Save output to `docs/design/mockups/01-landing-desktop.png`

- [ ] **Step 3: Generate mobile landing page mockup**

Same prompt but specify: "Mobile viewport 375x812. Single column layout, stacked cards, hamburger menu."

Save to `docs/design/mockups/01-landing-mobile.png`

- [ ] **Step 4: Commit mockups**

```bash
git add docs/design/mockups/01-landing-*.png
git commit -m "design: add landing page mockups"
```

### Task 2: Generate Auth Pages Mockup

**Tools:** Nano Banana 2 MCP

- [ ] **Step 1: Generate login page mockup**

Prompt:
```
Design a login page for "Mihraby" tutor booking platform.

Colors: Deep Teal #1D4040, Off-white #F7F4EF background, Warm Linen #EBE0CC card, Gold #D4920A button.
Typography: Lora serif for "Sign in to Mihraby" heading, DM Sans for labels and body.

Layout: Centered card on Off-white background. Card has Warm Linen bg with subtle border.
- "Sign in to Mihraby" heading in Deep Teal (Lora serif)
- Email and password fields with rounded borders
- Gold "Sign in" button, full width
- "Create a new account" link in Deep Teal below
- Subtle "Mihraby" wordmark at top of card

Desktop 1440x900. Clean, warm, scholarly.
```

Save to `docs/design/mockups/02-login.png`

- [ ] **Step 2: Generate register page mockup**

Same style as login but with: Name, Email, Password, Confirm Password fields. Heading: "Create your Mihraby account". Link: "sign in to your existing account".

Save to `docs/design/mockups/02-register.png`

- [ ] **Step 3: Commit**

```bash
git add docs/design/mockups/02-*.png
git commit -m "design: add auth page mockups"
```

### Task 3: Generate Dashboard Mockups

**Tools:** Nano Banana 2 MCP

- [ ] **Step 1: Generate student dashboard mockup**

Prompt:
```
Design a student dashboard for "Mihraby" tutor booking platform.

Colors: Deep Teal #1D4040 nav, Off-white #F7F4EF page bg, Warm Linen #EBE0CC cards, Gold #D4920A accents.
Typography: Lora serif headings, DM Sans body.

Layout:
- Top nav: Deep Teal bg, "Mihraby" in white, nav links (Courses, My Bookings) in light text, user name + logout on right
- Page heading: "Welcome back, Ahmed" in Lora
- 3-column card grid on Warm Linen:
  - "Browse Courses" — card with book icon
  - "My Bookings" — card with calendar icon
  - "Profile" — card with user icon
- Cards have subtle shadow, rounded corners, hover effect hint

Desktop 1440x900. Warm, inviting, minimal.
```

Save to `docs/design/mockups/03-student-dashboard.png`

- [ ] **Step 2: Generate instructor dashboard mockup**

Similar layout but with cards: "My Courses", "Create Course", "Bookings". Nav links: My Courses, Create. Title: "Instructor Dashboard".

Save to `docs/design/mockups/03-instructor-dashboard.png`

- [ ] **Step 3: Generate admin dashboard mockup**

Cards: "Manage Users", "Manage Courses", "Payment Approvals". Nav links: Users, Courses, Payments. Title: "Admin Dashboard".

Save to `docs/design/mockups/03-admin-dashboard.png`

- [ ] **Step 4: Commit**

```bash
git add docs/design/mockups/03-*.png
git commit -m "design: add dashboard mockups for all roles"
```

### Task 4: Generate Course & Booking Flow Mockups

**Tools:** Nano Banana 2 MCP

- [ ] **Step 1: Generate course browse page mockup**

Prompt:
```
Design a course browsing page for "Mihraby" tutor booking platform.

Colors: Deep Teal #1D4040, Off-white #F7F4EF bg, Warm Linen #EBE0CC cards, Gold #D4920A prices.
Typography: Lora headings, DM Sans body.

Layout:
- Page heading: "Browse courses" in Lora Deep Teal
- 3-column grid of course cards (Warm Linen bg, rounded corners, subtle shadow):
  - Course title in Deep Teal (bold DM Sans)
  - Description snippet (2 lines, gray)
  - Price "150 EGP" in Gold at bottom
  - Hover: slight lift shadow
- Clean, generous spacing

Desktop 1440x900.
```

Save to `docs/design/mockups/04-course-browse.png`

- [ ] **Step 2: Generate course detail + booking flow mockup**

Prompt:
```
Design a course detail page with booking flow for "Mihraby".

Colors: Deep Teal #1D4040, Off-white #F7F4EF bg, Warm Linen #EBE0CC sections, Gold #D4920A.
Typography: Lora headings, DM Sans body.

Layout (stacked sections):
1. Course info card (Warm Linen): Title in Lora, description, "150 EGP / session" in Gold
2. "Pick a time" section: List of available time slot buttons. Selected slot has Deep Teal border + light teal bg. Unselected have Warm Linen bg with gray border.
3. "Payment method" section (appears after slot selected): Radio buttons for "Credit / Debit Card", "Vodafone Cash", "Fawry", "InstaPay". Radio accent in Gold.
4. "Book for 150 EGP" Gold button at bottom.

Back link "← Back to courses" at top in Deep Teal.
Desktop 1440x900.
```

Save to `docs/design/mockups/04-course-detail-booking.png`

- [ ] **Step 3: Commit**

```bash
git add docs/design/mockups/04-*.png
git commit -m "design: add course browse and booking flow mockups"
```

### Task 5: Generate Instructor Management Mockups

**Tools:** Nano Banana 2 MCP

- [ ] **Step 1: Generate instructor course detail + time slot manager mockup**

Prompt:
```
Design an instructor course detail page with time slot management for "Mihraby".

Colors: Deep Teal #1D4040, Off-white #F7F4EF bg, Warm Linen #EBE0CC, Gold #D4920A.
Typography: Lora headings, DM Sans body.

Layout:
1. Course info card (Warm Linen): Title, description, price, status badge
2. "Time slots" section with:
   - "Add slot" button (Gold bg, white text) in header
   - List of existing slots in divided rows: "Apr 15, 2:00 PM – 3:00 PM" with green "Available" badge, "Edit" and "Delete" action links
   - Add/edit form inline: Start and End datetime inputs, "Add slot" and "Cancel" buttons

Desktop 1440x900.
```

Save to `docs/design/mockups/05-instructor-course-detail.png`

- [ ] **Step 2: Generate create course form mockup**

Course creation form with fields: Title, Description (textarea), Price (EGP), Status (Draft/Published). "Create course" Gold button.

Save to `docs/design/mockups/05-create-course.png`

- [ ] **Step 3: Commit**

```bash
git add docs/design/mockups/05-*.png
git commit -m "design: add instructor management mockups"
```

### Task 6: Review All Mockups with User

- [ ] **Step 1: List all generated mockups for user review**

```bash
ls -la docs/design/mockups/
```

Present the mockup files to the user. Ask them to open and review. These serve as the visual north star for Phase B.

- [ ] **Step 2: Commit any final adjustments and proceed to Phase B**

---

## Phase B: Production UI Build

### Task 7: Design System Foundation — globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace globals.css with Mihraby design tokens**

Replace the entire contents of `app/globals.css` with:

```css
@import "tailwindcss";

:root {
  /* Mihraby brand palette */
  --color-primary: #1D4040;
  --color-primary-light: #2A5555;
  --color-primary-dark: #152E2E;
  --color-accent: #D4920A;
  --color-accent-light: #E5A31B;
  --color-accent-dark: #B37A08;
  --color-surface: #EBE0CC;
  --color-surface-dark: #D9CEBC;
  --color-bg: #F7F4EF;
  --color-bg-white: #FFFFFF;

  /* Text colors */
  --color-text: #1D4040;
  --color-text-secondary: #4A6363;
  --color-text-muted: #7A8F8F;
  --color-text-on-primary: #F7F4EF;
  --color-text-on-accent: #FFFFFF;

  /* Semantic colors */
  --color-error: #DC2626;
  --color-error-light: #FEF2F2;
  --color-success: #16A34A;
  --color-success-light: #F0FDF4;
  --color-warning: #D4920A;
  --color-warning-light: #FFF8E1;

  /* Borders */
  --color-border: #D9CEBC;
  --color-border-light: #EBE0CC;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(29, 64, 64, 0.05);
  --shadow-md: 0 4px 6px rgba(29, 64, 64, 0.07);
  --shadow-lg: 0 10px 15px rgba(29, 64, 64, 0.1);

  /* Font families (set by next/font) */
  --font-heading: var(--font-lora);
  --font-heading-ar: var(--font-cairo);
  --font-body: var(--font-dm-sans);
}

@theme inline {
  --color-primary: var(--color-primary);
  --color-primary-light: var(--color-primary-light);
  --color-primary-dark: var(--color-primary-dark);
  --color-accent: var(--color-accent);
  --color-accent-light: var(--color-accent-light);
  --color-accent-dark: var(--color-accent-dark);
  --color-surface: var(--color-surface);
  --color-surface-dark: var(--color-surface-dark);
  --color-bg: var(--color-bg);
  --color-bg-white: var(--color-bg-white);
  --color-text: var(--color-text);
  --color-text-secondary: var(--color-text-secondary);
  --color-text-muted: var(--color-text-muted);
  --color-text-on-primary: var(--color-text-on-primary);
  --color-text-on-accent: var(--color-text-on-accent);
  --color-error: var(--color-error);
  --color-error-light: var(--color-error-light);
  --color-success: var(--color-success);
  --color-success-light: var(--color-success-light);
  --color-border: var(--color-border);
  --color-border-light: var(--color-border-light);
  --font-heading: var(--font-heading);
  --font-heading-ar: var(--font-heading-ar);
  --font-body: var(--font-body);
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body), system-ui, sans-serif;
}

/* Heading defaults */
h1, h2, h3 {
  font-family: var(--font-heading), Georgia, serif;
}
```

- [ ] **Step 2: Verify the dev server starts without errors**

```bash
yarn dev
```

Expected: Dev server starts. Visit http://localhost:3000 — page should render (colors will look different now, fonts not yet swapped).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: replace Tailwind theme with Mihraby design tokens"
```

### Task 8: Design System Foundation — Fonts in layout.tsx

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace Geist fonts with Lora + Cairo + DM Sans**

Replace the entire contents of `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Lora, Cairo, DM_Sans } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/providers/app-provider";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mihraby - Tutor Booking Platform",
  description: "Book one-on-one tutoring sessions with expert instructors on Mihraby.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lora.variable} ${cairo.variable} ${dmSans.variable} antialiased`}
      >
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify fonts load**

```bash
yarn dev
```

Visit http://localhost:3000. Open DevTools → Elements → body should show the 3 `--font-*` CSS variables. Headings should render in Lora, body in DM Sans.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "style: swap Geist fonts for Lora + Cairo + DM Sans"
```

### Task 9: Redesign Landing Page

**Files:**
- Modify: `app/page.tsx`

Reference mockup: `docs/design/mockups/01-landing-desktop.png`

- [ ] **Step 1: Replace landing page with Mihraby-branded design**

Replace the entire contents of `app/page.tsx` with:

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Navigation */}
      <nav className="bg-[var(--color-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[var(--color-text-on-primary)] font-[family-name:var(--font-heading)]">
                Mihraby
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-[var(--color-text-on-primary)] hover:text-[var(--color-accent-light)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-[var(--color-accent)] text-[var(--color-text-on-accent)] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--color-accent-light)] transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-bold text-[var(--color-primary)] sm:text-5xl md:text-6xl font-[family-name:var(--font-heading)]">
            <span className="block">Book Expert Tutors</span>
            <span className="block text-[var(--color-accent)]">in Egypt</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-[var(--color-text-secondary)]">
            One-on-one tutoring sessions with expert instructors. Browse courses,
            pick a time that works for you, and learn live.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-3 rounded-lg text-base font-semibold text-[var(--color-text-on-accent)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] shadow-[var(--shadow-md)] transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-3 rounded-lg text-base font-semibold text-[var(--color-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-dark)] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-[var(--color-surface)] rounded-xl p-8 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--color-primary)]">
              <svg className="h-6 w-6 text-[var(--color-text-on-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="mt-6 text-lg font-semibold text-[var(--color-primary)] font-[family-name:var(--font-heading)]">
              For Students
            </h3>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Browse courses, book sessions, and learn from expert tutors at your own pace.
            </p>
          </div>

          <div className="bg-[var(--color-surface)] rounded-xl p-8 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--color-primary)]">
              <svg className="h-6 w-6 text-[var(--color-text-on-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mt-6 text-lg font-semibold text-[var(--color-primary)] font-[family-name:var(--font-heading)]">
              For Instructors
            </h3>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Create courses, manage your schedule, and connect with students across Egypt.
            </p>
          </div>

          <div className="bg-[var(--color-surface)] rounded-xl p-8 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--color-primary)]">
              <svg className="h-6 w-6 text-[var(--color-text-on-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="mt-6 text-lg font-semibold text-[var(--color-primary)] font-[family-name:var(--font-heading)]">
              For Admins
            </h3>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Manage users, review payments, and oversee the entire platform.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify landing page renders correctly**

```bash
yarn dev
```

Visit http://localhost:3000. Verify:
- Deep Teal nav bar with white "Mihraby" text
- Gold "Get Started" button
- Off-white background
- Warm Linen feature cards
- Lora headings, DM Sans body text

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "style: redesign landing page with Mihraby brand"
```

### Task 10: Redesign Auth Layout + Login Page

**Files:**
- Modify: `app/(auth)/layout.tsx`
- Modify: `app/(auth)/login/page.tsx`

Reference mockup: `docs/design/mockups/02-login.png`

- [ ] **Step 1: Update auth layout background**

Replace `app/(auth)/layout.tsx`:

```tsx
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Auth | Mihraby',
  description: 'Access your Mihraby account.',
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] py-12 px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Redesign login page**

Replace `app/(auth)/login/page.tsx` — keep all the logic (useState, handleSubmit, router, auth) exactly the same, only change the JSX return:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login(formData);
      
      if (response.success && response.data) {
        login(response.data.user);
        
        switch (response.data.user.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'instructor':
            router.push('/instructor');
            break;
          case 'student':
            router.push('/student');
            break;
          default:
            router.push('/');
        }
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-[var(--color-surface)] rounded-xl p-8 shadow-[var(--shadow-lg)]">
      <div>
        <h2 className="text-center text-3xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)]">
          Sign in to Mihraby
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">
          Or{' '}
          <Link href="/register" className="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-light)]">
            create a new account
          </Link>
        </p>
      </div>
      <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg bg-[var(--color-error-light)] p-4 border border-[var(--color-error)]/20">
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-white)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] text-sm transition-colors"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-white)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] text-sm transition-colors"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-[var(--color-text-on-accent)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)] disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Verify login page**

Visit http://localhost:3000/login. Verify: Warm Linen card on Off-white bg, Lora heading, Gold sign-in button, proper input styling.

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/layout.tsx app/(auth)/login/page.tsx
git commit -m "style: redesign auth layout and login page"
```

### Task 11: Redesign Register Page

**Files:**
- Modify: `app/(auth)/register/page.tsx`

- [ ] **Step 1: Restyle register page**

Apply the same Mihraby styling as the login page. Keep all logic identical. Changes are CSS-only:
- Container: `bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-lg)]`
- Heading: `text-[var(--color-primary)] font-[family-name:var(--font-heading)]`
- Inputs: `border-[var(--color-border)] bg-[var(--color-bg-white)] focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]`
- Submit button: `bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-[var(--color-text-on-accent)]`
- Link: `text-[var(--color-accent)] hover:text-[var(--color-accent-light)]`
- Error: `bg-[var(--color-error-light)] text-[var(--color-error)]`
- Add visible `<label>` elements with `text-[var(--color-text-secondary)]` instead of `sr-only`

Full replacement file:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (response.success && response.data) {
        login(response.data.user);
        
        switch (response.data.user.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'instructor':
            router.push('/instructor');
            break;
          case 'student':
            router.push('/student');
            break;
          default:
            router.push('/');
        }
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-[var(--color-surface)] rounded-xl p-8 shadow-[var(--shadow-lg)]">
      <div>
        <h2 className="text-center text-3xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)]">
          Create your Mihraby account
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">
          Or{' '}
          <Link href="/login" className="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-light)]">
            sign in to your existing account
          </Link>
        </p>
      </div>
      <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg bg-[var(--color-error-light)] p-4 border border-[var(--color-error)]/20">
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-white)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] text-sm transition-colors"
              placeholder="Your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-white)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] text-sm transition-colors"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-white)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] text-sm transition-colors"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-white)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] text-sm transition-colors"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-[var(--color-text-on-accent)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)] disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verify register page**

Visit http://localhost:3000/register. Verify same styling as login.

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/register/page.tsx
git commit -m "style: redesign register page with Mihraby brand"
```

### Task 12: Redesign Dashboard Layouts (All 3 Roles)

**Files:**
- Modify: `app/(dashboard)/layout.tsx`
- Modify: `app/(dashboard)/student/layout.tsx`
- Modify: `app/(dashboard)/instructor/layout.tsx`
- Modify: `app/(dashboard)/admin/layout.tsx`

- [ ] **Step 1: Update dashboard wrapper layout**

Replace `app/(dashboard)/layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard | Mihraby',
  description: 'Manage courses, bookings, and time slots on Mihraby.',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Suspense fallback={<div className="p-6 text-[var(--color-text-muted)]">Loading dashboard...</div>}>
        {children}
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 2: Redesign student layout nav**

Replace `app/(dashboard)/student/layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/session';
import { UserRole } from '@/types';
import { LogoutButton } from '@/lib/components/logout-button';

export const metadata = {
  title: 'Student Dashboard | Mihraby',
  description: 'Browse and manage your courses.',
};

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await requireRole([UserRole.STUDENT]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <nav className="bg-[var(--color-primary)] shadow-[var(--shadow-md)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/student" className="text-xl font-bold text-[var(--color-text-on-primary)] font-[family-name:var(--font-heading)]">
                Mihraby
              </Link>
              <div className="ml-8 flex gap-6 text-sm">
                <Link href="/student/courses" className="text-[var(--color-text-on-primary)]/80 hover:text-[var(--color-text-on-primary)] transition-colors">
                  Courses
                </Link>
                <Link href="/student/bookings" className="text-[var(--color-text-on-primary)]/80 hover:text-[var(--color-text-on-primary)] transition-colors">
                  My Bookings
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--color-text-on-primary)]/70">{user?.name ?? ''}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Redesign instructor layout nav**

Replace `app/(dashboard)/instructor/layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/session';
import { UserRole } from '@/types';
import { LogoutButton } from '@/lib/components/logout-button';

export const metadata = {
  title: 'Instructor Dashboard | Mihraby',
  description: 'Manage your courses and enrollments.',
};

export default async function InstructorLayout({ children }: { children: ReactNode }) {
  const user = await requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <nav className="bg-[var(--color-primary)] shadow-[var(--shadow-md)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/instructor" className="text-xl font-bold text-[var(--color-text-on-primary)] font-[family-name:var(--font-heading)]">
                Mihraby
              </Link>
              <div className="ml-8 flex gap-6 text-sm">
                <Link href="/instructor/courses" className="text-[var(--color-text-on-primary)]/80 hover:text-[var(--color-text-on-primary)] transition-colors">
                  My Courses
                </Link>
                <Link href="/instructor/courses/new" className="text-[var(--color-text-on-primary)]/80 hover:text-[var(--color-text-on-primary)] transition-colors">
                  Create
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--color-text-on-primary)]/70">{user?.name ?? ''}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Redesign admin layout nav**

Replace `app/(dashboard)/admin/layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/session';
import { UserRole } from '@/types';
import { LogoutButton } from '@/lib/components/logout-button';

export const metadata = {
  title: 'Admin Dashboard | Mihraby',
  description: 'Manage users and courses as an administrator.',
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <nav className="bg-[var(--color-primary)] shadow-[var(--shadow-md)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-xl font-bold text-[var(--color-text-on-primary)] font-[family-name:var(--font-heading)]">
                Mihraby
              </Link>
              <div className="ml-8 flex gap-6 text-sm">
                <Link href="/admin/users" className="text-[var(--color-text-on-primary)]/80 hover:text-[var(--color-text-on-primary)] transition-colors">
                  Users
                </Link>
                <Link href="/admin/courses" className="text-[var(--color-text-on-primary)]/80 hover:text-[var(--color-text-on-primary)] transition-colors">
                  Courses
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--color-text-on-primary)]/70">{user?.name ?? ''}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Verify all 3 dashboard navs render**

Visit each dashboard route and verify Deep Teal nav bar with proper links.

- [ ] **Step 6: Commit**

```bash
git add app/(dashboard)/layout.tsx app/(dashboard)/student/layout.tsx app/(dashboard)/instructor/layout.tsx app/(dashboard)/admin/layout.tsx
git commit -m "style: redesign all dashboard layouts with Mihraby nav"
```

### Task 13: Redesign Dashboard Home Pages (All 3 Roles)

**Files:**
- Modify: `app/(dashboard)/student/page.tsx`
- Modify: `app/(dashboard)/instructor/page.tsx`
- Modify: `app/(dashboard)/admin/page.tsx`

- [ ] **Step 1: Redesign student dashboard**

Replace `app/(dashboard)/student/page.tsx`:

```tsx
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Dashboard',
};

export default async function StudentDashboard() {
  return (
    <>
      <h2 className="text-2xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)] mb-6">
        Student Dashboard
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/student/courses"
          className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-primary)]">Browse Courses</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Explore available courses and book sessions
            </p>
          </div>
        </Link>

        <Link
          href="/student/bookings"
          className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-primary)]">My Bookings</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              View your upcoming and past bookings
            </p>
          </div>
        </Link>

        <div className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-sm)]">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-primary)]">Profile</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Manage your profile settings
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Redesign instructor dashboard**

Replace `app/(dashboard)/instructor/page.tsx`:

```tsx
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Instructor Dashboard',
};

export default async function InstructorDashboard() {
  return (
    <>
      <h2 className="text-2xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)] mb-6">
        Instructor Dashboard
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/instructor/courses"
          className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-primary)]">My Courses</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              View and manage your courses
            </p>
          </div>
        </Link>

        <Link
          href="/instructor/courses/new"
          className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-primary)]">Create Course</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Create a new course offering
            </p>
          </div>
        </Link>

        <div className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-sm)]">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-primary)]">Bookings</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              View student bookings for your courses
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Redesign admin dashboard**

Replace `app/(dashboard)/admin/page.tsx`:

```tsx
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

export default async function AdminDashboard() {
  return (
    <>
      <h2 className="text-2xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)] mb-6">
        Admin Dashboard
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/users"
          className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-primary)]">Manage Users</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              View and manage all users, update roles
            </p>
          </div>
        </Link>

        <Link
          href="/admin/courses"
          className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-primary)]">Manage Courses</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              View and manage all courses in the system
            </p>
          </div>
        </Link>

        <div className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-sm)]">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-primary)]">Payment Approvals</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Review and approve InstaPay payments
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Verify all dashboards**

Check all 3 dashboard pages render with Warm Linen cards, Deep Teal headings.

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/student/page.tsx app/(dashboard)/instructor/page.tsx app/(dashboard)/admin/page.tsx
git commit -m "style: redesign all dashboard home pages"
```

### Task 14: Redesign Student Course Browse + List

**Files:**
- Modify: `app/(dashboard)/student/courses/page.tsx`
- Modify: `app/(dashboard)/student/courses/student-courses-list.tsx`

- [ ] **Step 1: Update page header**

Replace `app/(dashboard)/student/courses/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { StudentCoursesList } from './student-courses-list';

export const metadata: Metadata = {
  title: 'Browse Courses | Student',
};

export default function StudentCoursesPage() {
  return (
    <>
      <h2 className="text-2xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)] mb-6">
        Browse courses
      </h2>
      <StudentCoursesList />
    </>
  );
}
```

- [ ] **Step 2: Redesign course cards**

Replace `app/(dashboard)/student/courses/student-courses-list.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useCourses } from '@/features/courses/api';
import type { CourseWithInstructor } from '@/lib/types';

export function StudentCoursesList() {
  const { data, isLoading, error } = useCourses();

  const response = data as
    | { success: boolean; data?: { courses?: CourseWithInstructor[] } }
    | undefined;
  const courses: CourseWithInstructor[] = response?.data?.courses ?? [];

  if (isLoading) {
    return <p className="text-[var(--color-text-muted)]">Loading courses...</p>;
  }
  if (error) {
    return (
      <p className="text-[var(--color-error)]">Failed to load courses: {error.message}</p>
    );
  }
  if (courses.length === 0) {
    return (
      <div className="rounded-xl bg-[var(--color-surface)] p-8 text-center">
        <p className="text-[var(--color-text-secondary)]">No published courses yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Link
          key={course.id}
          href={`/student/courses/${course.id}`}
          className="block rounded-xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] border border-[var(--color-border-light)] hover:border-[var(--color-accent)]/40 transition-all"
        >
          <h3 className="font-semibold text-[var(--color-primary)]">{course.title}</h3>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)] line-clamp-2">
            {course.description ?? 'No description'}
          </p>
          <div className="mt-4">
            <span className="text-sm font-semibold text-[var(--color-accent)]">
              {Number(course.price)} EGP
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verify course browse page**

Visit the student courses page. Verify: Warm Linen cards, Gold price, Deep Teal title.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/student/courses/page.tsx" "app/(dashboard)/student/courses/student-courses-list.tsx"
git commit -m "style: redesign student course browse page"
```

### Task 15: Redesign Student Course Detail + Booking Flow

**Files:**
- Modify: `app/(dashboard)/student/courses/[id]/page.tsx`
- Modify: `app/(dashboard)/student/courses/[id]/student-course-detail.tsx`

- [ ] **Step 1: Update course detail page wrapper**

Replace `app/(dashboard)/student/courses/[id]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { StudentCourseDetail } from './student-course-detail';

export const metadata: Metadata = {
  title: 'Course | Student',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudentCoursePage({ params }: PageProps) {
  const { id } = await params;
  const courseId = parseInt(id, 10);
  if (Number.isNaN(courseId)) {
    return (
      <div>
        <p className="text-[var(--color-error)]">Invalid course ID</p>
        <Link href="/student/courses" className="text-[var(--color-accent)] hover:underline">
          Back to courses
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Link
          href="/student/courses"
          className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-light)] transition-colors"
        >
          &larr; Back to courses
        </Link>
      </div>
      <StudentCourseDetail courseId={courseId} />
    </>
  );
}
```

- [ ] **Step 2: Redesign the full booking flow component**

Replace `app/(dashboard)/student/courses/[id]/student-course-detail.tsx` — keep ALL logic identical, only change CSS classes and structure:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { courseApi } from '@/lib/api';
import { SlotPicker } from '@/features/time-slots';
import { useAvailableSlots } from '@/features/time-slots/api';
import { useInitiateBooking, useCreateCheckoutSession } from '@/features/bookings/api';
import type { ITimeSlot, PaymentMethod } from '@/lib/types';

type StudentCourseDetailProps = {
  courseId: number;
};

type CourseData = {
  id: number;
  title: string;
  description: string | null;
  price: number;
  price_per_slot: number;
  currency: string;
  status: string;
  instructor?: { name: string; email: string };
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'paymob_card', label: 'Credit / Debit Card' },
  { value: 'paymob_wallet', label: 'Vodafone Cash' },
  { value: 'paymob_fawry', label: 'Fawry' },
  { value: 'instapay', label: 'InstaPay (manual transfer)' },
];

export function StudentCourseDetail({ courseId }: StudentCourseDetailProps) {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<ITimeSlot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paymob_card');

  const { data: courseRes, isLoading: courseLoading, error: courseError } = useQuery({
    queryKey: ['student-course', courseId],
    queryFn: async () => {
      const res = await courseApi.getCourseById(courseId);
      if (!res.success || !res.data) throw new Error(res.error ?? 'Course not found');
      return res.data as { course?: CourseData } | CourseData;
    },
    enabled: courseId > 0,
  });

  const course: CourseData | undefined =
    courseRes && typeof courseRes === 'object' && 'course' in courseRes
      ? (courseRes as { course: CourseData }).course
      : (courseRes as CourseData);

  const { data: slots = [], isLoading: slotsLoading } = useAvailableSlots(courseId);
  const initiate = useInitiateBooking();
  const checkout = useCreateCheckoutSession();

  const handleBook = () => {
    if (!selectedSlot) return;
    initiate.mutate(
      { slot_id: selectedSlot.id, payment_method: paymentMethod },
      {
        onSuccess: (booking) => {
          if (paymentMethod.startsWith('paymob_')) {
            checkout.mutate(
              { bookingId: booking.id, paymentMethod },
              {
                onSuccess: ({ redirectUrl }) => {
                  window.location.href = redirectUrl;
                },
              }
            );
          } else {
            router.push('/student/bookings');
          }
        },
      }
    );
  };

  if (courseLoading || courseError || !course) {
    return (
      <p className="text-[var(--color-error)]">
        {courseError instanceof Error ? courseError.message : 'Loading...'}
      </p>
    );
  }

  const price = Number(course.price_per_slot || course.price);

  return (
    <div className="space-y-6">
      {/* Course info */}
      <div className="rounded-xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <h2 className="text-xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)]">
          {course.title}
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">{course.description ?? 'No description'}</p>
        <div className="mt-3">
          <span className="text-lg font-bold text-[var(--color-accent)]">
            {price} EGP / session
          </span>
        </div>
      </div>

      {/* Slot picker */}
      <div className="rounded-xl bg-[var(--color-bg-white)] p-6 border border-[var(--color-border-light)]">
        <h3 className="text-lg font-semibold text-[var(--color-primary)] font-[family-name:var(--font-heading)] mb-4">
          1. Pick a time
        </h3>
        {slotsLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading slots...</p>
        ) : (
          <SlotPicker
            courseId={courseId}
            slots={slots}
            onSelect={setSelectedSlot}
            selectedSlotId={selectedSlot?.id ?? null}
          />
        )}
      </div>

      {/* Payment method */}
      {selectedSlot && (
        <div className="rounded-xl bg-[var(--color-bg-white)] p-6 border border-[var(--color-border-light)]">
          <h3 className="text-lg font-semibold text-[var(--color-primary)] font-[family-name:var(--font-heading)] mb-4">
            2. Payment method
          </h3>
          <div className="space-y-3">
            {PAYMENT_METHODS.map((pm) => (
              <label key={pm.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="payment_method"
                  value={pm.value}
                  checked={paymentMethod === pm.value}
                  onChange={() => setPaymentMethod(pm.value)}
                  className="h-4 w-4 text-[var(--color-accent)] border-[var(--color-border)] focus:ring-[var(--color-accent)]"
                />
                <span className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)]">{pm.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              type="button"
              onClick={handleBook}
              disabled={initiate.isPending || checkout.isPending}
              className="rounded-lg bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)] disabled:opacity-50 transition-colors"
            >
              {initiate.isPending || checkout.isPending ? 'Processing...' : `Book for ${price} EGP`}
            </button>
            {initiate.isError && (
              <p className="text-sm text-[var(--color-error)]">{initiate.error.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify course detail + booking flow**

Navigate to a course detail page. Verify slot picker and payment method sections.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/student/courses/[id]/page.tsx" "app/(dashboard)/student/courses/[id]/student-course-detail.tsx"
git commit -m "style: redesign student course detail and booking flow"
```

### Task 16: Redesign Student Bookings + Payment Return

**Files:**
- Modify: `app/(dashboard)/student/bookings/page.tsx`
- Modify: `app/(dashboard)/student/bookings/[id]/return/page.tsx`
- Modify: `features/bookings/components/my-bookings.tsx`

- [ ] **Step 1: Update bookings page header**

Replace `app/(dashboard)/student/bookings/page.tsx`:

```tsx
import { MyBookings } from '@/features/bookings/components';

export const metadata = { title: 'My Bookings | Student' };

export default function StudentBookingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)] mb-6">
        My Bookings
      </h1>
      <MyBookings />
    </div>
  );
}
```

- [ ] **Step 2: Redesign MyBookings component with branded status badges**

Replace `features/bookings/components/my-bookings.tsx`:

```tsx
'use client';

import { useMyBookings, useCancelBooking } from '@/features/bookings/api';
import type { BookingWithDetails } from '@/lib/types';

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'bg-[var(--color-warning-light)] text-[var(--color-accent-dark)]',
  pending_review: 'bg-purple-50 text-purple-700',
  confirmed: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
  cancelled: 'bg-[var(--color-bg)] text-[var(--color-text-muted)]',
  completed: 'bg-blue-50 text-blue-700',
  no_show: 'bg-[var(--color-error-light)] text-[var(--color-error)]',
};

function BookingRow({ booking }: { booking: BookingWithDetails }) {
  const cancel = useCancelBooking();
  const canCancel = booking.status === 'pending_payment' || booking.status === 'pending_review';

  return (
    <li className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-[var(--color-primary)]">{booking.course_title}</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {formatDate(booking.slot_start_time)} &ndash; {formatDate(booking.slot_end_time)}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Instructor: {booking.instructor_name}
          </p>
          <p className="text-sm text-[var(--color-accent)] font-medium mt-1">
            {Number(booking.amount)} EGP &middot; {booking.payment_method ?? 'not set'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[booking.status] ?? 'bg-[var(--color-surface)]'}`}>
            {booking.status.replace('_', ' ')}
          </span>
          {canCancel && (
            <button
              type="button"
              onClick={() => cancel.mutate(booking.id)}
              disabled={cancel.isPending}
              className="text-xs text-[var(--color-error)] hover:underline disabled:opacity-50"
            >
              {cancel.isPending ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export default function MyBookings() {
  const { data: bookings = [], isLoading, error } = useMyBookings();

  if (isLoading) return <p className="text-sm text-[var(--color-text-muted)]">Loading bookings...</p>;
  if (error) return <p className="text-sm text-[var(--color-error)]">Failed to load bookings</p>;

  if (bookings.length === 0) {
    return (
      <div className="rounded-xl bg-[var(--color-surface)] p-8 text-center">
        <p className="text-[var(--color-text-secondary)]">No bookings yet. Browse courses to book a session.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {bookings.map((b) => (
        <BookingRow key={b.id} booking={b as BookingWithDetails} />
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Redesign payment return page**

Replace `app/(dashboard)/student/bookings/[id]/return/page.tsx`:

```tsx
'use client';

import { use } from 'react';
import Link from 'next/link';
import { useBookingPayStatus } from '@/features/bookings/api';

export default function BookingReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bookingId = Number(id);
  const { data, isLoading, error } = useBookingPayStatus(bookingId);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-text-secondary)]">Verifying your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-[var(--color-error-light)] border border-[var(--color-error)]/20 p-8 text-center">
        <p className="text-[var(--color-error)]">Something went wrong verifying your payment.</p>
        <Link href="/student/bookings" className="mt-4 inline-block text-[var(--color-accent)] hover:underline">
          Go to My Bookings
        </Link>
      </div>
    );
  }

  if (data.status === 'confirmed') {
    return (
      <div className="rounded-xl bg-[var(--color-success-light)] border border-[var(--color-success)]/20 p-8 text-center">
        <h2 className="text-xl font-bold text-[var(--color-success)] font-[family-name:var(--font-heading)]">
          Payment Successful!
        </h2>
        <p className="mt-2 text-[var(--color-success)]">Your booking has been confirmed.</p>
        <Link
          href="/student/bookings"
          className="mt-4 inline-block rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
        >
          View My Bookings
        </Link>
      </div>
    );
  }

  if (data.status === 'cancelled') {
    return (
      <div className="rounded-xl bg-[var(--color-error-light)] border border-[var(--color-error)]/20 p-8 text-center">
        <h2 className="text-xl font-bold text-[var(--color-error)] font-[family-name:var(--font-heading)]">
          Payment Not Completed
        </h2>
        <p className="mt-2 text-[var(--color-error)]">Your booking was cancelled or the payment failed.</p>
        <Link
          href="/student/courses"
          className="mt-4 inline-block rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
        >
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
      <p className="mt-4 text-[var(--color-text-secondary)]">Verifying your payment...</p>
    </div>
  );
}
```

- [ ] **Step 4: Verify bookings page and return page**

Check the bookings list page and navigate to a payment return page.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/student/bookings/page.tsx" "app/(dashboard)/student/bookings/[id]/return/page.tsx" "features/bookings/components/my-bookings.tsx"
git commit -m "style: redesign student bookings and payment return pages"
```

### Task 17: Redesign Instructor Pages

**Files:**
- Modify: `app/(dashboard)/instructor/courses/page.tsx`
- Modify: `app/(dashboard)/instructor/courses/instructor-courses-list.tsx`
- Modify: `app/(dashboard)/instructor/courses/[id]/page.tsx`
- Modify: `app/(dashboard)/instructor/courses/[id]/instructor-course-detail.tsx`
- Modify: `app/(dashboard)/instructor/courses/new/page.tsx`
- Modify: `app/(dashboard)/instructor/courses/new/create-course-form.tsx`

- [ ] **Step 1: Update instructor courses page header**

Replace `app/(dashboard)/instructor/courses/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { InstructorCoursesList } from './instructor-courses-list';

export const metadata: Metadata = {
  title: 'My Courses | Instructor',
};

export default function InstructorCoursesPage() {
  return (
    <>
      <h2 className="text-2xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)] mb-6">
        My Courses
      </h2>
      <InstructorCoursesList />
    </>
  );
}
```

- [ ] **Step 2: Redesign instructor courses list**

Replace `app/(dashboard)/instructor/courses/instructor-courses-list.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useInstructorCourses } from '@/features/courses/api';
import type { ICourse } from '@/lib/types';

export function InstructorCoursesList() {
  const { data, isLoading, error } = useInstructorCourses();

  const courses: ICourse[] = (data?.data && typeof data.data === 'object' && 'courses' in data.data)
    ? (data.data as { courses: ICourse[] }).courses
    : [];

  if (isLoading) {
    return <p className="text-[var(--color-text-muted)]">Loading courses...</p>;
  }
  if (error) {
    return (
      <p className="text-[var(--color-error)]">Failed to load courses: {error.message}</p>
    );
  }
  if (courses.length === 0) {
    return (
      <div className="rounded-xl bg-[var(--color-surface)] p-8 text-center">
        <p className="text-[var(--color-text-secondary)]">You have no courses yet.</p>
        <Link
          href="/instructor/courses/new"
          className="mt-4 inline-block rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
        >
          Create your first course
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Link
          key={course.id}
          href={`/instructor/courses/${course.id}`}
          className="block rounded-xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] border border-[var(--color-border-light)] hover:border-[var(--color-accent)]/40 transition-all"
        >
          <h3 className="font-semibold text-[var(--color-primary)]">{course.title}</h3>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)] line-clamp-2">
            {course.description ?? 'No description'}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--color-accent)]">
              {Number(course.price)} EGP
            </span>
            <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
              {course.status}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Update instructor course detail page + component**

Replace `app/(dashboard)/instructor/courses/[id]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { InstructorCourseDetail } from './instructor-course-detail';

export const metadata: Metadata = {
  title: 'Course | Instructor',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InstructorCoursePage({ params }: PageProps) {
  const { id } = await params;
  const courseId = parseInt(id, 10);
  if (Number.isNaN(courseId)) {
    return (
      <div>
        <p className="text-[var(--color-error)]">Invalid course ID</p>
        <Link href="/instructor/courses" className="text-[var(--color-accent)] hover:underline">
          Back to courses
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Link
          href="/instructor/courses"
          className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-light)] transition-colors"
        >
          &larr; Back to courses
        </Link>
      </div>
      <InstructorCourseDetail courseId={courseId} />
    </>
  );
}
```

Replace `app/(dashboard)/instructor/courses/[id]/instructor-course-detail.tsx`:

```tsx
'use client';

import { useInstructorCourses } from '@/features/courses/api';
import { CourseTimeSlotsManager } from '@/features/time-slots';
import type { ICourse } from '@/lib/types';

type InstructorCourseDetailProps = {
  courseId: number;
};

export function InstructorCourseDetail({ courseId }: InstructorCourseDetailProps) {
  const { data, isLoading, error } = useInstructorCourses();

  const courses: ICourse[] =
    data?.data && typeof data.data === 'object' && 'courses' in data.data
      ? (data.data as { courses: ICourse[] }).courses
      : [];
  const course = courses.find((c) => c.id === courseId);

  if (isLoading) {
    return <p className="text-[var(--color-text-muted)]">Loading course...</p>;
  }
  if (error || !course) {
    return (
      <p className="text-[var(--color-error)]">
        {error instanceof Error ? error.message : 'Course not found'}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <h2 className="text-xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)]">
          {course.title}
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">{course.description ?? 'No description'}</p>
        <div className="mt-3 flex gap-4 text-sm">
          <span className="font-semibold text-[var(--color-accent)]">{Number(course.price)} EGP</span>
          <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
            {course.status}
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-[var(--color-bg-white)] p-6 border border-[var(--color-border-light)]">
        <CourseTimeSlotsManager courseId={courseId} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update create course page + form**

Replace `app/(dashboard)/instructor/courses/new/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { CreateCourseForm } from './create-course-form';

export const metadata: Metadata = {
  title: 'Create Course | Instructor',
};

export default function NewCoursePage() {
  return (
    <>
      <div className="mb-6">
        <Link
          href="/instructor/courses"
          className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-light)] transition-colors"
        >
          &larr; Back to courses
        </Link>
      </div>
      <h2 className="text-2xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)] mb-6">
        Create course
      </h2>
      <CreateCourseForm />
    </>
  );
}
```

Replace `app/(dashboard)/instructor/courses/new/create-course-form.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateCourse } from '@/features/courses/api';
import type { CreateCourseDTO } from '@/lib/types';

export function CreateCourseForm() {
  const router = useRouter();
  const createCourse = useCreateCourse();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    if (Number.isNaN(numPrice) || numPrice < 0) {
      return;
    }
    const data: CreateCourseDTO = {
      title: title.trim(),
      description: description.trim() || undefined,
      price: numPrice,
      status,
      price_per_slot: numPrice,
    };
    createCourse.mutate(data, {
      onSuccess: (course) => {
        router.push(`/instructor/courses/${course.id}`);
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl rounded-xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-white)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] text-sm transition-colors"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-white)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] text-sm transition-colors"
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Price (EGP)
          </label>
          <input
            id="price"
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-white)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] text-sm transition-colors"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-white)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] text-sm transition-colors"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>
      <div className="mt-6">
        <button
          type="submit"
          disabled={createCourse.isPending}
          className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)] disabled:opacity-50 transition-colors"
        >
          {createCourse.isPending ? 'Creating...' : 'Create course'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: Verify all instructor pages**

Check courses list, course detail, and create course form.

- [ ] **Step 6: Commit**

```bash
git add "app/(dashboard)/instructor/"
git commit -m "style: redesign all instructor pages with Mihraby brand"
```

### Task 18: Redesign Time Slot Components

**Files:**
- Modify: `features/time-slots/components/slot-picker.tsx`
- Modify: `features/time-slots/components/course-time-slots-manager.tsx`
- Modify: `features/time-slots/components/time-slot-calendar.tsx`
- Modify: `features/time-slots/components/time-slot-form.tsx`

- [ ] **Step 1: Redesign slot picker**

Replace `features/time-slots/components/slot-picker.tsx`:

```tsx
'use client';

import { ITimeSlot } from '@/lib/types';

type SlotPickerProps = {
  courseId: number;
  slots: ITimeSlot[];
  onSelect?: (slot: ITimeSlot) => void;
  selectedSlotId?: number | null;
};

function formatSlotTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function SlotPicker({
  courseId,
  slots,
  onSelect,
  selectedSlotId = null,
}: SlotPickerProps) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        No available slots for this course right now. Check back later.
      </p>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--color-primary)] mb-3">
        Available times ({slots.length})
      </h3>
      <ul className="space-y-2">
        {slots.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect?.(s)}
              className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-all ${
                selectedSlotId === s.id
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-medium shadow-[var(--shadow-sm)]'
                  : 'border-[var(--color-border-light)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
              }`}
            >
              {formatSlotTime(s.start_time)} – {formatSlotTime(s.end_time)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Redesign time slot calendar**

Replace `features/time-slots/components/time-slot-calendar.tsx`:

```tsx
'use client';

import { ITimeSlot } from '@/lib/types';

type TimeSlotCalendarProps = {
  slots: ITimeSlot[];
  onSlotSelect?: (slot: ITimeSlot) => void;
  onEdit?: (slot: ITimeSlot) => void;
  onDelete?: (slot: ITimeSlot) => void;
  isDeletingId?: number | null;
};

function formatSlotTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function TimeSlotCalendar({
  slots,
  onSlotSelect,
  onEdit,
  onDelete,
  isDeletingId = null,
}: TimeSlotCalendarProps) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">No time slots yet. Add one above.</p>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-white)] overflow-hidden">
      <ul className="divide-y divide-[var(--color-border-light)]">
        {slots.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-[var(--color-bg)]"
          >
            <div className="text-sm">
              <span className="font-medium text-[var(--color-primary)]">
                {formatSlotTime(s.start_time)} – {formatSlotTime(s.end_time)}
              </span>
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                  s.is_available
                    ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                    : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                }`}
              >
                {s.is_available ? 'Available' : 'Booked'}
              </span>
            </div>
            <div className="flex gap-3">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(s)}
                  className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-light)] transition-colors"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(s)}
                  disabled={isDeletingId === s.id}
                  className="text-sm text-[var(--color-error)] hover:text-[var(--color-error)]/80 disabled:opacity-50 transition-colors"
                >
                  {isDeletingId === s.id ? 'Deleting...' : 'Delete'}
                </button>
              )}
              {onSlotSelect && s.is_available && (
                <button
                  type="button"
                  onClick={() => onSlotSelect(s)}
                  className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-light)] transition-colors"
                >
                  Select
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Redesign time slot form**

Replace `features/time-slots/components/time-slot-form.tsx`:

```tsx
'use client';

import { useState, useCallback } from 'react';
import { ITimeSlot, CreateTimeSlotDTO } from '@/lib/types';
import { createTimeSlotSchema } from '@/lib/validators/time-slot';

type TimeSlotFormProps = {
  courseId: number;
  slot?: ITimeSlot | null;
  onSubmit: (data: CreateTimeSlotDTO) => void;
  onCancel?: () => void;
  isPending?: boolean;
};

function toDateTimeLocal(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocal(value: string): string {
  return new Date(value).toISOString();
}

export default function TimeSlotForm({
  courseId,
  slot,
  onSubmit,
  onCancel,
  isPending = false,
}: TimeSlotFormProps) {
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000);
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000);

  const [startTime, setStartTime] = useState(() =>
    slot ? toDateTimeLocal(slot.start_time) : toDateTimeLocal(defaultStart)
  );
  const [endTime, setEndTime] = useState(() =>
    slot ? toDateTimeLocal(slot.end_time) : toDateTimeLocal(defaultEnd)
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const start = fromDateTimeLocal(startTime);
      const end = fromDateTimeLocal(endTime);
      const result = createTimeSlotSchema.safeParse({
        course_id: courseId,
        start_time: start,
        end_time: end,
      });
      if (!result.success) {
        setError(result.error.issues.map((i: { message: string }) => i.message).join('. '));
        return;
      }
      onSubmit({
        course_id: courseId,
        start_time: result.data.start_time,
        end_time: result.data.end_time,
      });
    },
    [courseId, startTime, endTime, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4">
      <h3 className="text-sm font-semibold text-[var(--color-primary)] mb-3">
        {slot ? `Edit slot #${slot.id}` : 'Add time slot'}
      </h3>
      {error && (
        <p className="mb-3 text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="start_time" className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            Start
          </label>
          <input
            id="start_time"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            min={slot ? undefined : toDateTimeLocal(now)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-white)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors"
            required
          />
        </div>
        <div>
          <label htmlFor="end_time" className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            End
          </label>
          <input
            id="end_time"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            min={startTime}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-white)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors"
            required
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)] disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving...' : slot ? 'Update slot' : 'Add slot'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-white)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Redesign time slots manager**

Replace `features/time-slots/components/course-time-slots-manager.tsx` — keep all logic, change only CSS:

```tsx
'use client';

import { useState } from 'react';
import {
  TimeSlotForm,
  TimeSlotCalendar,
} from '@/features/time-slots/components';
import {
  useTimeSlots,
  useCreateTimeSlot,
  useUpdateTimeSlot,
  useDeleteTimeSlot,
} from '@/features/time-slots/api';
import type { ITimeSlot, CreateTimeSlotDTO } from '@/lib/types';

type CourseTimeSlotsManagerProps = {
  courseId: number;
};

export default function CourseTimeSlotsManager({ courseId }: CourseTimeSlotsManagerProps) {
  const { data: slots = [], isLoading, error } = useTimeSlots(courseId);
  const createSlot = useCreateTimeSlot(courseId);
  const updateSlot = useUpdateTimeSlot();
  const deleteSlot = useDeleteTimeSlot();

  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ITimeSlot | null>(null);
  const [deletingSlotId, setDeletingSlotId] = useState<number | null>(null);

  const handleCreateSubmit = (data: CreateTimeSlotDTO) => {
    createSlot.mutate(data, {
      onSuccess: () => {
        setShowForm(false);
      },
    });
  };

  const handleEdit = (slot: ITimeSlot) => {
    setEditingSlot(slot);
  };

  const handleEditSubmit = (data: CreateTimeSlotDTO) => {
    if (!editingSlot) return;
    updateSlot.mutate(
      {
        slotId: editingSlot.id,
        start_time: data.start_time,
        end_time: data.end_time,
      },
      {
        onSuccess: () => {
          setEditingSlot(null);
        },
      }
    );
  };

  const handleDelete = (slot: ITimeSlot) => {
    if (!confirm('Remove this time slot?')) return;
    setDeletingSlotId(slot.id);
    deleteSlot.mutate(slot.id, {
      onSettled: () => setDeletingSlotId(null),
    });
  };

  if (isLoading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading slots...</p>;
  }
  if (error) {
    return (
      <p className="text-sm text-[var(--color-error)]">
        Failed to load slots: {error.message}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--color-primary)] font-[family-name:var(--font-heading)]">
          Time slots
        </h3>
        {!showForm && !editingSlot && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-1.5 text-sm font-semibold text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
          >
            Add slot
          </button>
        )}
      </div>

      {showForm && (
        <TimeSlotForm
          courseId={courseId}
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowForm(false)}
          isPending={createSlot.isPending}
        />
      )}

      {editingSlot && (
        <TimeSlotForm
          courseId={courseId}
          slot={editingSlot}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingSlot(null)}
          isPending={updateSlot.isPending}
        />
      )}

      <TimeSlotCalendar
        slots={slots}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeletingId={deletingSlotId}
      />
    </div>
  );
}
```

- [ ] **Step 5: Verify all time slot components**

Navigate to an instructor course detail page. Add/edit/delete a slot. Then check the student-facing slot picker on a course detail page.

- [ ] **Step 6: Commit**

```bash
git add features/time-slots/components/
git commit -m "style: redesign all time slot components with Mihraby brand"
```

### Task 19: Redesign Remaining Booking Placeholders + Courses List

**Files:**
- Modify: `features/bookings/components/booking-cart.tsx`
- Modify: `features/bookings/components/admin-bookings.tsx`
- Modify: `features/bookings/components/instructor-bookings.tsx`
- Modify: `features/courses/components/courses-list.tsx`

- [ ] **Step 1: Update placeholder booking components**

Replace `features/bookings/components/booking-cart.tsx`:

```tsx
'use client';

export default function BookingCart() {
  return (
    <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4">
      <p className="text-sm text-[var(--color-text-secondary)]">Booking cart (coming soon)</p>
    </div>
  );
}
```

Replace `features/bookings/components/admin-bookings.tsx`:

```tsx
'use client';

export default function AdminBookings() {
  return (
    <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4">
      <p className="text-sm text-[var(--color-text-secondary)]">Admin bookings (coming soon)</p>
    </div>
  );
}
```

Replace `features/bookings/components/instructor-bookings.tsx`:

```tsx
'use client';

export default function InstructorBookings() {
  return (
    <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4">
      <p className="text-sm text-[var(--color-text-secondary)]">Instructor bookings (coming soon)</p>
    </div>
  );
}
```

- [ ] **Step 2: Redesign the shared courses list component**

Replace `features/courses/components/courses-list.tsx`:

```tsx
'use client';

import { useCourses, useDeleteCourse } from '@/features/courses/api';
import { useAuthorization } from '@/lib/authorization';
import { ErrorBoundary } from '@/lib/components/error-boundary';
import { CourseWithInstructor } from '@/types';

export const CoursesList = () => {
  const { data: courses, isLoading, error } = useCourses();
  const deleteCourse = useDeleteCourse();
  const { checkAccess } = useAuthorization();

  if (isLoading) {
    return <div className="text-center py-8 text-[var(--color-text-muted)]">Loading courses...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-[var(--color-error)]">
        Error loading courses: {error.message}
      </div>
    );
  }

  const handleDelete = async (courseId: number) => {
    if (confirm('Are you sure you want to delete this course?')) {
      await deleteCourse.mutateAsync(courseId);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {courses?.data?.map((course: CourseWithInstructor) => (
        <div key={course.id} className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-sm)] p-6">
          <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-2">{course.title}</h3>
          <p className="text-[var(--color-text-secondary)] mb-4 line-clamp-2">{course.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-accent)] font-bold">{Number(course.price)} EGP</span>
            <div className="flex gap-2">
              {checkAccess('course:update', course) && (
                <button className="px-3 py-1 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] rounded-lg text-sm hover:bg-[var(--color-primary-light)] transition-colors">
                  Edit
                </button>
              )}
              {checkAccess('course:delete', course) && (
                <button
                  onClick={() => handleDelete(course.id)}
                  disabled={deleteCourse.isPending}
                  className="px-3 py-1 bg-[var(--color-error)] text-white rounded-lg text-sm hover:bg-[var(--color-error)]/90 disabled:opacity-50 transition-colors"
                >
                  {deleteCourse.isPending ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const CoursesListWithBoundary = () => (
  <ErrorBoundary
    fallback={
      <div className="text-center py-8 text-[var(--color-error)]">
        Something went wrong loading courses. Please try again.
      </div>
    }
  >
    <CoursesList />
  </ErrorBoundary>
);
```

- [ ] **Step 3: Commit**

```bash
git add features/bookings/components/ features/courses/components/courses-list.tsx
git commit -m "style: redesign remaining booking and course components"
```

### Task 20: Full Visual Verification

- [ ] **Step 1: Start dev server and click through all pages**

```bash
yarn dev
```

Verify each page in order:
1. Landing page (http://localhost:3000) — Deep Teal nav, Gold CTAs, Warm Linen cards
2. Login page (/login)
3. Register page (/register)
4. Student dashboard (/student)
5. Student course browse (/student/courses)
6. Student course detail (/student/courses/[id])
7. Student bookings (/student/bookings)
8. Instructor dashboard (/instructor)
9. Instructor courses (/instructor/courses)
10. Instructor course detail (/instructor/courses/[id])
11. Create course (/instructor/courses/new)
12. Admin dashboard (/admin)

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: No new errors (pre-existing auth middleware errors are OK).

- [ ] **Step 3: Run lint**

```bash
yarn lint
```

Expected: No new errors.

- [ ] **Step 4: Commit any fixes if needed**

---

## Phase C: Hardening

### Task 21: Run `/normalize` skill

- [ ] **Step 1: Invoke the normalize skill**

Run `/normalize` to audit spacing, token usage, and design system consistency across all restyled files.

- [ ] **Step 2: Apply fixes and commit**

```bash
git add -A
git commit -m "style: normalize spacing and token consistency"
```

### Task 22: Run `/polish` skill

- [ ] **Step 1: Invoke the polish skill**

Run `/polish` to fix alignment, visual rhythm, and micro-interactions.

- [ ] **Step 2: Apply fixes and commit**

```bash
git add -A
git commit -m "style: polish alignment and visual rhythm"
```

### Task 23: Run `/harden` skill

- [ ] **Step 1: Invoke the harden skill**

Run `/harden` to add error states, loading skeletons, empty states, and edge case handling.

- [ ] **Step 2: Apply fixes and commit**

```bash
git add -A
git commit -m "style: harden error states and loading UX"
```

### Task 24: Run `/adapt` skill

- [ ] **Step 1: Invoke the adapt skill**

Run `/adapt` to verify responsive breakpoints at 375px, 768px, and 1440px. Add RTL layout preparation.

- [ ] **Step 2: Apply fixes and commit**

```bash
git add -A
git commit -m "style: adapt responsive layout and RTL prep"
```

### Task 25: Run `/clarify` skill

- [ ] **Step 1: Invoke the clarify skill**

Run `/clarify` to review UX copy — error messages, labels, microcopy across EN pages.

- [ ] **Step 2: Apply fixes and commit**

```bash
git add -A
git commit -m "style: clarify UX copy and labels"
```

### Task 26: Run `/audit` skill

- [ ] **Step 1: Invoke the audit skill**

Run `/audit` for WCAG 2.1 AA accessibility check, performance, and semantic HTML.

- [ ] **Step 2: Apply fixes and commit**

```bash
git add -A
git commit -m "style: fix accessibility and semantic HTML issues"
```

### Task 27: Final End-to-End Verification

- [ ] **Step 1: Full booking flow walkthrough**

1. Start dev server: `yarn dev`
2. Visit landing page → click "Get Started"
3. Register a student account
4. Browse courses → click a course
5. Select a time slot → choose payment method → click "Book"
6. Verify payment return page renders correctly
7. Check My Bookings page

- [ ] **Step 2: Check at mobile viewport (375px)**

Resize browser to 375px width and repeat the flow above. Verify nav, cards, forms, and buttons are usable.

- [ ] **Step 3: Run typecheck + lint one final time**

```bash
npx tsc --noEmit && yarn lint
```

- [ ] **Step 4: Final commit if any remaining fixes**

```bash
git add -A
git commit -m "style: final UI redesign verification fixes"
```
