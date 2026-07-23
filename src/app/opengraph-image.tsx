/**
 * Site-wide Open Graph image, generated at build time. Navy brand card:
 * used by link previews on social, chat apps, and AI assistants for any
 * page that does not define its own og image.
 */
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'VentureThrust: secure data rooms and Deal Watch for investors';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0D1B3E',
          padding: 72,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            color: '#3B72E8',
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 10,
          }}
        >
          VENTURETHRUST
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            color: 'white',
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: 1000,
          }}
        >
          <div style={{ display: 'flex' }}>Share your documents.</div>
          <div style={{ display: 'flex' }}>Know exactly who read them.</div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#AFC3EA',
            fontSize: 26,
          }}
        >
          <div style={{ display: 'flex' }}>
            Secure data rooms · Deal Watch for investors
          </div>
          <div style={{ display: 'flex' }}>venturethrust.com</div>
        </div>
      </div>
    ),
    size,
  );
}
