import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary tertangkap:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleBackHome = () => {
    window.location.href = '/home'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--surface-0, #f8f6fc)',
            padding: 24,
            fontFamily: 'inherit',
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#ffffff',
              padding: '36px 28px',
              borderRadius: 20,
              boxShadow: '0 20px 45px rgba(89, 53, 213, 0.08)',
              textAlign: 'center',
              border: '1px solid #ebdffc',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: '#f1eaff',
                color: '#5935d5',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
                fontSize: 24,
              }}
            >
              ⚠️
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#28213f' }}>
              Terjadi Kendala Memuat Halaman
            </h2>
            <p style={{ fontSize: 13, color: '#6a5a7a', margin: '0 0 24px', lineHeight: 1.6 }}>
              Aplikasi mendeteksi pembaruan data. Silakan muat ulang halaman atau kembali ke beranda.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: '#5935d5',
                  color: '#ffffff',
                  border: 'none',
                  padding: '11px 20px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Muat Ulang
              </button>
              <button
                type="button"
                onClick={this.handleBackHome}
                style={{
                  background: '#ffffff',
                  color: '#5935d5',
                  border: '1px solid #d9cbef',
                  padding: '11px 20px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
