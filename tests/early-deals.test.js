import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, addPlayer, startGame, act, viewFor, expireAbilities } from '../engine.js';
function table(roles=['hank','benny','wendy']) {
 const g=createGame('p0','Agent');roles.slice(1).forEach((_,i)=>addPlayer(g,`p${i+1}`,`Player ${i+1}`));roles.forEach((character,i)=>act(g,`p${i}`,{type:'choose-character',character}));startGame(g,'p0');return g;
}
function marketDone(g){for(const p of g.players.slice(1))act(g,p.id,{type:'exchange',indices:[]});act(g,'p0',{type:'skip-surveillance'});assert.equal(g.phase,'pack');}
function loadAndDeclare(g,indices={}){for(const p of g.players.slice(1))act(g,p.id,{type:'pack',indices:indices[p.id]||[0]});for(const p of g.players.slice(1))act(g,p.id,{type:'declare',declaration:'bread',bribe:p.bribeOffer||0});}

test('DEA accepts a market offer before a packet exists, pays once, and guarantees its eventual passage',()=>{
 const g=table();g.players[1].hand=['heroin','meth','bread','fish','wine','weed'];act(g,'p1',{type:'bribe',amount:40});act(g,'p0',{type:'accept-bribe',target:'p1',expectedAmount:40});
 assert.equal(g.players[1].bag,null);assert.equal(g.players[1].coins,10);assert.equal(g.players[0].coins,90);assert.equal(viewFor(g,'p2').players[1].paidPassage.amount,40);
 const before=structuredClone(g);assert.throws(()=>act(g,'p1',{type:'bribe',amount:0}));assert.throws(()=>act(g,'p0',{type:'accept-bribe',target:'p1',expectedAmount:40}));assert.deepEqual(g,before);
 marketDone(g);loadAndDeclare(g,{'p1':[0,1]});assert.equal(g.players[1].bag.resolved,true);assert.deepEqual(g.players[1].stall,['heroin','meth']);assert.equal(g.players[1].coins,10);assert.equal(g.players[0].coins,90);assert.equal(g.results[0].cards,null);assert.equal(g.analytics.bribes.length,1);
 assert.ok(!JSON.stringify(viewFor(g,'p2').publicActions).includes('Heroin'));
});
test('a smuggler accepts a DEA request in market and the request survives exchange, packing, and reconnect snapshots',()=>{
 const g=table();act(g,'p0',{type:'request-bribe',target:'p1',amount:7});const id=g.players[1].deaRequest.id;assert.equal(viewFor(g,'p1').players[1].deaRequest.id,id);
 act(g,'p1',{type:'exchange',indices:[]});assert.equal(g.players[1].deaRequest.id,id);act(g,'p1',{type:'accept-request',request:id});assert.equal(g.players[1].coins,43);assert.equal(g.players[1].deaRequest,null);
 act(g,'p2',{type:'exchange',indices:[]});act(g,'p0',{type:'skip-surveillance'});loadAndDeclare(g);assert.equal(g.players[1].bag.resolved,true);assert.equal(g.players[1].coins,43);
});
test('requests can be accepted after sealing but before declaration, while other early requests can be declined or withdrawn',()=>{
 const g=table();marketDone(g);act(g,'p1',{type:'pack',indices:[0]});act(g,'p0',{type:'request-bribe',target:'p1',amount:6});act(g,'p1',{type:'accept-request',request:g.players[1].deaRequest.id});assert.equal(g.players[1].coins,44);
 act(g,'p0',{type:'request-bribe',target:'p2',amount:4});act(g,'p2',{type:'decline-request',request:g.players[2].deaRequest.id});assert.equal(g.players[2].coins,50);act(g,'p0',{type:'request-bribe',target:'p2',amount:3});act(g,'p0',{type:'request-bribe',target:'p2',amount:null});assert.equal(g.players[2].deaRequest,null);
});
test('early stale requests and unaffordable agreements never take money or mark passage paid',()=>{
 const g=table();act(g,'p0',{type:'request-bribe',target:'p1',amount:5});const old=g.players[1].deaRequest.id;act(g,'p0',{type:'request-bribe',target:'p1',amount:6});const before=structuredClone(g);assert.throws(()=>act(g,'p1',{type:'accept-request',request:old}));assert.deepEqual(g,before);
 act(g,'p0',{type:'request-bribe',target:'p1',amount:100});const snapshot=structuredClone(g);assert.throws(()=>act(g,'p1',{type:'accept-request',request:g.players[1].deaRequest.id}));assert.deepEqual(g,snapshot);
});
test('all prepaid packets resolve after declarations and new rounds clear the old agreements',()=>{
 const g=table();for(const p of g.players.slice(1)){act(g,p.id,{type:'bribe',amount:2});act(g,'p0',{type:'accept-bribe',target:p.id,expectedAmount:2});}marketDone(g);loadAndDeclare(g);assert.equal(g.phase,'results');assert.equal(g.players[0].coins,54);act(g,'p0',{type:'next'});assert.ok(g.players.every(p=>p.paidPassage===null&&p.deaRequest===null));
});
test('autopassage resumes after a triggered ability expires without blocking remaining paid packets',()=>{
 const g=table(['hank','trump','benny','wendy']);g.players[1].hand=['weed','meth','heroin','bread','bread','bread'];for(const id of ['p1','p2'])act(g,'p0',{type:'accept-bribe',target:id,expectedAmount:0});marketDone(g);loadAndDeclare(g,{'p1':[0,1,2]});assert.equal(g.pendingInspection.stage,'trump-response');assert.equal(g.players[2].bag.resolved,false);expireAbilities(g,g.pendingInspection.expiresAt);assert.equal(g.players[2].bag.resolved,true);assert.equal(g.players[1].abilityUsed,false);
});
test('public market log gives exact discard counts/types but never private replacement identities',()=>{
 const g=table();g.players[1].hand=['weed','heroin','bread','fish','meat','wine'];g.deck=['blueSky','burnerPhone'];act(g,'p1',{type:'exchange',indices:[0,1]});const messages=viewFor(g,'p2').publicActions.map(e=>e.text).join('\n');assert.match(messages,/discarded 2 card\(s\): 1× Weed, 1× Heroin/);assert.match(messages,/drew 2 replacement/);assert.ok(!messages.includes('Blue Sky'));assert.ok(!messages.includes('Burner Phone'));assert.equal(viewFor(g,'p2').players[1].hand,null);
});
test('Rick public log reveals discarded cards but keeps his selected discard-pile picks secret',()=>{
 const g=table(['hank','rick','benny']);g.players[1].hand=['bread','fish','wine','bread','bread','bread'];g.discard=['heroin','meth','blueSky'];act(g,'p1',{type:'rick',indices:[0,1,2],discardIndices:[0,1,2],revision:g.revision});const log=viewFor(g,'p2').publicActions.map(e=>e.text).join('\n');assert.match(log,/1× Bread, 1× Fish, 1× Wine/);assert.ok(!log.includes('Heroin'));assert.ok(!log.includes('Blue Sky'));
});
test('public log retains earlier actions beyond the former short history limit and copies safely',()=>{
 const g=table();for(let i=0;i<100;i++)act(g,'p1',{type:'bribe',amount:i%2+1});const view=viewFor(g,'p2');assert.ok(view.publicActions.length>=101);assert.ok(view.publicActions.every(e=>typeof e.at==='number'&&typeof e.round==='number'));view.publicActions[0].text='tampered';assert.notEqual(g.publicActions[0].text,'tampered');
});
test('packet counts and declarations are public; loaded card identities remain secret until an actual reveal',()=>{
 const g=table();g.players[1].hand=['heroin','meth','bread','fish','wine','weed'];marketDone(g);act(g,'p1',{type:'pack',indices:[0,1]});act(g,'p2',{type:'pack',indices:[0]});act(g,'p1',{type:'declare',declaration:'bread',bribe:0});act(g,'p2',{type:'declare',declaration:'bread',bribe:0});let log=viewFor(g,'p2').publicActions.map(e=>e.text).join('\n');assert.match(log,/sealed an envelope with 2/);assert.match(log,/declared 2 Bread/);assert.ok(!log.includes('Heroin'));act(g,'p0',{type:'inspect',target:'p1'});log=viewFor(g,'p2').publicActions.map(e=>e.text).join('\n');assert.match(log,/revealed 2 card\(s\): 1× Heroin, 1× Meth/);
});
