import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, addPlayer, startGame, act, viewFor, botAction } from '../engine.js';
function table(roles = ['hank', 'benny', 'wendy']) {
 const g = createGame('p0', 'P0'); roles.slice(1).forEach((_, i) => addPlayer(g, `p${i + 1}`, `P${i + 1}`)); roles.forEach((character, i) => act(g, `p${i}`, { type: 'choose-character', character })); startGame(g, 'p0'); g.phase = 'inspect';
 g.players.forEach((p, i) => { p.coins = 50; if (i) p.bag = { cards: ['bread', 'meth'], count: 2, declaration: 'bread', bribe: 0, resolved: false }; }); return g;
}
function request(g, target = 'p1', amount = 7) { act(g, 'p0', { type: 'request-bribe', target, amount }); return g.players.find(p => p.id === target).bag.deaRequest.id; }

test('DEA requests are independent per player and acceptance atomically pays and passes all goods privately', () => {
 const g = table(); const a = request(g), b = request(g, 'p2', 4); assert.notEqual(a, b);
 assert.equal(viewFor(g, 'p1').players[1].bag.deaRequest.amount, 7);
 act(g, 'p1', { type: 'accept-request', request: a }); assert.equal(g.players[1].coins, 43); assert.equal(g.players[0].coins, 57); assert.deepEqual(g.players[1].stall, ['bread', 'meth']); assert.equal(g.players[1].bag.resolved, true); assert.equal(g.results[0].cards, null); assert.equal(g.players[1].bag.deaRequest, null); assert.equal(g.players[2].bag.deaRequest.id, b);
 assert.throws(() => act(g, 'p1', { type: 'accept-request', request: a }));
});
test('declining or withdrawing a request leaves ordinary offers and goods unchanged', () => {
 const g = table(); act(g, 'p1', { type: 'bribe', amount: 2 }); const a = request(g); act(g, 'p1', { type: 'decline-request', request: a }); assert.equal(g.players[1].bag.bribe, 2); assert.equal(g.players[1].coins, 50); assert.equal(g.players[1].bag.resolved, false);
 const b = request(g); act(g, 'p0', { type: 'request-bribe', target: 'p1', amount: null }); assert.throws(() => act(g, 'p1', { type: 'accept-request', request: b })); assert.equal(g.players[1].coins, 50);
});
test('every request update invalidates old acceptances even if the amount later matches again', () => {
 const g = table(), a = request(g); request(g, 'p1', 8); const c = request(g, 'p1', 7); assert.notEqual(a, c); const before = structuredClone(g);
 assert.throws(() => act(g, 'p1', { type: 'accept-request', request: a })); assert.deepEqual(g, before); act(g, 'p1', { type: 'accept-request', request: c }); assert.equal(g.players[1].coins, 43);
});
test('only the DEA can request and only the addressed owner can accept or decline', () => {
 const g = table(); assert.throws(() => act(g, 'p1', { type: 'request-bribe', target: 'p2', amount: 5 })); assert.throws(() => act(g, 'p0', { type: 'request-bribe', target: 'p0', amount: 5 }));
 const a = request(g); assert.throws(() => act(g, 'p2', { type: 'accept-request', request: a })); assert.throws(() => act(g, 'p0', { type: 'accept-request', request: a })); assert.throws(() => act(g, 'p2', { type: 'decline-request', request: a }));
});
test('invalid prices and insufficient funds cause no mutation or partial payment', () => {
 const g = table(); for (const amount of [-1, 1.5, Infinity, '5', Number.MAX_SAFE_INTEGER + 1]) { const before = structuredClone(g); assert.throws(() => request(g, 'p1', amount)); assert.deepEqual(g, before); }
 const id = request(g, 'p1', 100); const before = structuredClone(g); assert.throws(() => act(g, 'p1', { type: 'accept-request', request: id })); assert.deepEqual(g, before);
});
test('zero request permits free automatic passage without paid-bribe side effects', () => {
 const g = table(['hank', 'benny', 'piper']); const id = request(g, 'p1', 0); act(g, 'p1', { type: 'accept-request', request: id }); assert.equal(g.players[1].coins, 50); assert.equal(g.players[1].bag.resolved, true); assert.deepEqual(g.piperOffers, []);
});
test('opening clears requests and stale acceptance cannot undo revealed cards or fines', () => {
 const g = table(['mike', 'benny', 'wendy']); const id = request(g); act(g, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(g.pendingInspection.stage, 'mike-response'); assert.equal(g.players[1].bag.deaRequest, null); const before = structuredClone(g);
 assert.throws(() => act(g, 'p1', { type: 'accept-request', request: id })); assert.deepEqual(g, before); assert.throws(() => request(g));
});
test('requests do not override a prior fixed ability and acceptance waits for another packet decision', () => {
 const g = table(['hank', 'jimmy', 'dahlia']); const a = request(g), b = request(g, 'p2', 3); act(g, 'p1', { type: 'jimmy' }); assert.equal(g.players[1].bag.deaRequest, null);
 const before = structuredClone(g); assert.throws(() => act(g, 'p1', { type: 'accept-request', request: a })); assert.throws(() => act(g, 'p2', { type: 'accept-request', request: b })); assert.deepEqual(g, before);
});
test('Dahlia can accept a requested price during her cancel/continue choice, revealing removed cards afterward', () => {
 const g = table(['hank', 'dahlia', 'benny']); const id = request(g); act(g, 'p0', { type: 'inspect', target: 'p1' }); act(g, 'p1', { type: 'dahlia-remove', indices: [1] }); act(g, 'p1', { type: 'accept-request', request: id });
 assert.equal(g.pendingInspection, null); assert.equal(g.players[1].coins, 43); assert.deepEqual(g.players[1].stall, ['bread']); assert.deepEqual(g.discard, ['meth']); assert.equal(g.results[0].cards, null);
});
test('L’s reviewed packet may accept the DEA request, keeping sampled and unsampled cards in delivery', () => {
 const g = table(['l', 'benny', 'wendy']); const id = request(g); act(g, 'p0', { type: 'l-peek', target: 'p1' }); act(g, 'p1', { type: 'accept-request', request: id }); assert.equal(g.pendingInspection, null); assert.deepEqual(g.players[1].stall, ['bread', 'meth']); assert.equal(g.players[1].coins, 43);
});
test('accepted DEA requests trigger Selena/Piper and special-card payments through the ordinary bribe path', () => {
 const g = table(['hank', 'nile', 'piper', 'selena']); g.players[1].bag.cards = ['usedNeedle', 'bread']; const id = request(g, 'p1', 5); act(g, 'p1', { type: 'accept-request', request: id });
 assert.equal(g.players[1].coins, 41); assert.equal(g.players[0].coins, 56); assert.equal(g.piperOffers[0].share, 3); assert.equal(g.players[3].coins, 51); assert.deepEqual(g.retired, ['usedNeedle']);
});
test('ordinary request controls have no triggered countdown, survive snapshots, and practice bots respond', () => {
 const g = table(); const id = request(g); act(g, 'p2', { type: 'chat', text: 'negotiating' }); assert.equal(viewFor(g, 'p1').players[1].bag.deaRequest.id, id); assert.equal(g.players[1].bag.deaRequest.expiresAt, undefined);
 g.players[1].bot = true; assert.deepEqual(botAction(g, 'p1'), { type: 'accept-request', request: id }); act(g, 'p1', botAction(g, 'p1')); assert.equal(g.players[1].bag.resolved, true);
});
