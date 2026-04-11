import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function og() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 56,
          color: '#0f172a',
          background: 'linear-gradient(135deg, #eef2ff, #e0f2fe)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          gap: '16px',
        }}
      >
        <div
          style={{
            fontSize: 24,
            color: '#2563eb',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          Mihraby
        </div>
        <div style={{ fontWeight: 700 }}>Learn live. One session at a time.</div>
        <div style={{ fontSize: 28, color: '#1f2937', maxWidth: 700, lineHeight: 1.3 }}>
          Book one-on-one sessions with expert tutors in Egypt.
        </div>
      </div>
    ),
    size
  );
}
