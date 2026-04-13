import type { ReactNode } from 'react';
import Image from 'next/image';

export const metadata = {
  title: 'Auth | Mihraby',
  description: 'Access your Mihraby account.',
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden md:flex md:w-[45%] relative overflow-hidden bg-[#1D4040]">
        {/* Cover image — contained so the full design is visible */}
        <Image
          src="/images/auth-cover.png"
          alt="Mihraby — Your Learning Sanctuary"
          fill
          className="object-contain"
          priority
          quality={90}
          sizes="45vw"
        />
      </div>

      {/* Right content panel */}
      <div className="flex-1 flex items-center justify-center bg-[var(--color-bg)] px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
