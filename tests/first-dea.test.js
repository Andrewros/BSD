import test from 'node:test';
import assert from 'node:assert/strict';
import {act, createGame, addPlayer, removePlayer, viewFor} from '../engine.js';
function table(){const g=createGame('host','Host');addPlayer(g,'a','Alice');addPlayer(g,'b','Bob');g.players.forEach((p,i)=>p.character=['benny','wendy','steve'][i]);return g;}
test('host chooses starting DEA; all views show that choice and start preserves it',()=>{
 const g=table();act(g,'host',{type:'choose-first-dea',target:'b'});
 for(const p of g.players)assert.equal(viewFor(g,p.id).players[viewFor(g,p.id).dea].id,'b');
 act(g,'host',{type:'start'});assert.equal(g.players[g.dea].id,'b');assert.equal(g.phase,'market');assert.match(g.log.at(-1),/Bob is the D.E.A./);
});
test('guests cannot choose first DEA and choice locks at game start',()=>{
 const g=table();assert.throws(()=>act(g,'a',{type:'choose-first-dea',target:'a'}));assert.equal(g.dea,0);
 act(g,'host',{type:'start'});assert.throws(()=>act(g,'host',{type:'choose-first-dea',target:'b'}));assert.equal(g.dea,0);
});
test('invalid targets leave chosen DEA unchanged',()=>{
 const g=table();act(g,'host',{type:'choose-first-dea',target:'a'});assert.throws(()=>act(g,'host',{type:'choose-first-dea',target:'missing'}));assert.equal(g.players[g.dea].id,'a');
});
test('removing a player before selected DEA preserves selected player; removing selected falls back to host',()=>{
 const g=table();act(g,'host',{type:'choose-first-dea',target:'b'});removePlayer(g,'a');assert.equal(g.players[g.dea].id,'b');removePlayer(g,'b');assert.equal(g.players[g.dea].id,'host');
});
test('DEA rotation continues in seat order after chosen starter',()=>{
 const g=table();act(g,'host',{type:'choose-first-dea',target:'b'});act(g,'host',{type:'start'});g.phase='results';act(g,'host',{type:'next'});assert.equal(g.players[g.dea].id,'host');assert.equal(g.round,2);
});
