/**
 * Decorative components for Mihraby's Islamic-inspired design.
 *
 * GeometricPattern — Hero Patterns "Moroccan" tileable SVG (Steve Schoger, MIT).
 * GeometricRosette — Authentic Islamic geometric art from Wikimedia Commons (CC-BY-SA, Moelja).
 * ArchDivider, CornerOrnament, StarDivider — lightweight inline SVGs.
 */

/**
 * Moroccan tileable background pattern from Hero Patterns.
 * Uses an inline data-URI SVG so there's zero network cost.
 * @see https://heropatterns.com — "Moroccan" pattern by Steve Schoger
 */
export function GeometricPattern({ className = '', opacity = 0.08 }: { className?: string; opacity?: number }) {
  // Moroccan pattern from heropatterns.com — 80×88 tile, fill applied via color param
  const encodedSvg = `url("data:image/svg+xml,%3Csvg width='80' height='88' viewBox='0 0 80 88' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M22 21.91V26h-2c-9.94 0-18 8.06-18 18s8.06 18 18 18h2v4.09c8.01.72 14.79 5.74 18 12.73 3.21-6.99 9.98-12.01 18-12.73V62h2c9.94 0 18-8.06 18-18s-8.06-18-18-18h-2v-4.09c-8.01-.72-14.79-5.74-18-12.73-3.21 6.99-9.98 12.01-18 12.73zM54 58v4.7c-5.57 1.32-10.45 4.43-14 8.69-3.55-4.26-8.43-7.37-14-8.69V58h-6C12.27 58 6 51.73 6 44s6.27-14 14-14h6v-4.7c5.57-1.32 10.45-4.43 14-8.69 3.55 4.26 8.43 7.37 14 8.69V30h6c7.73 0 14 6.27 14 14s-6.27 14-14 14h-6zM42 88c0-9.94 8.06-18 18-18h2v-4.09c8.02-.72 14.79-5.74 18-12.73v7.43c-3.55 4.26-8.43 7.37-14 8.69V74h-6c-7.73 0-14 6.27-14 14h-4zm-4 0c0-9.94-8.06-18-18-18h-2v-4.09c-8.01-.72-14.79-5.74-18-12.73v7.43c3.55 4.26 8.43 7.37 14 8.69V74h6c7.73 0 14 6.27 14 14h-4zm4-88c0 9.94 8.06 18 18 18h2v4.09c8.01.72 14.79 5.74 18 12.73v-7.43c-3.55-4.26-8.43-7.37-14-8.69V14h-6C52.27 14 46 7.73 46 0h-4zM0 34.82c3.21-6.99 9.98-12.01 18-12.73V18h2c9.94 0 18-8.06 18-18h-4c0 7.73-6.27 14-14 14h-6v4.7c-5.57 1.32-10.45 4.43-14 8.69v7.43z' fill='%23D4920A' fill-opacity='${opacity}' fill-rule='evenodd'/%3E%3C/svg%3E")`;

  return (
    <div
      className={`pointer-events-none ${className}`}
      style={{ backgroundImage: encodedSvg, backgroundRepeat: 'repeat' }}
      aria-hidden="true"
    />
  );
}

/**
 * Decorative Mihrab (Islamic arch) frame — gold pointed-arch border
 * used as a centered branding frame on the auth panel.
 */
export function MihrabFrame({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none ${className}`}
      viewBox="0 0 220 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer arch */}
      <path
        d="M30,280 L30,140 C30,140 30,60 110,20 C190,60 190,140 190,140 L190,280"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        opacity="0.5"
      />
      {/* Inner arch */}
      <path
        d="M45,280 L45,145 C45,145 45,75 110,40 C175,75 175,145 175,145 L175,280"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.2"
        opacity="0.3"
      />
      {/* Decorative dots along the outer arch */}
      <g fill="var(--color-accent)" opacity="0.35">
        <circle cx="30" cy="200" r="2" />
        <circle cx="32" cy="170" r="2" />
        <circle cx="38" cy="140" r="2" />
        <circle cx="50" cy="112" r="2" />
        <circle cx="68" cy="85" r="2" />
        <circle cx="88" cy="62" r="2" />
        <circle cx="110" cy="50" r="2" />
        <circle cx="132" cy="62" r="2" />
        <circle cx="152" cy="85" r="2" />
        <circle cx="170" cy="112" r="2" />
        <circle cx="182" cy="140" r="2" />
        <circle cx="188" cy="170" r="2" />
        <circle cx="190" cy="200" r="2" />
      </g>
      {/* Keystone diamond at top */}
      <polygon
        points="110,14 115,20 110,26 105,20"
        fill="var(--color-accent)"
        opacity="0.5"
      />
      {/* Corner squares at base */}
      <rect x="26" y="276" width="8" height="4" fill="var(--color-accent)" opacity="0.3" />
      <rect x="186" y="276" width="8" height="4" fill="var(--color-accent)" opacity="0.3" />
    </svg>
  );
}

/**
 * 4-pointed star ornament — used as a secondary decorative element.
 */
export function FourPointStar({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none ${className}`}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M50,5 L58,42 L95,50 L58,58 L50,95 L42,58 L5,50 L42,42 Z"
        fill="var(--color-accent)"
        opacity="0.8"
      />
    </svg>
  );
}

/**
 * Islamic pointed arch (ogee) section divider.
 */
export function ArchDivider({ className = '', fill = 'var(--color-bg)' }: { className?: string; fill?: string }) {
  return (
    <div className={`w-full overflow-hidden leading-[0] ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-[50px] sm:h-[80px]"
      >
        {/* Pointed Islamic arch (lancet arch profile) */}
        <path
          d="M0,80 L0,0 L440,0
             C480,0 520,5 550,15
             C575,25 590,45 600,55
             C610,45 625,25 650,15
             C680,5 720,0 760,0
             L1200,0 L1200,80 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}

/**
 * Decorative corner arabesque bracket with curved vine-scroll lines
 * and bead-and-reel dot motif.
 */
export function CornerOrnament({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none ${className}`}
      viewBox="0 0 150 150"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Arabesque curves */}
        <g stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.45">
          <path d="M150,0 C148,30 140,55 120,72 C100,89 75,95 50,100 C30,104 15,115 0,150" />
          <path d="M150,18 C145,42 135,60 118,75 C100,90 78,97 55,102 C35,106 22,120 12,150" />
          <path d="M150,36 C142,55 130,68 115,78 C98,89 80,95 62,100 C45,104 33,118 25,150" />
        </g>

        {/* Vine-scroll detail */}
        <g stroke="var(--color-accent)" strokeWidth="0.8" opacity="0.3">
          <path d="M140,8 C135,15 128,20 120,22 C128,28 132,35 130,42" />
          <path d="M125,40 C118,38 112,42 110,48 C115,52 122,50 125,44" />
          <path d="M95,65 C88,62 82,66 80,72 C85,76 92,74 95,68" />
          <path d="M65,88 C58,85 52,89 50,95 C55,99 62,97 65,91" />
        </g>

        {/* Diamonds at curve intersections */}
        <g fill="var(--color-accent)" opacity="0.25">
          <polygon points="118,38 122,44 118,50 114,44" />
          <polygon points="88,62 92,67 88,72 84,67" />
          <polygon points="58,86 62,91 58,96 54,91" />
          <polygon points="38,108 42,113 38,118 34,113" />
        </g>

        {/* Bead-and-reel dots */}
        <g fill="var(--color-accent)" opacity="0.2">
          <circle cx="145" cy="8" r="2" />
          <circle cx="138" cy="25" r="1.5" />
          <circle cx="130" cy="50" r="2" />
          <circle cx="110" cy="72" r="1.5" />
          <circle cx="80" cy="90" r="2" />
          <circle cx="50" cy="105" r="1.5" />
          <circle cx="25" cy="125" r="2" />
          <circle cx="10" cy="142" r="1.5" />
        </g>
      </g>
    </svg>
  );
}

/**
 * Gold Rub el Hizb (۞) divider — two overlapping squares forming an 8-pointed star.
 */
export function StarDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-[var(--color-accent)]/20" />
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-[var(--color-accent)]" fill="currentColor">
        <rect x="5.5" y="5.5" width="13" height="13" transform="rotate(0 12 12)" opacity="0.7" />
        <rect x="5.5" y="5.5" width="13" height="13" transform="rotate(45 12 12)" opacity="0.7" />
      </svg>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[var(--color-accent)]/30 to-[var(--color-accent)]/20" />
    </div>
  );
}
