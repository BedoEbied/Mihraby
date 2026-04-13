import Link from "next/link";
import {
  GeometricPattern,
  ArchDivider,
  CornerOrnament,
  StarDivider,
} from "@/lib/components/decorative";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* ─── NAVIGATION ─── */}
      <nav className="bg-[var(--color-primary)] border-b border-[var(--color-accent)]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/"
                className="text-2xl font-bold text-[var(--color-text-on-primary)] font-[family-name:var(--font-heading)] tracking-wide"
              >
                Mihraby
              </Link>
            </div>

            <div className="flex items-center gap-6">
              <Link
                href="#how-it-works"
                className="hidden sm:inline-block text-[var(--color-text-on-primary)]/80 hover:text-[var(--color-text-on-primary)] text-sm font-medium transition-colors"
              >
                How it Works
              </Link>
              <Link
                href="/courses"
                className="hidden sm:inline-block text-[var(--color-text-on-primary)]/80 hover:text-[var(--color-text-on-primary)] text-sm font-medium transition-colors"
              >
                Browse Tutors
              </Link>
              <Link
                href="/login"
                className="border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="bg-[var(--color-accent)] text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)] px-4 py-1.5 rounded-lg text-sm font-semibold shadow-[0_4px_16px_-4px_rgba(212,146,10,0.4)] hover:shadow-[0_8px_24px_-4px_rgba(212,146,10,0.5)] transition-[background-color,box-shadow]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── HERO — editorial scale, layered depth ─── */}
      <section className="relative bg-[var(--color-primary)] overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-dark)] via-[var(--color-primary)] to-[var(--color-primary-light)]" />
        <GeometricPattern
          className="absolute inset-0 text-[var(--color-accent)]"
          opacity={0.06}
        />
        <CornerOrnament className="absolute top-0 end-0 w-56 h-56 sm:w-80 sm:h-80 lg:w-[28rem] lg:h-[28rem] opacity-[0.06]" />

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 sm:pt-28 sm:pb-40 lg:pt-36 lg:pb-48">
          <div className="max-w-3xl">
            <p className="text-xs sm:text-sm font-medium tracking-[0.2em] uppercase text-[var(--color-accent)] mb-4">
              One-on-one tutoring platform
            </p>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight font-[family-name:var(--font-heading)] leading-[0.92]">
              <span className="text-[var(--color-text-on-primary)]">
                Find Your
              </span>
              <br />
              <span className="text-[var(--color-text-on-primary)]">
                Perfect{" "}
              </span>
              <span className="text-[var(--color-accent)]">Tutor</span>
              <span className="text-[var(--color-accent)]">.</span>
            </h1>

            <p className="mt-6 sm:mt-8 max-w-xl text-base sm:text-lg lg:text-xl text-[var(--color-surface)]/80 leading-relaxed">
              Expert instructors, flexible scheduling, live sessions.
              Browse courses, pick a time, and start learning.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-[var(--color-text-on-accent)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] shadow-[0_8px_30px_-4px_rgba(212,146,10,0.5)] hover:shadow-[0_12px_40px_-4px_rgba(212,146,10,0.6)] transition-[background-color,box-shadow] duration-200"
              >
                Browse Tutors
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-semibold text-[var(--color-accent)] border border-[var(--color-accent)]/40 hover:bg-[var(--color-accent)]/10 transition-colors"
              >
                How it Works
              </Link>
            </div>
          </div>

          {/* Trust bar — positioned to the right on desktop */}
          <div className="mt-16 sm:mt-20 flex flex-wrap gap-8 sm:gap-12">
            {[
              { value: '1,200+', label: 'Students' },
              { value: '500+', label: 'Tutors' },
              { value: '4.9', label: 'Avg Rating' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl sm:text-3xl font-bold text-[var(--color-accent)] font-[family-name:var(--font-heading)] tabular-nums">
                  {stat.value}
                </p>
                <p className="text-sm text-[var(--color-surface)]/60 mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <ArchDivider
          className="absolute bottom-0 start-0 end-0"
          fill="var(--color-surface)"
        />
      </section>

      {/* ─── FEATURES / WHY MIHRABY — bento-style ─── */}
      <section
        id="how-it-works"
        className="bg-[var(--color-surface)] py-20 sm:py-28"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header — left-aligned for editorial feel */}
          <div className="max-w-xl mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-accent)] mb-3">
              Why Mihraby
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text)] font-[family-name:var(--font-heading)] leading-tight">
              Learning,<br />Reimagined<span className="text-[var(--color-accent)]">.</span>
            </h2>
          </div>

          <StarDivider className="max-w-xs mb-14" />

          {/* Asymmetric bento grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Feature 1 — spans 2 cols, featured */}
            <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(29,64,64,0.35)]">
              <GeometricPattern className="absolute inset-0 w-full h-full" opacity={0.04} />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)]/15 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L1 9l11 6 9-4.91V17M5 13.18v4.26a2 2 0 001.05 1.76L12 22l5.95-2.8A2 2 0 0019 17.44v-4.26" />
                  </svg>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-on-primary)] font-[family-name:var(--font-heading)] leading-tight">
                  Expert Tutors
                </h3>
                <p className="mt-3 text-[var(--color-surface)]/70 leading-relaxed max-w-lg">
                  Learn from carefully vetted instructors who are passionate about
                  their subjects and dedicated to your success. Every tutor goes
                  through our quality review process.
                </p>
              </div>
            </div>

            {/* Feature 2 — single col */}
            <div className="rounded-2xl bg-[var(--color-bg-white)] border border-[var(--color-border-light)] border-s-4 border-s-[var(--color-accent)] p-8 shadow-[0_4px_24px_-4px_rgba(29,64,64,0.08)] hover:shadow-[0_8px_32px_-4px_rgba(29,64,64,0.12)] transition-shadow duration-200">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-surface)] flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text)] font-[family-name:var(--font-heading)]">
                Flexible Scheduling
              </h3>
              <p className="mt-2 text-[var(--color-text-secondary)] leading-relaxed">
                Book sessions that fit your life. Browse available time slots
                and pick the ones that work for you.
              </p>
            </div>

            {/* Feature 3 — single col */}
            <div className="rounded-2xl bg-[var(--color-bg-white)] border border-[var(--color-border-light)] border-s-4 border-s-[var(--color-accent)] p-8 shadow-[0_4px_24px_-4px_rgba(29,64,64,0.08)] hover:shadow-[0_8px_32px_-4px_rgba(29,64,64,0.12)] transition-shadow duration-200">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-surface)] flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text)] font-[family-name:var(--font-heading)]">
                Secure Payments
              </h3>
              <p className="mt-2 text-[var(--color-text-secondary)] leading-relaxed">
                Pay with confidence via Paymob, Vodafone Cash, Fawry, or
                InstaPay. Your transactions are always protected.
              </p>
            </div>

            {/* Feature 4 — spans 2 cols */}
            <div className="lg:col-span-2 rounded-2xl bg-[var(--color-bg-white)] border border-[var(--color-border-light)] p-8 sm:p-10 shadow-[0_4px_24px_-4px_rgba(29,64,64,0.08)] hover:shadow-[0_8px_32px_-4px_rgba(29,64,64,0.12)] transition-shadow duration-200">
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] font-[family-name:var(--font-heading)]">
                    Live One-on-One Sessions
                  </h3>
                  <p className="mt-2 text-[var(--color-text-secondary)] leading-relaxed max-w-lg">
                    Every session is a private Zoom meeting between you and your tutor.
                    Get personalized attention, ask questions freely, and learn at your pace.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="relative bg-[var(--color-bg)] py-24 sm:py-32 overflow-hidden">
        <CornerOrnament className="absolute bottom-0 start-0 w-40 h-40 rotate-90 opacity-[0.06]" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-accent)] mb-4">
            Start Today
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text)] font-[family-name:var(--font-heading)] leading-tight">
            Ready to Start<br />Learning<span className="text-[var(--color-accent)]">?</span>
          </h2>
          <p className="mt-5 text-lg text-[var(--color-text-secondary)] max-w-md mx-auto">
            Join thousands of students finding the right tutors across Egypt.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-[var(--color-text-on-accent)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] shadow-[0_8px_30px_-4px_rgba(212,146,10,0.5)] hover:shadow-[0_12px_40px_-4px_rgba(212,146,10,0.6)] transition-[background-color,box-shadow] duration-200"
            >
              Get Started
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors py-2"
            >
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[var(--color-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center gap-6">
            <Link
              href="/"
              className="text-2xl font-bold text-[var(--color-accent)] font-[family-name:var(--font-heading)] tracking-wide"
            >
              Mihraby
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/courses"
                className="text-sm text-[var(--color-text-on-primary)]/70 hover:text-[var(--color-text-on-primary)] transition-colors"
              >
                Browse Tutors
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm text-[var(--color-text-on-primary)]/70 hover:text-[var(--color-text-on-primary)] transition-colors"
              >
                How it Works
              </Link>
              <Link
                href="/login"
                className="text-sm text-[var(--color-text-on-primary)]/70 hover:text-[var(--color-text-on-primary)] transition-colors"
              >
                Log In
              </Link>
            </div>

            <p className="text-xs text-[var(--color-text-muted)]">
              &copy; {new Date().getFullYear()} Mihraby. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
