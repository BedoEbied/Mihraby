import Link from 'next/link';

export const metadata = {
  title: 'Unauthorized | Mihraby',
  description: 'You do not have permission to access this page.',
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="max-w-md w-full bg-[var(--color-bg-white)] shadow-[var(--shadow-lg)] rounded-xl p-8 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-[var(--color-text)] font-[family-name:var(--font-heading)]">Access denied</h1>
        <p className="text-[var(--color-text-secondary)]">
          You don&apos;t have permission to view this page. Please switch accounts or return to the
          homepage.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-text-on-accent)] rounded-lg hover:bg-[var(--color-accent-light)] text-sm font-medium transition-colors"
          >
            Go to homepage
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] text-sm font-medium transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
