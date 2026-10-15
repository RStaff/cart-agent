import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {once} from 'node:events';
import {evaluate} from './evaluate.mjs';
import {createServer} from './server.mjs';
const sample=JSON.parse(await readFile(new URL('./example.assumptions.json',import.meta.url),'utf8'));
const input=()=>structuredClone(sample);
test('minimum applies per clip and unknown eligibility earns zero',()=>{
  const r=evaluate(input());assert.equal(r.scenarios.low.conditionalGrossUsd,1);
  assert.deepEqual(r.reviewQueue,['needs_review']);assert.equal(r.actualReceivedRevenueUsd,null);
});
test('fee and subscription counted once across portfolio',()=>{
  const r=evaluate(input());assert.equal(r.scenarios.base.conditionalGrossUsd,13);
  assert.equal(r.scenarios.base.conditionalAfterFeeUsd,11.7);
  assert.equal(r.scenarios.base.conditionalProfitBeforeTaxAndLaborUsd,-17.3);
});
test('shared budget is not double counted',()=>{
  const x=input();x.campaign.remainingGrossBudgetUsd=6;
  const r=evaluate(x);assert.equal(r.scenarios.base.conditionalGrossUsd,6);
});
test('per clip cap limits gross',()=>{
  const x=input();x.campaign.maximumGrossUsd=5;
  assert.equal(evaluate(x).scenarios.high.conditionalGrossUsd,10);
});
test('ranking includes production time, rather than just views',()=>{
  assert.equal(evaluate(input()).conditionalRankedClipIds[0],'hook_b');
});
test('budget below minimum pays zero',()=>{
  const x=input();x.campaign.remainingGrossBudgetUsd=.99;
  assert.equal(evaluate(x).scenarios.high.conditionalGrossUsd,0);
});
test('invalid numbers, money precision, ranges and duplicate ids rejected',()=>{
  const changes=[x=>x.campaign.feeFraction=2,x=>x.campaign.rateUsdPerThousand='1',
    x=>x.campaign.rateUsdPerThousand=Infinity,x=>x.subscriptionUsd=.001,
    x=>x.clips[0].workMinutes=0,x=>x.clips[0].payableViews.low=99999,
    x=>x.clips[0].payableViews.base=1.1,x=>x.clips[1].id=x.clips[0].id,
    x=>x.clips[0].eligibility='approved',x=>x.mode='actual',
    x=>x.campaign.maximumGrossUsd=0];
  for(const change of changes){const x=input();change(x);assert.throws(()=>evaluate(x));}
});
test('empty and excessive clip arrays rejected',()=>{
  const x=input();x.clips=[];assert.throws(()=>evaluate(x));
  x.clips=Array(101).fill(sample.clips[0]);assert.throws(()=>evaluate(x));
});
test('server returns a read-only scenario contract and rejects writes',async()=>{
  const s=createServer(async()=>input());s.listen(0,'127.0.0.1');await once(s,'listening');
  const url=`http://127.0.0.1:${s.address().port}`;
  try {
    const r=await fetch(url+'/v1/evaluation');assert.equal(r.status,200);
    assert.equal((await r.json()).mode,'assumptions_only');
    assert.equal((await fetch(url+'/v1/evaluation',{method:'POST'})).status,405);
    assert.equal((await fetch(url+'/missing')).status,404);
    assert.equal((await fetch(url+'/health')).status,200);
  } finally {await new Promise(resolve=>s.close(resolve));}
});
test('bad input reports unavailable, never fabricated success',async()=>{
  const s=createServer(async()=>{throw new Error('private path');});s.listen(0,'127.0.0.1');await once(s,'listening');
  try {const r=await fetch(`http://127.0.0.1:${s.address().port}/v1/evaluation`);
    assert.equal(r.status,503);assert.deepEqual(await r.json(),{error:'evaluation_unavailable',actualReceivedRevenueUsd:null});
  } finally {await new Promise(resolve=>s.close(resolve));}
});
