import test from 'node:test'
import assert from 'node:assert/strict'
import {canShowTrialOffer, OFFER_COOLDOWN, adminContactUrl} from './trialOffer.js'
const now=1_800_000_000_000
test('trial admin sees offer, including a paid-tier trial',()=>{assert.equal(canShowTrialOffer({subscription_status:'trial',subscription_plan:'pro'},true,null,now),true)})
test('paid active, free active, staff and unknown tenants never auto-open',()=>{for(const t of [null,{subscription_status:'active',subscription_plan:'pro'},{subscription_status:'active',subscription_plan:'free'}])assert.equal(canShowTrialOffer(t,true,null,now),false);assert.equal(canShowTrialOffer({subscription_status:'trial'},false,null,now),false)})
test('dismissal persists seven days and tolerates invalid stored values',()=>{const t={subscription_status:'trial'};assert.equal(canShowTrialOffer(t,true,now-1000,now),false);assert.equal(canShowTrialOffer(t,true,now-OFFER_COOLDOWN,now),true);assert.equal(canShowTrialOffer(t,true,'invalid',now),true)})
test('CTA uses approved admin and encodes chosen plan without user data',()=>{const u=new URL(adminContactUrl('Team & Pro'));assert.equal(u.hostname,'wa.me');assert.equal(u.pathname,'/6285111037992');assert.match(u.searchParams.get('text'),/Team & Pro/);assert.equal(u.searchParams.size,1)})
