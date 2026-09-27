import test from 'node:test'
import assert from 'node:assert/strict'
import { priceLabel, validatePlan, safeWebUrl } from './adminCatalog.js'
const plan={nama:'Pro',harga_bulanan:'',harga_tahunan:'',storageMb:100,batas_anggota:2,metode_pembelian:'whatsapp'}
test('unset price differs from zero and supports IDR',()=>{assert.equal(priceLabel(null),'Harga belum diumumkan');assert.match(priceLabel(0),/Rp.*0/);assert.match(priceLabel(150000),/150\.000/)})
test('negative and fractional prices rejected',()=>{assert.ok(validatePlan({...plan,harga_bulanan:-1}));assert.ok(validatePlan({...plan,harga_tahunan:1.5}));assert.equal(validatePlan({...plan,harga_bulanan:0}),'')})
test('checkout requires HTTPS',()=>{assert.ok(validatePlan({...plan,metode_pembelian:'checkout',checkout_url:'javascript:alert(1)'}));assert.equal(validatePlan({...plan,metode_pembelian:'checkout',checkout_url:'https://example.com/pay'}),'')})
test('limits and unsafe campaign links rejected',()=>{assert.ok(validatePlan({...plan,batas_anggota:0}));assert.ok(validatePlan({...plan,storageMb:-1}));assert.equal(safeWebUrl('javascript:alert(1)'),undefined);assert.equal(safeWebUrl('https://example.com'),'https://example.com/')})
