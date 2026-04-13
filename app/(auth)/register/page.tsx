'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/context/AuthContext';
import { StarDivider } from '@/lib/components/decorative';

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
    <div className="bg-[var(--color-bg-white)] rounded-2xl p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(29,64,64,0.15)] border border-[var(--color-border-light)] max-w-md w-full">
      <div className="text-center mb-8">
        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--color-accent)] mb-2">
          Get started
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-heading)]">
          Create Account<span className="text-[var(--color-accent)]">.</span>
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Join Mihraby today
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg bg-[var(--color-error-light)] p-4 border border-[var(--color-error)]/20">
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] text-sm transition-colors"
              placeholder="Your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] text-sm transition-colors"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] text-sm transition-colors"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] text-sm transition-colors"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-[var(--color-text-on-accent)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)] disabled:opacity-50 shadow-[0_4px_16px_-4px_rgba(212,146,10,0.4)] hover:shadow-[0_8px_24px_-4px_rgba(212,146,10,0.5)] transition-[background-color,box-shadow] duration-200 cursor-pointer"
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/50 rounded transition-colors">
          Sign In
        </Link>
      </p>

      <StarDivider className="mt-6" />
    </div>
  );
}
