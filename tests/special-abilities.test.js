import test from 'node:test';
import assert from 'node:assert/strict';
import { act, addPlayer, createGame, startGame, viewFor, scores, botAction, expireAbilities, TRIGGER_WINDOW_MS, CATALOG_SIZE, CHARACTERS } from '../engine.js';
function table(roles = ['hank', 'pinkman', 'nile', 'tuco', 'piper']) {
 const g = createGame('p0', 'P0'); roles.slice(1).forEach((_, i) => addPlayer(g, `p${i + 1}`, `P${i + 1}`)); roles.forEach((character, i) => act(g, `p${i}`, { type: 'choose-character', character })); startGame(g, 'p0'); return g;
}
const bag = (cards, declaration = 'bread', bribe = 0) => ({ cards, count: cards.length, declaration, bribe, resolved: false });
function inspect(roles) { const g = table(roles); g.phase = 'inspect'; g.players.forEach((p, i) => { p.coins = 50; if (i) p.bag = bag(['bread']); }); return g; }

test('29 characters: Pinkman replaces sixth card, Nile gets two extras, Piper starts with ten extra', () => {
 const g = table(); assert.equal(Object.keys(CHARACTERS).length, 29); assert.equal(g.players[1].hand.length, 6); assert.equal(g.players[1].hand.filter(c => c === 'chiliPowder').length, 1);
 assert.equal(g.players[2].hand.length, 8); assert.equal(g.players[2].hand.filter(c => c === 'usedNeedle').length, 2); assert.equal(g.players[4].coins, 60); assert.equal(g.cardTotal, CATALOG_SIZE + 3);
 assert.ok(!g.deck.some(c => c === 'chiliPowder' || c === 'usedNeedle')); assert.equal(viewFor(g, 'p0').players[2].hand, null);
});
test('Chili passes repeatedly for ten and returns to hand without becoming a scored stash card', () => {
 const g = inspect(); g.players[1].hand = [];
 for (let i = 0; i < 2; i++) { g.players[1].bag = bag(['bread', 'chiliPowder']); act(g, 'p0', { type: 'pass', target: 'p1' }); assert.equal(g.players[1].coins, 60 + 10 * i); assert.equal(g.players[1].stall.includes('chiliPowder'), false); assert.equal(g.retired.length, 0); g.players[1].hand.pop(); }
});
test('caught Chili leaves permanently at zero fine, other Pinkman illegals cost one less', () => {
 const g = inspect(); g.players[1].bag = bag(['chiliPowder', 'meth', 'cannabread', 'fish']); act(g, 'p0', { type: 'inspect', target: 'p1' });
 assert.equal(g.players[1].coins, 43); assert.deepEqual(g.retired, ['chiliPowder']); assert.ok(!g.discard.includes('chiliPowder')); assert.deepEqual(g.discard, ['meth', 'cannabread', 'fish']);
 const h = inspect(['raughn', 'pinkman', 'rick']); h.players[1].bag = bag(['chiliPowder', 'meth']); act(h, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(h.players[1].coins, 45);
});
test('special cards cannot enter market discard and Nile loads at most one within the five-card cap', () => {
 const g = table(); const nile = g.players[2], needles = nile.hand.map((key, i) => key === 'usedNeedle' ? i : -1).filter(i => i >= 0);
 assert.throws(() => act(g, 'p2', { type: 'exchange', indices: needles })); g.phase = 'pack';
 assert.throws(() => act(g, 'p2', { type: 'pack', indices: needles })); assert.throws(() => act(g, 'p2', { type: 'pack', indices: [0, 1, 2, 3, 4, needles[0]] }));
 act(g, 'p2', { type: 'pack', indices: [needles[0]] }); assert.equal(nile.bag.count, 1); assert.equal(nile.hand.length, 7);
});
test('needle alone counts honest under any legal declaration, pays eight with zero normal compensation, and retires', () => {
 const g = inspect(); g.players[2].bag = bag(['usedNeedle'], 'wine'); act(g, 'p0', { type: 'inspect', target: 'p2' });
 assert.equal(g.players[2].coins, 58); assert.equal(g.players[0].coins, 42); assert.equal(g.results[0].kind, 'honest'); assert.deepEqual(g.retired, ['usedNeedle']); assert.deepEqual(g.players[2].stall, []); assert.deepEqual(g.discard, []);
});
test('needle adds eight to honest compensation or offsets ordinary dishonest fines without doubling itself', () => {
 const g = inspect(); g.players[2].bag = bag(['usedNeedle', 'bread', 'bread']); act(g, 'p0', { type: 'inspect', target: 'p2' }); assert.equal(g.players[2].coins, 62);
 const h = inspect(['mike', 'nile', 'rick']); h.players[1].bag = bag(['usedNeedle', 'meth']); act(h, 'p0', { type: 'inspect', target: 'p1' });
 assert.equal(h.players[1].coins, 58); act(h, 'p0', { type: 'mike-use' }); assert.equal(h.players[1].coins, 50); assert.equal(h.players[0].coins, 50); assert.deepEqual(h.retired, ['usedNeedle']);
});
test('passing needle pays four separately from bribe, retires needle, and Piper only targets the bribe', () => {
 const g = inspect(); g.players[2].bag = bag(['usedNeedle', 'meth'], 'bread', 5); act(g, 'p0', { type: 'accept-bribe', target: 'p2', expectedAmount: 5 });
 assert.equal(g.players[2].coins, 41); assert.equal(g.players[0].coins, 56); assert.equal(g.piperOffers[0].amount, 5); assert.equal(g.piperOffers[0].share, 3); assert.deepEqual(g.players[2].stall, ['meth']); assert.deepEqual(g.retired, ['usedNeedle']);
 act(g, 'p4', { type: 'piper-use', offer: g.piperOffers[0].id }); assert.equal(g.players[4].coins, 53); assert.equal(g.players[0].coins, 56);
});
test('Tuco rounds combined illegal stash value once, and combined illegal red fines once', () => {
 const g = inspect(); g.players[3].stall = ['heroin', 'weed', 'bread']; assert.equal(scores(g).find(r => r.id === 'p3').goods, 26); // ceil((9+7)*1.5)+2, not 27.
 g.players[3].bag = bag(['cannabread', 'needleFish', 'fish']); act(g, 'p0', { type: 'inspect', target: 'p3' }); assert.equal(g.players[3].coins, 36); // floor((3+5)*1.5)+2.
});
test('Piper acts only after another pair actually pays, odd share rounds up, and two uses release other held shares', () => {
 const g = inspect(); assert.throws(() => act(g, 'p4', { type: 'piper-use', offer: 'missing' }));
 for (const id of ['p1', 'p2', 'p3']) { g.players.find(p => p.id === id).bag = bag(['bread'], 'bread', 5); act(g, 'p0', { type: 'pass', target: id }); }
 assert.equal(g.piperOffers.length, 3); assert.equal(g.players[0].coins, 56); assert.throws(() => act(g, 'p0', { type: 'next' }));
 assert.throws(() => act(g, 'p1', { type: 'piper-use', offer: g.piperOffers[0].id }));
 act(g, 'p4', { type: 'piper-use', offer: g.piperOffers[0].id }); act(g, 'p4', { type: 'piper-use', offer: g.piperOffers[0].id });
 assert.equal(g.players[4].coins, 56); assert.equal(g.players[0].coins, 59); assert.equal(g.piperOffers.length, 0); assert.equal(g.players[4].abilityUses, 2);
});
test('Piper skip/expiry returns held coins, preserves use, and late clicks cannot revive the offer', () => {
 const g = inspect(); g.players[1].bag = bag(['bread'], 'bread', 7); act(g, 'p0', { type: 'pass', target: 'p1' });
 const offer = g.piperOffers[0]; assert.equal(offer.share, 4); assert.equal(offer.expiresAt - Date.now() <= TRIGGER_WINDOW_MS, true);
 assert.equal(expireAbilities(g, offer.expiresAt - 1), false); assert.equal(expireAbilities(g, offer.expiresAt), true); assert.equal(g.players[0].coins, 57); assert.equal(g.players[4].abilityUses, 0);
 assert.throws(() => act(g, 'p4', { type: 'piper-use', offer: offer.id }));
 g.players[2].bag = bag(['bread'], 'bread', 3); act(g, 'p0', { type: 'pass', target: 'p2' }); act(g, 'p4', { type: 'piper-skip', offer: g.piperOffers[0].id }); assert.equal(g.players[4].abilityUses, 0);
});
test('Piper gets no trigger for own bribe, zero offer, inspection fine, or unpaid offer', () => {
 const g = inspect(); g.players[4].bag = bag(['bread'], 'bread', 5); act(g, 'p0', { type: 'pass', target: 'p4' });
 act(g, 'p1', { type: 'bribe', amount: 5 }); assert.equal(g.piperOffers.length, 0); act(g, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(g.piperOffers.length, 0);
 act(g, 'p0', { type: 'pass', target: 'p2' }); assert.equal(g.piperOffers.length, 0);
});
test('trigger countdown survives chat and snapshots, then skips without spending ability', () => {
 const g = inspect(['hank', 'dahlia', 'rick']); g.players[1].bag = bag(['bread', 'weed']); act(g, 'p0', { type: 'inspect', target: 'p1' });
 const deadline = g.pendingInspection.expiresAt; assert.equal(deadline - Date.now() <= 20000, true); act(g, 'p2', { type: 'chat', text: 'still waiting' }); assert.equal(g.pendingInspection.expiresAt, deadline); assert.equal(viewFor(g, 'p1').pendingInspection.expiresAt, deadline);
 expireAbilities(g, deadline); assert.equal(g.players[1].abilityUses, 0); assert.equal(g.players[1].bag.resolved, true); assert.equal(g.players[1].coins, 46);
});
test('only activation windows expire; mandatory choices after activating remain until answered', () => {
 const g = inspect(['hank', 'dahlia', 'rick']); g.players[1].bag = bag(['bread', 'weed']); act(g, 'p0', { type: 'inspect', target: 'p1' }); act(g, 'p1', { type: 'dahlia-remove', indices: [1] });
 assert.equal(g.pendingInspection.stage, 'dahlia-choice'); assert.equal(g.pendingInspection.expiresAt, undefined); assert.equal(expireAbilities(g, Date.now() + 100000), false);
 const h = inspect(['mike', 'rick', 'benny']); h.players[1].bag = bag(['meth']); act(h, 'p0', { type: 'inspect', target: 'p1' }); const deadline = h.pendingInspection.expiresAt; expireAbilities(h, deadline); assert.equal(h.players[0].abilityUsed, false); assert.equal(h.players[1].coins, 46);
});
test('100 full games with all four new roles account for base, special, and permanently removed cards', () => {
 for (let run = 0; run < 100; run++) { const g = table(); g.players.forEach(p => p.bot = true); let steps = 0;
  while (g.phase !== 'finished' && steps++ < 1600) {
   if (g.phase === 'results' && !g.piperOffers.length) act(g, 'p0', { type: 'next' });
   else { let moved = false; for (const p of g.players) { const action = botAction(g, p.id); if (action) { act(g, p.id, action); moved = true; break; } } assert.ok(moved, `${g.phase}/${g.pendingInspection?.stage}`); }
   const total = g.deck.length + g.discard.length + g.retired.length + g.players.reduce((n, p) => n + p.hand.length + p.stall.length + (p.bag && !p.bag.resolved ? p.bag.cards.length : 0), 0); assert.equal(total, 225); assert.ok(g.players.every(p => p.coins >= 0));
  } assert.equal(g.phase, 'finished');
 }
});
