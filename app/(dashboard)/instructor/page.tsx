import Link from 'next/link';
import type { Metadata } from 'next';
import { GeometricPattern, ArchDivider, CornerOrnament } from '@/lib/components/decorative';

export const metadata: Metadata = {
  title: 'Instructor Dashboard | Mihraby',
};

/* ── Placeholder data (static until data integration) ── */
const revenueThisMonth = '$1,240';
const revenueGrowth = '+12%';

const stats = [
  { label: 'Active', value: '4', sub: 'courses' },
  { label: 'Students', value: '28', sub: 'enrolled' },
  { label: 'Rating', value: '4.9', sub: 'average' },
];

const recentActivity = [
  { type: 'booking', text: 'New booking from Ahmed for Mathematics', time: '2 hours ago' },
  { type: 'complete', text: 'Student completed Physics session', time: 'Yesterday' },
  { type: 'review', text: "Course 'Advanced Arabic' received a 5-star review", time: '2 days ago' },
];

const quickActions = [
  {
    label: 'My Courses',
    description: 'Manage your course offerings',
    href: '/instructor/courses',
    icon: 'book' as const,
  },
  {
    label: 'Create Course',
    description: 'Add a new course listing',
    href: '/instructor/courses/new',
    icon: 'plus' as const,
  },
  {
    label: 'View Schedule',
    description: 'See upcoming sessions',
    href: '/instructor/courses',
    icon: 'calendar' as const,
  },
];

/* ── Icons ── */
function QuickIcon({ type }: { type: 'book' | 'plus' | 'calendar' }) {
  const paths: Record<typeof type, string> = {
    book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    plus: 'M12 4.5v15m7.5-7.5h-15',
    calendar: 'M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
      <path d={paths[type]} />
    </svg>
  );
}

export default async function InstructorDashboard() {
  return (
    <>
      {/* ════════════════════════════════════════════════════════
          WELCOME BANNER — full bleed, editorial scale
          ════════════════════════════════════════════════════════ */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 mb-12 relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-dark)] via-[var(--color-primary)] to-[var(--color-primary-light)]" />
        <GeometricPattern className="absolute inset-0 w-full h-full" opacity={0.06} />
        <CornerOrnament className="absolute top-0 end-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 opacity-[0.08]" />

        <div className="relative z-10 px-6 sm:px-10 lg:px-14 pt-12 sm:pt-16 lg:pt-20 pb-20 sm:pb-24">
          <p className="text-xs sm:text-sm font-medium tracking-[0.2em] uppercase text-[var(--color-accent)] mb-3">
            Instructor Dashboard
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--color-text-on-primary)] font-[family-name:var(--font-heading)] leading-[0.95] tracking-tight">
            Welcome back<span className="text-[var(--color-accent)]">.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[var(--color-surface)]/80 max-w-md">
            Manage your courses, track your students, and grow your teaching practice.
          </p>
        </div>

        <ArchDivider className="relative z-10" />
      </section>

      {/* ════════════════════════════════════════════════════════
          BENTO GRID — revenue feature + stats column
          ════════════════════════════════════════════════════════ */}
      <section className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Featured: Revenue tile (spans 2 cols on desktop) */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(29,64,64,0.4)]">
            <GeometricPattern className="absolute inset-0 w-full h-full" opacity={0.04} />
            <div className="relative z-10">
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--color-accent)] mb-5">
                This Month&apos;s Revenue
              </p>
              <div className="flex items-end gap-4">
                <p className="text-5xl sm:text-6xl font-bold text-[var(--color-text-on-primary)] font-[family-name:var(--font-heading)] tabular-nums leading-none">
                  {revenueThisMonth}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-accent)] bg-[var(--color-accent)]/15 px-3 py-1.5 rounded-lg mb-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                  {revenueGrowth}
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--color-surface)]/60">
                Based on confirmed bookings this month
              </p>

              <Link
                href="/instructor/courses"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-7 py-3 text-sm font-semibold text-[var(--color-text-on-accent)] shadow-[0_4px_20px_-4px_rgba(212,146,10,0.5)] hover:bg-[var(--color-accent-light)] hover:shadow-[0_8px_30px_-4px_rgba(212,146,10,0.6)] transition-[background-color,box-shadow] duration-200"
              >
                View Courses
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Stats column — stacked vertically */}
          <div className="flex flex-row lg:flex-col gap-4 sm:gap-5">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex-1 rounded-2xl bg-[var(--color-bg-white)] p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(29,64,64,0.08)] border border-[var(--color-border-light)]"
              >
                <p className="text-3xl sm:text-4xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)] tabular-nums">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  <span className="font-medium text-[var(--color-text-secondary)]">{stat.label}</span>{' '}
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          MAIN CONTENT — 2/3 activity + 1/3 quick actions
          ════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        {/* ── Recent Activity (2/3) ── */}
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--color-accent)] mb-1">
                Recent
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)]">
                Your Activity
              </h2>
            </div>
          </div>

          {/* Activity cards with timeline */}
          <div className="relative ps-6 sm:ps-8">
            {/* Gold timeline line */}
            <div className="absolute start-2.5 sm:start-3.5 top-6 bottom-6 w-px bg-gradient-to-b from-[var(--color-accent)] via-[var(--color-accent)]/40 to-transparent" aria-hidden="true" />

            <div className="space-y-5">
              {recentActivity.map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
                  <div
                    className="absolute -start-6 sm:-start-8 top-7 w-2 h-2 rounded-full bg-[var(--color-accent)] ring-[3px] ring-[var(--color-bg)]"
                    aria-hidden="true"
                  />

                  {/* Card */}
                  <div className="rounded-2xl bg-[var(--color-bg-white)] border border-[var(--color-border-light)] border-s-4 border-s-[var(--color-accent)] p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(29,64,64,0.06)] hover:shadow-[0_8px_32px_-4px_rgba(29,64,64,0.1)] transition-shadow duration-200">
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {item.text}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick Actions Sidebar (1/3) ── */}
        <div>
          <h2 className="text-lg font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)] mb-5">
            Quick Actions
          </h2>
          <div className="space-y-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group block rounded-2xl bg-[var(--color-bg-white)] border border-[var(--color-border-light)] p-5 shadow-[0_2px_16px_-2px_rgba(29,64,64,0.06)] hover:shadow-[0_8px_32px_-4px_rgba(29,64,64,0.1)] hover:border-[var(--color-accent)]/30 transition-[border-color,box-shadow] duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-accent)]/10 group-hover:text-[var(--color-accent)] transition-colors duration-200 mb-3">
                  <QuickIcon type={action.icon} />
                </div>
                <p className="font-semibold text-[var(--color-text)] text-sm">
                  {action.label}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
