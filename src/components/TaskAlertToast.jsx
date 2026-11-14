import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

/**
 * Banner Pop-up Notifikasi Tugas & Ringing Admin (In-App)
 * Muncul seketika di layar karyawan saat admin menekan tombol "Senggol/Ring"
 * atau saat ada tugas baru yang di-assign ke dirinya.
 */
export default function TaskAlertToast({ alert, onDismiss }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!alert) return
    // Auto-dismiss setelah 14 detik untuk notifikasi tugas biasa,
    // 25 detik untuk ringing admin agar staf sempat membaca
    const durasi = alert.type === 'ringing' ? 25000 : 14000
    const timer = setTimeout(() => {
      onDismiss?.()
    }, durasi)
    return () => clearTimeout(timer)
  }, [alert, onDismiss])

  if (!alert) return null

  const isRinging = alert.type === 'ringing'

  function handleBuka() {
    if (alert.taskId) {
      navigate(`/worksheet?id=${alert.taskId}`)
    }
    onDismiss?.()
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 99999,
        maxWidth: 420,
        width: 'calc(100vw - 40px)',
        background: isRinging
          ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        borderRadius: 16,
        padding: '16px 18px',
        boxShadow: isRinging
          ? '0 12px 36px rgba(239, 68, 68, 0.35), 0 4px 16px rgba(0, 0, 0, 0.4)'
          : '0 12px 32px rgba(99, 102, 241, 0.25), 0 4px 14px rgba(0, 0, 0, 0.35)',
        border: isRinging ? '1.5px solid #f87171' : '1.5px solid #818cf8',
        animation: 'slideInAlert 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <style>{`
        @keyframes slideInAlert {
          from {
            transform: translateY(-24px) scale(0.96);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes pulseBell {
          0%, 100% { transform: rotate(0deg) scale(1); }
          15% { transform: rotate(18deg) scale(1.15); }
          30% { transform: rotate(-18deg) scale(1.15); }
          45% { transform: rotate(14deg); }
          60% { transform: rotate(-14deg); }
          75% { transform: rotate(0deg); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Icon Notifikasi dengan Efek Goyang (Ringing) */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: isRinging
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: isRinging ? '0 0 16px rgba(239, 68, 68, 0.6)' : '0 0 12px rgba(99, 102, 241, 0.5)',
            animation: isRinging ? 'pulseBell 1.2s infinite ease-in-out' : 'none',
          }}
        >
          <Icon name={isRinging ? 'notifications' : 'clipboard'} size={24} color="#ffffff" />
        </div>

        {/* Konten Notifikasi */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 8px',
                borderRadius: 99,
                background: isRinging ? 'rgba(239, 68, 68, 0.25)' : 'rgba(99, 102, 241, 0.25)',
                color: isRinging ? '#fca5a5' : '#c7d2fe',
                border: isRinging ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)',
              }}
            >
              {isRinging ? '⏰ Peringatan Admin' : '📋 Tugas Baru'}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.6)' }}>Baru saja</span>
          </div>

          <h4
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 4px 0',
              lineHeight: 1.3,
            }}
          >
            {alert.title}
          </h4>

          <p
            style={{
              fontSize: 12.5,
              color: 'rgba(255, 255, 255, 0.85)',
              margin: '0 0 12px 0',
              lineHeight: 1.45,
            }}
          >
            {alert.message}
          </p>

          {/* Tombol Aksi Langsung */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleBuka}
              style={{
                background: '#ffffff',
                color: '#1e1b4b',
                border: 'none',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'opacity 0.15s ease',
              }}
            >
              <Icon name="arrow-forward-outline" size={14} />
              Buka Lembar Kerja
            </button>

            <button
              type="button"
              onClick={onDismiss}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {isRinging ? 'Saya sedang kerjakan' : 'Tutup'}
            </button>
          </div>
        </div>

        {/* Tombol X Kecil */}
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            lineHeight: 1,
          }}
          title="Tutup notifikasi"
        >
          <Icon name="close-outline" size={18} />
        </button>
      </div>
    </div>
  )
}
