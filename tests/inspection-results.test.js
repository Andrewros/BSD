import test from 'node:test';
import assert from 'node:assert/strict';
import { act, addPlayer, createGame, startGame, viewFor } from '../engine.js';
function table(roles=['hank','benny','wendy']) {const g=createGame('p0','Agent');roles.slice(1).forEach((_,i)=>addPlayer(g,`p${i+1}`,`Player ${i+1}`));roles.forEach((c,i)=>g.players[i].character=c);startGame(g,'p0');g.phase='inspect';g.players.forEach((p,i)=>{p.coins=50;if(i)p.bag={cards:['bread'],count:1,declaration:'bread',bribe:0,resolved:false}});return g;}
function packet(g,cards){g.players[1].bag={cards,count:cards.length,declaration:'bread',bribe:0,resolved:false};}

test('honest result includes revealed cards, correct payer/payee, exact amount, and declaration matching',()=>{
 const g=table();packet(g,['bread','bread']);act(g,'p0',{type:'inspect',target:'p1'});const result=g.results[0], info=result.inspection;assert.deepEqual(result.cards,['bread','bread']);assert.equal(info.honest,true);assert.equal(info.inspector,'p0');assert.equal(info.merchant,'p1');assert.deepEqual(info.cardMatches,[true,true]);assert.deepEqual(info.payments,[{payer:'p0',payee:'p1',amount:4,settled:4,coins:4,kind:'Honest compensation',bank:false}]);assert.deepEqual(viewFor(g,'p2').results[0].inspection,info);
});
test('caught result identifies mismatching goods and the merchant owing the inspector',()=>{
 const g=table();packet(g,['bread','meth','fish']);act(g,'p0',{type:'inspect',target:'p1'});const info=g.results[0].inspection;assert.equal(info.honest,false);assert.deepEqual(info.cardMatches,[true,false,false]);assert.equal(info.payments[0].payer,'p1');assert.equal(info.payments[0].payee,'p0');assert.equal(info.payments[0].amount,6);assert.equal(g.players[1].coins,44);
});
test('unopened passes have no inspection metadata and never provide hidden card arrays for popups',()=>{
 const g=table();packet(g,['heroin']);act(g,'p0',{type:'pass',target:'p1'});for(const p of g.players){const result=viewFor(g,p.id).results[0];assert.equal(result.cards,null);assert.equal(result.inspection,undefined)}
});
test('bank-funded compensation and doubled fines report actual funding and amounts',()=>{
 const g=table(['selena','heisenberg','benny']);packet(g,['bread','bread']);act(g,'p0',{type:'inspect',target:'p1'});act(g,'p1',{type:'heisenberg-use'});act(g,'p0',{type:'heisenberg-inspect'});act(g,'p0',{type:'selena-bank'});const payment=g.results[0].inspection.payments[0];assert.equal(payment.amount,8);assert.equal(payment.bank,true);assert.equal(payment.payer,'p0');assert.equal(g.players[0].coins,50);assert.equal(g.players[1].coins,58);
});
test('needle and Hector supplemental payments are included in the same inspection receipt',()=>{
 const g=table(['hank','nile','benny']);packet(g,['usedNeedle','meth']);act(g,'p0',{type:'inspect',target:'p1'});const payments=g.results[0].inspection.payments;assert.deepEqual(payments.map(p=>[p.payer,p.payee,p.amount]),[['p0','p1',8],['p1','p0',4]]);
 const h=table(['hank','hector','benny']);h.hectorMarks=[{hector:'p1',agent:'p0',round:1}];act(h,'p0',{type:'inspect',target:'p1'});assert.deepEqual(h.results[0].inspection.payments.map(p=>p.amount),[5,2]);
});
test('insufficient funds distinguish the charge from settled coins and goods',()=>{
 const g=table();g.players[1].coins=1;g.players[1].stall=['bread'];packet(g,['heroin']);act(g,'p0',{type:'inspect',target:'p1'});const payment=g.results[0].inspection.payments[0];assert.equal(payment.amount,4);assert.equal(payment.settled,3);assert.equal(payment.coins,1);
});
test('special inspections can show a zero-fine receipt without inventing ordinary payments',()=>{
 const g=table(['zach','benny','wendy']);act(g,'p0',{type:'zach',target:'p1'});assert.equal(g.results[0].inspection.honest,true);assert.deepEqual(g.results[0].inspection.payments,[]);assert.deepEqual(g.players[0].stall,['bread']);
});
test('Timothy receipt splits the fine, records the bank reward, and never changes totals',()=>{
 const g=table(['hank','benny','timothy']);packet(g,['meth']);act(g,'p2',{type:'timothy',target:'p1'});const payments=g.results[0].inspection.payments;assert.deepEqual(payments.map(p=>[p.payee,p.amount,p.bank]),[['p0',2,false],['p2',2,false],['p2',12,true]]);assert.equal(g.players[0].coins,52);assert.equal(g.players[1].coins,46);assert.equal(g.players[2].coins,64);
});
