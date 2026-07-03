import { ImageResponse } from 'next/og';

export const alt = 'Healthy Dog Recipe Builder';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#ffffff',
          color: '#000000',
        }}
      >
        <div style={{ fontSize: 34, color: '#71717a', letterSpacing: 2 }}>
          HEALTHY DOG
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.05, marginTop: 8 }}>
          Recipe Builder
        </div>
        <div style={{ fontSize: 34, color: '#52525b', marginTop: 28 }}>
          Balanced meals, portions &amp; shopping lists for your dogs.
        </div>
      </div>
    ),
    { ...size },
  );
}
