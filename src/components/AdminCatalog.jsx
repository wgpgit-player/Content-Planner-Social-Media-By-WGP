import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Sheet from './Sheet'
import { priceLabel, validatePlan } from '../lib/adminCatalog'
export default function AdminCatalog({plans,onChange}){
 const [form,setForm]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const field=(key,value)=>setForm(f=>({...f,[key]:value}))
 function edit(p){setError('');setForm({...p,deskripsi:p.deskripsi||'',fitur:(p.fitur||[]).join('\n'),harga_bulanan:p.harga_bulanan??'',harga_tahunan:p.harga_tahunan??'',storageMb:Number(p.batas_penyimpanan)/1048576,checkout_url:p.checkout_url||''})}
 async function save(e){
 e.preventDefault();const problem=validatePlan(form);if(problem){setError(problem);return}
 setBusy(true);setError('')
 try{
 const row={nama:form.nama.trim(),deskripsi:form.deskripsi.trim(),fitur:form.fitur.split('\n').map(x=>x.trim()).filter(Boolean),harga_bulanan:form.harga_bulanan===''?null:Number(form.harga_bulanan),harga_tahunan:form.harga_tahunan===''?null:Number(form.harga_tahunan),batas_anggota:form.batas_anggota==='' || form.batas_anggota==null?null:Number(form.batas_anggota),batas_penyimpanan:Math.round(Number(form.storageMb)*1048576),tampil:form.tampil,metode_pembelian:form.metode_pembelian,checkout_url:form.checkout_url.trim()||null}
 const {data,error:err}=await supabase.from('paket_langganan').update(row).eq('key',form.key).select().single()
 if(err)throw err
 onChange(plans.map(p=>p.key===data.key?data:p));setForm(null)
 }catch(err){setError(err.message)}finally{setBusy(false)}
 }
 return <><p className="admin-intro">Atur harga, manfaat, dan cara pembelian. Harga kosong akan ditampilkan sebagai “Harga belum diumumkan”.</p><div className="admin-plan-grid">{plans.map(p=><article className="admin-plan-card" key={p.key}><span className="admin-pill">{p.tampil?'Ditampilkan':'Disembunyikan'}</span><h2>{p.nama}</h2><strong className="admin-price">{priceLabel(p.harga_bulanan)}</strong><span>/ bulan</span><p>{p.deskripsi||'Tambahkan deskripsi paket Anda.'}</p><ul>{(p.fitur||[]).map((f,i)=><li key={i}>{f}</li>)}</ul><p>{(Number(p.batas_penyimpanan)/1073741824).toLocaleString('id-ID')} GB penyimpanan · {p.batas_anggota??'Tanpa batas'} anggota</p><button className="btn btn-primary" onClick={()=>edit(p)}>Atur paket & harga</button></article>)}</div>{!plans.length && <p className="alert alert-info">Katalog belum tersedia. Muat ulang halaman untuk mencoba kembali.</p>}
 {form && <Sheet title={'Atur paket '+form.nama} lebar={680} onClose={()=>{if(!busy)setForm(null)}}><form onSubmit={save} className="admin-catalog-form">{error && <p className="alert alert-error" role="alert">{error}</p>}
 <label>Nama paket<input required className="input" value={form.nama} onChange={e=>field('nama',e.target.value)}/></label>
 <label>Deskripsi<textarea className="textarea" value={form.deskripsi} onChange={e=>field('deskripsi',e.target.value)}/></label>
 <div className="admin-filters">{[['harga_bulanan','Harga bulanan (Rp)'],['harga_tahunan','Harga tahunan (Rp)']].map(([key,label])=><label key={key}>{label}<input className="input" type="number" min="0" step="1" placeholder="Belum ditentukan" value={form[key]} onChange={e=>field(key,e.target.value)}/></label>)}</div>
 <label>Manfaat paket (satu per baris)<textarea className="textarea" rows={4} value={form.fitur} onChange={e=>field('fitur',e.target.value)}/></label>
 <div className="admin-filters"><label>Batas anggota<input className="input" type="number" min="1" step="1" placeholder="Tanpa batas" value={form.batas_anggota??''} onChange={e=>field('batas_anggota',e.target.value)}/></label><label>Penyimpanan (MB)<input required className="input" type="number" min="1" step="1" value={form.storageMb} onChange={e=>field('storageMb',e.target.value)}/></label></div>
 <label>Metode pembelian<select className="select" value={form.metode_pembelian} onChange={e=>field('metode_pembelian',e.target.value)}><option value="whatsapp">WhatsApp admin</option><option value="checkout">Link checkout</option></select></label>
 {form.metode_pembelian==='checkout' && <label>Link checkout (HTTPS)<input required type="url" className="input" value={form.checkout_url} onChange={e=>field('checkout_url',e.target.value)} placeholder="https://…"/></label>}
 <label className="admin-check"><input type="checkbox" checked={form.tampil} onChange={e=>field('tampil',e.target.checked)}/>Tampilkan paket di pilihan langganan klien</label>
 <div className="sheet-aksi"><button className="btn" type="button" disabled={busy} onClick={()=>setForm(null)}>Batal</button><button className="btn btn-primary" disabled={busy}>{busy?'Menyimpan…':'Simpan paket'}</button></div></form></Sheet>}</>
}

