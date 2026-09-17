import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

// Angka count-up dari 0 ke target saat kartu pertama kali muncul di layar —
// efek kecil yang bikin dashboard kerasa hidup tanpa perlu library animasi.
const STEPS = 24
const STEP_MS = 25

export default function StatCard({ icon, value, suffix = '', label, gradient }) {
  const [display, setDisplay] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const isDecimal = value % 1 !== 0
    let i = 0
    const timer = setInterval(() => {
      i += 1
      let current = value * (i / STEPS)
      if (i >= STEPS) {
        current = value
        clearInterval(timer)
      }
      setDisplay(isDecimal ? Number(current.toFixed(1)) : Math.round(current))
    }, STEP_MS)
    return () => clearInterval(timer)
  }, [value])

  return (
    <div className="stat-card" style={{ background: gradient }}>
      <Icon name={icon} size={16} style={{ opacity: 0.85 }} />
      <p style={{ fontSize: 22, fontWeight: 500, margin: '8px 0 2px' }}>{display}{suffix}</p>
      <p style={{ fontSize: 11, opacity: 0.9, margin: 0 }}>{label}</p>
    </div>
  )
}
