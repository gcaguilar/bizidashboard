import { ImageResponse } from 'next/og';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site';

export const runtime = 'edge';
export const alt = SITE_TITLE;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #fff7f7 0%, #ffe4e6 45%, #fee2e2 100%)',
          color: '#111827',
          fontFamily: 'sans-serif',
          padding: '56px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '24px',
            borderRadius: '32px',
            border: '2px solid rgba(234, 6, 21, 0.18)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ea0615',
                color: '#ffffff',
                fontSize: '38px',
                fontWeight: 800,
              }}
            >
              B
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '28px', color: '#b91c1c', fontWeight: 700 }}>Analitica publica de Bizi Zaragoza</div>
              <div style={{ fontSize: '20px', color: '#6b7280' }}>Disponibilidad, alertas, patrones y movilidad urbana</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '860px' }}>
            <div style={{ fontSize: '68px', lineHeight: 1.05, fontWeight: 800 }}>{SITE_TITLE}</div>
            <div style={{ fontSize: '28px', lineHeight: 1.35, color: '#374151' }}>{SITE_DESCRIPTION}</div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            {['Dashboard', 'Flujo', 'Estaciones', 'Conclusiones'].map((item) => (
              <div
                key={item}
                style={{
                  padding: '12px 20px',
                  borderRadius: '999px',
                  background: 'rgba(234, 6, 21, 0.1)',
                  color: '#991b1b',
                  fontSize: '22px',
                  fontWeight: 700,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
