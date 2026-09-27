import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import PricingSelector from './PricingSelector'
import { canShowTrialOffer } from '../lib/trialOffer'
import Sheet from './Sheet'
import Icon from './Icon'

// Fallback names come from the existing tenant plan schema; no prices or
// entitlements are promised until the admin confirms the current catalog.
const seen = new Map()
function storedTime(key) { try { return localStorage.getItem(key) || seen.get(key) } catch { return seen.get(key) } }
function remember(key) { const now=Date.now(); seen.set(key,now); try { localStorage.setItem(key,String(now)) } catch { /* Session memory still prevents repeated prompts. */ } }

export default function TrialOffer() {
  const {user} = useAuth()
  const {tenant,tenantId,isAdmin} = useTenantContext()
  const [open,setOpen] = useState(false)
  const trial = tenant?.subscription_status === 'trial'
  const eligible = isAdmin
  const storageKey = 'planner-offer-v1:' + user?.id + ':' + tenantId

  useEffect(() => { setOpen(false) }, [tenantId])
  useEffect(() => {
    if (!eligible || !canShowTrialOffer(tenant,isAdmin,storedTime(storageKey))) return
    let timer
    function offerWhenIdle() {
      if (document.hidden || document.querySelector('[role="dialog"]') || ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) {
        timer=setTimeout(offerWhenIdle,5000); return
      }
      if (!canShowTrialOffer(tenant,isAdmin,storedTime(storageKey))) return
      remember(storageKey); setOpen(true)
    }
    timer=setTimeout(offerWhenIdle,12000)
    return () => clearTimeout(timer)
  }, [tenantId,tenant?.subscription_status,isAdmin,eligible,storageKey])

  if (!eligible) return null
  function show() { remember(storageKey);setOpen(true) }
  return <>
    <aside className="trial-nudge">
      <span className="trial-nudge-icon"><Icon name="sparkles-outline" size={21}/></span>
      <div><strong>{trial ? 'Pilih paket untuk kebutuhan tim Anda' : 'Kelola paket dan kapasitas workspace'}</strong><p>Temukan paket yang sesuai dengan kebutuhan Anda.</p></div>
      <button type="button" className="btn trial-open" onClick={show}>Lihat paket <Icon name="arrow-forward-outline" size={15}/></button>
    </aside>
    <Sheet open={open} onClose={()=>setOpen(false)} title="Paket dan kapasitas workspace" description="Pilih paket, periode berlangganan, dan tambahan penyimpanan yang diperlukan." lebar={1000}>
      {open && <PricingSelector compact/>}
    </Sheet>
  </>
}
