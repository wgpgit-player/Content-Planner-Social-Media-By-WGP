import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { priceLabel } from '../lib/adminCatalog'
import { useConfirm } from '../lib/useConfirm'
import Sheet from './Sheet'

function localDate(d){const date=new Date(d);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16)}
export default function AdminAddons({clients=[]}){
 const [addons,setAddons]=useState([]),[active,setActive]=useState([]),[form,setForm]=useState(null),[grant,setGrant]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true)
 const confirm=useConfirm()
 async function load(){
  setLoading(true)
  try{const [a,b]=await Promise.all([supabase.from('addon_langganan').select('*').order('urutan'),supabase.from('tenant_addon').select('*').order('selesai_at',{ascending:false})]);if(a.error||b.error)throw a.error||b.error;setAddons(a.data||[]);setActive(b.data||[])}catch(e){setError(e.message)}finally{setLoading(false)}
 }
 useEffect(()=>{load()},[])
 async function save(e){
  e.preventDefault();setError('')
  if(!form.nama.trim() || !Number.isSafeInteger(Number(form.harga_bulanan)) || Number(form.harga_bulanan)<0){setError('Isi nama dan harga rupiah bulat yang valid.');return}
  setBusy(true)
  try{const {error:err}=await supabase.from('addon_langganan').update({nama:form.nama.trim(),deskripsi:form.deskripsi.trim(),harga_bulanan:Number(form.harga_bulanan),tampil:form.tampil}).eq('key',form.key).select().single();if(err)throw err;setForm(null);await load()}catch(e){setError(e.message)}finally{setBusy(false)}
 }
 async function activate(e){
  e.preventDefault();setError('')
  if(!grant.tenant_id || !grant.addon_key || !grant.mulai_at || !grant.selesai_at || grant.selesai_at<=grant.mulai_at){setError('Pilih klien, add-on, dan masa berlaku yang valid.');return}
  if(!Number.isInteger(Number(grant.quantity)) || Number(grant.quantity)<1 || Number(grant.quantity)>10){setError('Jumlah harus 1–10 unit.');return}
  setBusy(true)
  try{const {error:err}=await supabase.from('tenant_addon').upsert({...grant,quantity:Number(grant.quantity),mulai_at:new Date(grant.mulai_at).toISOString(),selesai_at:new Date(grant.selesai_at).toISOString()},{onConflict:'tenant_id,addon_key'}).select().single();if(err)throw err;setGrant(null);await load()}catch(e){setError(e.message)}finally{setBusy(false)}
 }
 async function revoke(row){
  if(!await confirm.ask({title:'Cabut add-on ini?',description:'Kapasitas tambahan langsung berhenti. File klien tidak dihapus.'}))return
  setBusy(true);setError('')
  try{const {error:err}=await supabase.from('tenant_addon').delete().eq('tenant_id',row.tenant_id).eq('addon_key',row.addon_key);if(err)throw err;await load()}catch(e){setError(e.message)}finally{setBusy(false)}
 }
 function openGrant(row){
  setError('')
  const now=new Date(),end=new Date(now);end.setDate(end.getDate()+30)
  setGrant(row?{...row,mulai_at:localDate(row.mulai_at),selesai_at:localDate(row.selesai_at)}:{tenant_id:'',addon_key:addons[0]?.key||'',quantity:1,mulai_at:localDate(now),selesai_at:localDate(end)})
 }
 return <section className="admin-addons-section"><h2 className="admin-section-title">Add-on penyimpanan</h2><p className="admin-intro">Harga tampil di landing page dan pilihan paket klien. Aktifkan kapasitas tambahan setelah pembayaran diverifikasi.</p>{error && !form && !grant && <p role="alert" className="alert alert-error">{error}</p>}{loading?<p role="status">Memuat add-on…</p>:<div className="admin-plan-grid">{addons.map(a=><article key={a.key} className="admin-plan-card"><span className="admin-pill">{a.tampil?'Ditampilkan':'Disembunyikan'}</span><h3>{a.nama}</h3><strong className="admin-price">{priceLabel(a.harga_bulanan)}<small> / bulan</small></strong><p>{a.deskripsi}</p><button className="btn" onClick={()=>{setError('');setForm(a)}}>Atur {a.nama}</button></article>)}</div>}
 <div className="admin-addon-heading"><h3>Aktivasi per klien</h3><button className="btn btn-primary" disabled={loading||!addons.length||!clients.length} onClick={()=>openGrant()}>Aktifkan add-on</button></div>
 <p className="field-hint">Masa berlaku memakai waktu perangkat Anda. Mengubah aktivasi yang sama menggantikan jumlah dan periodenya.</p>
 <div className="card">{active.length===0?<p className="admin-intro">Belum ada add-on yang diaktifkan untuk klien.</p>:active.map(row=><div className="operator-baris" key={row.tenant_id+row.addon_key}><div><strong>{clients.find(c=>c.tenant_id===row.tenant_id)?.nama||'Workspace'}</strong><p className="admin-intro">{addons.find(a=>a.key===row.addon_key)?.nama} × {row.quantity} · {new Date(row.selesai_at)<=new Date()?'Berakhir':new Date(row.mulai_at)>new Date()?'Terjadwal':'Aktif'}</p><small>Sampai {new Date(row.selesai_at).toLocaleString('id-ID')}</small></div><div className="admin-addon-actions"><button className="btn btn-sm" disabled={busy} onClick={()=>openGrant(row)}>Ubah periode</button><button className="btn btn-sm" disabled={busy} onClick={()=>revoke(row)}>Cabut</button></div></div>)}</div>
 {form && <Sheet title="Atur add-on" onClose={()=>{if(!busy)setForm(null)}} lebar={540}><form className="admin-catalog-form" onSubmit={save}>{error && <p className="alert alert-error" role="alert">{error}</p>}<label>Nama add-on<input className="input" required value={form.nama} onChange={e=>setForm({...form,nama:e.target.value})}/></label><label>Deskripsi<textarea className="textarea" value={form.deskripsi} onChange={e=>setForm({...form,deskripsi:e.target.value})}/></label><label>Harga add-on per bulan (Rp)<input className="input" required type="number" min="0" step="1" value={form.harga_bulanan} onChange={e=>setForm({...form,harga_bulanan:e.target.value})}/></label><label className="admin-check"><input type="checkbox" checked={form.tampil} onChange={e=>setForm({...form,tampil:e.target.checked})}/>Tampilkan di penawaran</label><button className="btn btn-primary" disabled={busy}>{busy?'Menyimpan…':'Simpan add-on'}</button></form></Sheet>}
 {grant && <Sheet title="Aktifkan kapasitas tambahan" description="Pastikan pembayaran sudah diverifikasi sebelum mengaktifkan add-on." onClose={()=>{if(!busy)setGrant(null)}} lebar={560}><form className="admin-catalog-form" onSubmit={activate}>{error && <p role="alert" className="alert alert-error">{error}</p>}<label>Klien<select required className="select" value={grant.tenant_id} onChange={e=>setGrant({...grant,tenant_id:e.target.value})}><option value="">Pilih klien</option>{clients.map(c=><option value={c.tenant_id} key={c.tenant_id}>{c.nama}</option>)}</select></label><label>Add-on<select required className="select" value={grant.addon_key} onChange={e=>setGrant({...grant,addon_key:e.target.value})}>{addons.map(a=><option key={a.key} value={a.key}>{a.nama}</option>)}</select></label><label>Jumlah unit<input required type="number" min="1" max="10" step="1" className="input" value={grant.quantity} onChange={e=>setGrant({...grant,quantity:e.target.value})}/></label><label>Mulai berlaku<input required type="datetime-local" className="input" value={grant.mulai_at} onChange={e=>setGrant({...grant,mulai_at:e.target.value})}/></label><label>Berlaku sampai<input required type="datetime-local" className="input" value={grant.selesai_at} onChange={e=>setGrant({...grant,selesai_at:e.target.value})}/></label><button className="btn btn-primary" disabled={busy}>{busy?'Menyimpan…':'Simpan aktivasi'}</button></form></Sheet>}{confirm.dialog}
 </section>
}

