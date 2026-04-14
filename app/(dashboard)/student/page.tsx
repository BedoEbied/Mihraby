import Link from 'next/link';
import type { Metadata } from 'next';
import { GeometricPattern, ArchDivider, CornerOrnament } from '@/lib/components/decorative';
import { getSessionUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Student Dashboard | Mihraby',
};

/* ── Placeholder data (static until data integration) ── */
const nextSession = {
  tutor: 'Dr. Ahmed Hassan',
  initials: 'AH',
  subject: 'Advanced Mathematics',
  date: 'Apr 15, 2026',
  time: '4:00 PM',
  timeUntil: '2 hours',
};

const stats = [
  { label: 'Upcoming', value: '3', sub: 'sessions' },
  { label: 'Completed', value: '24', sub: 'hours' },
  { label: 'Rating', value: '4.8', sub: 'average' },
];

const upcomingSessions = [
  { tutor: 'Dr. Ahmed Hassan', initials: 'AH', subject: 'Advanced Mathematics', date: 'Apr 15', time: '4:00 PM' },
  { tutor: 'Prof. Salma Ibrahim', initials: 'SI', subject: 'Physics', date: 'Apr 16', time: '6:00 PM' },
  { tutor: 'Ms. Nour Khalil', initials: 'NK', subject: 'English Literature', date: 'Apr 18', time: '3:00 PM' },
];

const quickActions = [
  {
    label: 'Browse Courses',
    description: 'Find new tutors and subjects',
    href: '/student/courses',
    icon: 'book' as const,
  },
  {
    label: 'My Schedule',
    description: 'View all your sessions',
    href: '/student/bookings',
    icon: 'calendar' as const,
  },
  {
    label: 'Progress Reports',
    description: 'Track your improvement',
    href: '/student/bookings',
    icon: 'chart' as const,
  },
];

/* ── Icons ── */
function QuickIcon({ type }: { type: 'book' | 'calendar' | 'chart' }) {
  const paths: Record<typeof type, string> = {
    book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    calendar: 'M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
    chart: 'M3 3v18h18M7 16l4-4 4 4 5-6',
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
      <path d={paths[type]} />
    </svg>
  );
}

export default async function StudentDashboard() {
  const user = await getSessionUser();
  const firstName = user?.name?.split(' ')[0] ?? 'Student';

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
            Welcome back
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--color-text-on-primary)] font-[family-name:var(--font-heading)] leading-[0.95] tracking-tight">
            {firstName}
            <span className="text-[var(--color-accent)]">.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[var(--color-surface)]/80 max-w-md">
            Your next session starts in{' '}
            <span className="text-[var(--color-accent)] font-semibold">{nextSession.timeUntil}</span>
          </p>
        </div>

        <ArchDivider className="relative z-10" />
      </section>

      {/* ════════════════════════════════════════════════════════
          BENTO GRID — asymmetric, featured session + stats
          ════════════════════════════════════════════════════════ */}
      <section className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Featured: Next Session (spans 2 cols on desktop) */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(29,64,64,0.4)]">
            <GeometricPattern className="absolute inset-0 w-full h-full" opacity={0.04} />
            <div className="relative z-10">
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--color-accent)] mb-5">
                Next Session
              </p>
              <div className="flex items-start gap-5">
                {/* Tutor avatar */}
                <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center text-xl sm:text-2xl font-bold text-[var(--color-text-on-accent)] shadow-lg">
                  {nextSession.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-on-primary)] font-[family-name:var(--font-heading)] leading-tight truncate">
                    {nextSession.subject}
                  </h2>
                  <p className="mt-1 text-[var(--color-surface)]/70 text-sm sm:text-base">
                    {nextSession.tutor}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] bg-[var(--color-accent)]/15 px-3.5 py-1.5 rounded-lg">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" aria-hidden="true">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {nextSession.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] bg-[var(--color-accent)]/15 px-3.5 py-1.5 rounded-lg">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                      </svg>
                      {nextSession.time}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-7 py-3 text-sm font-semibold text-[var(--color-text-on-accent)] shadow-[0_4px_20px_-4px_rgba(212,146,10,0.5)] hover:bg-[var(--color-accent-light)] hover:shadow-[0_8px_30px_-4px_rgba(212,146,10,0.6)] transition-[background-color,box-shadow] duration-200 cursor-pointer"
                  >
                    Join Session
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </div>
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
          MAIN CONTENT — 2/3 sessions + 1/3 sidebar
          ════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        {/* ── Upcoming Sessions (2/3) ── */}
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--color-accent)] mb-1">
                Upcoming
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)]">
                Your Sessions
              </h2>
            </div>
            <Link
              href="/student/bookings"
              className="text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-light)] transition-colors py-2"
            >
              View all &rarr;
            </Link>
          </div>

          {/* Session cards with timeline */}
          <div className="relative ps-6 sm:ps-8">
            {/* Gold timeline line */}
            <div className="absolute start-2.5 sm:start-3.5 top-6 bottom-6 w-px bg-gradient-to-b from-[var(--color-accent)] via-[var(--color-accent)]/40 to-transparent" aria-hidden="true" />

            <div className="space-y-5">
              {upcomingSessions.map((session, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
                  <div
                    className="absolute -start-6 sm:-start-8 top-7 w-2 h-2 rounded-full bg-[var(--color-accent)] ring-[3px] ring-[var(--color-bg)]"
                    aria-hidden="true"
                  />

                  {/* Card */}
                  <div className="rounded-2xl bg-[var(--color-bg-white)] border border-[var(--color-border-light)] border-s-4 border-s-[var(--color-accent)] p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(29,64,64,0.06)] hover:shadow-[0_8px_32px_-4px_rgba(29,64,64,0.1)] transition-shadow duration-200">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="shrink-0 w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-sm font-bold text-[var(--color-text-on-primary)]">
                        {session.initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--color-text)] font-[family-name:var(--font-heading)] truncate">
                          {session.subject}
                        </p>
                        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                          {session.tutor}
                        </p>
                      </div>

                      {/* Date + Actions */}
                      <div className="shrink-0 text-end hidden sm:block">
                        <p className="text-sm font-semibold text-[var(--color-accent)]">{session.date}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{session.time}</p>
                      </div>
                    </div>

                    {/* Mobile date + buttons row */}
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="sm:hidden">
                        <p className="text-sm font-semibold text-[var(--color-accent)]">{session.date}, {session.time}</p>
                      </div>
                      <div className="flex gap-2 ms-auto">
                        <button
                          type="button"
                          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)] transition-colors cursor-pointer"
                        >
                          Join Session
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
                        >
                          Reschedule
                        </button>
                      </div>
                    </div>
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
