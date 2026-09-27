import test from 'node:test'
import assert from 'node:assert/strict'
import { PREVIEW_PLANS, PREVIEW_ADDONS, calculateQuote, quoteContactUrl } from './pricing.js'
test('monthly plan plus storage uses selected quantities',()=>{const q=calculateQuote(PREVIEW_PLANS[1],'monthly',PREVIEW_ADDONS,{storage_5:2,storage_20:1});assert.equal(q.total,146000);assert.equal(q.extra,97000)})
test('annual plan discount does not discount add-ons',()=>{const q=calculateQuote(PREVIEW_PLANS[1],'yearly',PREVIEW_ADDONS,{storage_5:1});assert.equal(q.base,490000);assert.equal(q.extra,228000);assert.equal(q.total,718000)})
test('hidden and unknown add-ons cannot affect totals',()=>{const q=calculateQuote(PREVIEW_PLANS[1],'monthly',[],{storage_5:9,unknown:100});assert.equal(q.total,49000)})
test('quantity is bounded and negative quantities excluded',()=>{assert.equal(calculateQuote(PREVIEW_PLANS[1],'monthly',PREVIEW_ADDONS,{storage_5:-2}).total,49000);assert.equal(calculateQuote(PREVIEW_PLANS[1],'monthly',PREVIEW_ADDONS,{storage_5:100}).total,239000)})
test('missing price never appears as free',()=>{assert.equal(calculateQuote({harga_bulanan:null},'monthly',[],{}),null);assert.equal(calculateQuote({harga_bulanan:0},'monthly',[],{}).total,0)})
test('quote request includes amount period and chosen add-on',()=>{const q=calculateQuote(PREVIEW_PLANS[1],'yearly',PREVIEW_ADDONS,{storage_5:1});const u=new URL(quoteContactUrl(PREVIEW_PLANS[1],'yearly',q));assert.equal(u.hostname,'wa.me');assert.equal(u.pathname,'/6285111037992');assert.match(u.searchParams.get('text'),/718.000/);assert.match(u.searchParams.get('text'),/12 bulan/);assert.match(u.searchParams.get('text'),/Penyimpanan 5 GB x1/)})
