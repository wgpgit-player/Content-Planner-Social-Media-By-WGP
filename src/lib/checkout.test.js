import test from 'node:test'
import assert from 'node:assert/strict'
import { checkoutUrl, readAddons, safeNext } from './checkout.js'

test('checkout retains plan period and valid add-on quantities', () => {
  const url = new URL(checkoutUrl('dasar', 'yearly', { storage_5: 2, bad: -1 }), 'https://example.test')
  assert.equal(url.pathname, '/bayar')
  assert.equal(url.searchParams.get('periode'), 'tahunan')
  assert.deepEqual(readAddons(url.searchParams.get('addons')), { storage_5: 2 })
})
test('malformed checkout values are rejected', () => {
  for (const value of ['null', '[]', 'broken']) assert.deepEqual(readAddons(value), {})
  assert.deepEqual(readAddons('{"storage_5":11,"storage_20":1.5}'), {})
})
test('checkout continuation only accepts local paths', () => {
  for (const value of ['https://evil.test','//evil.test','/\\evil.test']) assert.equal(safeNext(value), '/dashboard')
  assert.equal(safeNext('/bayar?paket=pro'), '/bayar?paket=pro')
})
