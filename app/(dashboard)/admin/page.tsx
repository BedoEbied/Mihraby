import Link from 'next/link';
import type { Metadata } from 'next';
import { GeometricPattern, ArchDivider, CornerOrnament } from '@/lib/components/decorative';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Mihraby',
};

/* ── Placeholder data ── */
const stats = [
  { label: 'Total Users', value: '156', icon: 'users' as const },
  { label: 'Active Courses', value: '23', icon: 'book' as const },
  { label: 'Pending Reviews', value: '5', icon: 'clock' as const },
  { label: 'Monthly Revenue', value: '$4,820', icon: 'money' as const },
];

const pendingReviews = [
  { name: 'Ahmed Mohamed', initials: 'AM', course: 'Arabic Basics', amount: '$35' },
  { name: 'Sara Ibrahim', initials: 'SI', course: 'Math Tutoring', amount: '$50' },
  { name: 'Youssef Karim', initials: 'YK', course: 'Physics 101', amount: '$40' },
];

/* ── Icons ── */
function StatIcon({ type }: { type: 'users' | 'book' | 'clock' | 'money' }) {
  const paths: Record<typeof type, string> = {
    users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    clock: 'M12 6v6l4 2M12 2a10 10 0 100 20 10 10 0 000-20z',
    money: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 2a10 10 0 100 20 10 10 0 000-20z',
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d={paths[type]} />
    </svg>
  );
}

export default async function AdminDashboard() {
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
            Control Panel
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--color-text-on-primary)] font-[family-name:var(--font-heading)] leading-[0.95] tracking-tight">
            Admin<span className="text-[var(--color-accent)]">.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[var(--color-surface)]/80 max-w-md">
            Monitor platform activity, review pending payments, and manage your marketplace.
          </p>
        </div>

        <ArchDivider className="relative z-10" />
      </section>

      {/* ════════════════════════════════════════════════════════
          STATS GRID — 4 tiles with depth
          ════════════════════════════════════════════════════════ */}
      <section className="mb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-[var(--color-bg-white)] p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(29,64,64,0.08)] border border-[var(--color-border-light)]"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] mb-4">
                <StatIcon type={stat.icon} />
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)] tabular-nums">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)] font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          MAIN CONTENT — 2/3 pending reviews + 1/3 quick actions
          ════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        {/* ── Pending Payment Reviews (2/3) ── */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--color-accent)] mb-1">
              Action Required
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)]">
              Pending Reviews
            </h2>
          </div>

          <div className="space-y-4">
            {pendingReviews.map((review) => (
              <div
                key={review.name}
                className="rounded-2xl bg-[var(--color-bg-white)] border border-[var(--color-border-light)] border-s-4 border-s-[var(--color-accent)] p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(29,64,64,0.06)] hover:shadow-[0_8px_32px_-4px_rgba(29,64,64,0.1)] transition-shadow duration-200"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Avatar */}
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-sm font-bold text-[var(--color-text-on-primary)]">
                      {review.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--color-text)] font-[family-name:var(--font-heading)] truncate">
                        {review.name}
                      </p>
                      <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                        {review.course} &mdash; <span className="font-semibold text-[var(--color-accent)]">{review.amount}</span>
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/admin"
                    className="shrink-0 rounded-lg bg-[var(--color-accent)] px-5 py-2 text-xs font-semibold text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick Actions Sidebar (1/3) ── */}
        <div>
          <h2 className="text-lg font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)] mb-5">
            Quick Actions
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Manage Users', href: '/admin/users', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
              { label: 'Manage Courses', href: '/admin/courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
              { label: 'View Reports', href: '/admin', icon: 'M3 3v18h18M7 16l4-4 4 4 5-6' },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group block rounded-2xl bg-[var(--color-bg-white)] border border-[var(--color-border-light)] p-5 shadow-[0_2px_16px_-2px_rgba(29,64,64,0.06)] hover:shadow-[0_8px_32px_-4px_rgba(29,64,64,0.1)] hover:border-[var(--color-accent)]/30 transition-[border-color,box-shadow] duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-accent)]/10 group-hover:text-[var(--color-accent)] transition-colors duration-200 mb-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
                    <path d={action.icon} />
                  </svg>
                </div>
                <p className="font-semibold text-[var(--color-text)] text-sm">
                  {action.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
