'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-6 space-y-3">
      <h2 className="text-lg font-semibold text-[var(--color-error)] font-[family-name:var(--font-heading)]">Something went wrong</h2>
      <p className="text-sm text-[var(--color-text-secondary)]">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)] text-sm font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
