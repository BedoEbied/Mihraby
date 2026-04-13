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
