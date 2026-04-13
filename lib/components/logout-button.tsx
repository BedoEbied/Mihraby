'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    startTransition(() => {
      router.push('/login');
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="text-[var(--color-text-on-primary)]/70 hover:text-[var(--color-text-on-primary)] cursor-pointer disabled:opacity-50 text-sm transition-colors px-2 py-2"
    >
      {isPending ? 'Logging out...' : 'Logout'}
    </button>
  );
}
