import test from 'node:test';
import assert from 'node:assert/strict';
import { act, addPlayer, createGame, startGame, viewFor, botAction, CATALOG_SIZE, penaltyFor } from '../engine.js';
function table(roles = ['mike', 'dahlia', 'steve', 'timothy', 'carl']) {
 const g = createGame('p0', 'P0'); roles.slice(1).forEach((_, i) => addPlayer(g, `p${i + 1}`, `P${i + 1}`));
 roles.forEach((character, i) => act(g, `p${i}`, { type: 'choose-character', character })); startGame(g, 'p0'); return g;
}
const bag = (cards, declaration = 'bread', bribe = 0) => ({ cards, count: cards.length, declaration, bribe, resolved: false });
function inspect(roles) { const g = table(roles); g.phase = 'inspect'; g.players.forEach((p, i) => { p.coins = 50; if (i) p.bag = bag(['bread']); }); return g; }
function beginDahlia(g, cards = ['bread', 'weed', 'heroin']) { g.players[1].bag = bag(cards); act(g, 'p0', { type: 'inspect', target: 'p1' }); }

test('Dahlia activates after inspection choice, leaves one card, and rejects invalid removals atomically', () => {
 const g = inspect(); beginDahlia(g); assert.equal(g.pendingInspection.stage, 'dahlia-response');
 for (const indices of [[], [0, 1, 2], [1, 1], [99]]) { const before = structuredClone(g); assert.throws(() => act(g, 'p1', { type: 'dahlia-remove', indices })); assert.deepEqual(g, before); }
 assert.throws(() => act(g, 'p0', { type: 'dahlia-remove', indices: [1] }));
 act(g, 'p1', { type: 'dahlia-remove', indices: [1, 2] }); assert.equal(g.pendingInspection.stage, 'dahlia-choice'); assert.equal(g.players[1].bag.count, 1); assert.equal(g.players[1].abilityUses, 1);
 assert.equal(g.discard.length, 0); assert.ok(!g.log.at(-1).includes('Weed'));
 const owner = viewFor(g, 'p1'), dea = viewFor(g, 'p0'), other = viewFor(g, 'p2');
 assert.deepEqual(owner.players[1].bag.cards, ['bread']); assert.deepEqual(owner.pendingInspection.removedIndices, [1, 2]); assert.deepEqual(owner.pendingInspection.removedCards, ['weed', 'heroin']);
 assert.equal(dea.pendingInspection.removedCards, undefined); assert.equal(other.pendingInspection.removedCards, undefined); assert.equal(dea.pendingInspection.removedIndices, undefined); assert.equal(other.pendingInspection.removedIndices, undefined); assert.equal(dea.players[1].bag.cards, null);
});
test('Dahlia remaining packet is judged honestly with reduced count; removed cards reveal after the decision', () => {
 const g = inspect(); beginDahlia(g); act(g, 'p1', { type: 'dahlia-remove', indices: [1, 2] }); act(g, 'p0', { type: 'dahlia-inspect' });
 assert.deepEqual(g.players[1].stall, ['bread']); assert.deepEqual(g.discard, ['weed', 'heroin']); assert.equal(g.players[1].coins, 50); // Mike's first honest waiver.
 assert.ok(g.log.some(line => line.includes('revealed and discarded: Weed, Heroin'))); assert.equal(g.players[0].mikeWaived, true);
});
test('Dahlia can decline without spending a use; second use exhausts ability; one-card packets skip the window', () => {
 const g = inspect(['hank', 'dahlia', 'rick']); beginDahlia(g); act(g, 'p1', { type: 'dahlia-skip' }); assert.equal(g.players[1].abilityUses, 0);
 for (let i = 0; i < 2; i++) { beginDahlia(g, ['bread', 'weed']); act(g, 'p1', { type: 'dahlia-remove', indices: [1] }); act(g, 'p0', { type: 'dahlia-pass' }); }
 beginDahlia(g, ['bread', 'weed']); assert.equal(g.pendingInspection, null); assert.equal(g.players[1].abilityUses, 2);
 const h = inspect(['hank', 'dahlia', 'rick']); beginDahlia(h, ['bread']); assert.equal(h.pendingInspection, null);
});
test('live offers can be made before packing, revised during declarations, and revoked during pending inspection', () => {
 const g = table(['hank', 'dahlia', 'rick']); act(g, 'p1', { type: 'bribe', amount: 7 }); assert.equal(viewFor(g, 'p1').players[1].bribeOffer, 7);
 g.phase = 'pack'; act(g, 'p1', { type: 'pack', indices: [0, 1] }); assert.equal(g.players[1].bag.bribe, 7);
 g.phase = 'declare'; act(g, 'p1', { type: 'bribe', amount: 9 }); assert.equal(g.players[1].bag.bribe, 9);
 g.phase = 'inspect'; g.players[1].bag = bag(['bread', 'weed'], 'bread', 9); g.players[2].bag = bag(['bread']);
 act(g, 'p0', { type: 'inspect', target: 'p1' }); act(g, 'p1', { type: 'bribe', amount: 0 }); assert.equal(g.players[1].bag.bribe, 0);
 act(g, 'p1', { type: 'dahlia-remove', indices: [1] }); act(g, 'p1', { type: 'bribe', amount: 5 });
 const before = structuredClone(g); assert.throws(() => act(g, 'p0', { type: 'accept-bribe', target: 'p1', expectedAmount: 9 })); assert.deepEqual(g, before);
 act(g, 'p1', { type: 'bribe', amount: 0 }); assert.throws(() => act(g, 'p0', { type: 'accept-bribe', target: 'p1', expectedAmount: 5 }));
 act(g, 'p1', { type: 'bribe', amount: 3 }); act(g, 'p0', { type: 'accept-bribe', target: 'p1', expectedAmount: 3 });
 assert.equal(g.players[1].coins, 47); assert.equal(g.players[0].coins, 53); assert.equal(g.results[0].cards, null); assert.deepEqual(g.discard, ['weed']);
 assert.throws(() => act(g, 'p1', { type: 'bribe', amount: 0 }));
});
test('ordinary offer acceptance reads latest amount, authorizes only DEA, and awards Selena only when paid', () => {
 const g = inspect(['hank', 'dahlia', 'selena']); g.players[1].bag = bag(['bread', 'weed']);
 act(g, 'p1', { type: 'bribe', amount: 4 }); assert.throws(() => act(g, 'p2', { type: 'accept-bribe', target: 'p1', expectedAmount: 4 }));
 act(g, 'p0', { type: 'accept-bribe', target: 'p1', expectedAmount: 4 }); assert.equal(g.players[2].coins, 51);
});
test('a revealed outcome cannot be replaced by accepting an ordinary bribe', () => {
 const g = inspect(); g.players[2].bag = bag(['weed']); act(g, 'p0', { type: 'inspect', target: 'p2' }); assert.equal(g.pendingInspection.stage, 'mike-response');
 act(g, 'p2', { type: 'bribe', amount: 8 }); assert.throws(() => act(g, 'p0', { type: 'accept-bribe', target: 'p2', expectedAmount: 8 }));
});
test('Steve halves only ordinary Weed fine, returns it to hand, and loses other caught illegals', () => {
 const g = inspect(['hank', 'steve', 'rick']); g.players[1].hand = ['bread']; g.players[1].bag = bag(['weed', 'weed', 'cannabread', 'meth']);
 act(g, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(g.players[1].coins, 39); assert.deepEqual(g.players[1].hand, ['bread', 'weed', 'weed']); assert.deepEqual(g.discard, ['cannabread', 'meth']); assert.deepEqual(g.players[1].stall, []);
 const h = inspect(['raughn', 'steve', 'rick']); assert.equal(penaltyFor(h.players[1], 'weed', h), 3);
});
test('Steve receives final bank reward once, from held illegal cards, Weed worth six instead of three', () => {
 const g = inspect(['hank', 'steve', 'rick']); g.phase = 'results'; g.round = 9; g.players[1].stall = ['weed', 'weed', 'meth', 'cannabread', 'bread'];
 act(g, 'p0', { type: 'next' }); assert.equal(g.players[1].coins, 68); assert.equal(g.phase, 'finished'); assert.throws(() => act(g, 'p0', { type: 'next' }));
});
test('Mike first honest waiver happens only once per game and preserves goods', () => {
 const g = inspect(); g.players[2].bag = bag(['bread', 'bread']); act(g, 'p0', { type: 'inspect', target: 'p2' }); assert.equal(g.players[0].coins, 50); assert.equal(g.players[2].coins, 50);
 g.players[4].bag = bag(['bread', 'bread']); act(g, 'p0', { type: 'inspect', target: 'p4' }); assert.equal(g.players[0].coins, 46); assert.equal(g.players[4].coins, 54); assert.ok(!g.players[0].abilityUsed);
});
test('Mike chooses after reveal, doubles total normal fine once, and Steve Weed still returns', () => {
 const g = inspect(); g.players[2].bag = bag(['weed', 'meth', 'fish']); act(g, 'p0', { type: 'inspect', target: 'p2' });
 assert.equal(g.pendingInspection.stage, 'mike-response'); assert.equal(g.pendingInspection.amount, 8); assert.equal(g.players[2].coins, 50);
 assert.equal(viewFor(g, 'p1').pendingInspection.outcome, undefined); assert.throws(() => act(g, 'p1', { type: 'mike-use' }));
 act(g, 'p0', { type: 'mike-use' }); assert.equal(g.players[2].coins, 34); assert.equal(g.players[0].coins, 66); assert.ok(g.players[2].hand.includes('weed')); assert.equal(g.players[0].abilityUsed, true);
 g.players[4].bag = bag(['meth']); act(g, 'p0', { type: 'inspect', target: 'p4' }); assert.equal(g.pendingInspection, null);
});
test('Mike skip saves charge; first valid Mike/Dana activation blocks the competing power', () => {
 const g = inspect(['mike', 'dana', 'rick']); g.players[1].bag = bag(['weed', 'meth']); act(g, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(g.pendingInspection.stage, 'dana-response');
 act(g, 'p0', { type: 'mike-use' }); assert.equal(g.players[1].coins, 34); assert.throws(() => act(g, 'p1', { type: 'dana-split', indices: [0, 1] }));
 const h = inspect(['mike', 'dana', 'rick']); h.players[1].bag = bag(['weed', 'meth']); act(h, 'p0', { type: 'inspect', target: 'p1' }); act(h, 'p1', { type: 'dana-split', indices: [0, 1] }); assert.throws(() => act(h, 'p0', { type: 'mike-use' }));
 const k = inspect(); k.players[2].bag = bag(['meth']); act(k, 'p0', { type: 'inspect', target: 'p2' }); act(k, 'p0', { type: 'mike-skip' }); assert.equal(k.players[0].abilityUsed, false); assert.equal(k.pendingInspection, null);
});
test('Timothy force-inspects, splits collected fine, receives twelve, and has two uses', () => {
 const g = inspect(); g.players[1].bag = bag(['bread', 'weed', 'heroin']); act(g, 'p3', { type: 'timothy', target: 'p1' });
 assert.equal(g.pendingInspection, null); assert.equal(g.players[1].coins, 42); assert.equal(g.players[0].coins, 54); assert.equal(g.players[3].coins, 66); assert.deepEqual(g.players[1].stall, ['bread']);
 act(g, 'p3', { type: 'timothy', target: 'p2' }); assert.equal(g.players[3].abilityUses, 2); assert.throws(() => act(g, 'p3', { type: 'timothy', target: 'p4' }));
});
test('Timothy splits honest compensation evenly without a dishonest-inspection bonus', () => {
 const g = inspect(['hank', 'rick', 'timothy']); g.players[1].bag = bag(['bread', 'bread', 'bread']); act(g, 'p2', { type: 'timothy', target: 'p1' });
 assert.equal(g.players[0].coins, 47); assert.equal(g.players[2].coins, 47); assert.equal(g.players[1].coins, 56);
});
test('Timothy cannot target himself or act as DEA and cannot override activated Dahlia', () => {
 const g = inspect(); assert.throws(() => act(g, 'p3', { type: 'timothy', target: 'p3' }));
 beginDahlia(g); act(g, 'p1', { type: 'dahlia-remove', indices: [1] }); assert.throws(() => act(g, 'p3', { type: 'timothy', target: 'p1' }));
 const h = inspect(); beginDahlia(h); act(h, 'p3', { type: 'timothy', target: 'p1' }); assert.throws(() => act(h, 'p1', { type: 'dahlia-remove', indices: [1] }));
});
test('Timothy splits only actually collected fines when merchant cannot afford them', () => {
 const g = inspect(['hank', 'rick', 'timothy']); g.players[1].coins = 3; g.players[1].bag = bag(['meth']);
 act(g, 'p2', { type: 'timothy', target: 'p1' }); assert.equal(g.players[1].coins, 0); assert.equal(g.players[0].coins, 52); assert.equal(g.players[2].coins, 63);
});
test('Selena may fund her share of honest Rat compensation or an entire dishonest fine from the bank', () => {
 const g = inspect(['selena', 'rick', 'timothy']); g.players[1].bag = bag(['bread', 'bread']); act(g, 'p2', { type: 'timothy', target: 'p1' });
 assert.equal(g.pendingInspection.amount, 2); act(g, 'p0', { type: 'selena-bank' }); assert.equal(g.players[0].coins, 50); assert.equal(g.players[1].coins, 54); assert.equal(g.players[2].coins, 48);
 const h = inspect(['hank', 'selena', 'timothy']); h.players[1].bag = bag(['meth']); act(h, 'p2', { type: 'timothy', target: 'p1' }); act(h, 'p1', { type: 'selena-bank' }); assert.equal(h.players[1].coins, 50); assert.equal(h.players[0].coins, 52); assert.equal(h.players[2].coins, 64);
});
test('Carl steals one caught illegal card while all fines remain, then independently frames an honest packet', () => {
 const g = inspect(['carl', 'rick', 'steve']); g.players[0].hand = ['meth', 'bread']; g.players[1].bag = bag(['bread', 'weed', 'heroin']);
 act(g, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(g.pendingInspection.stage, 'carl-response'); act(g, 'p0', { type: 'carl-steal', index: 2 });
 assert.deepEqual(g.players[0].stall, ['heroin']); assert.equal(g.players[1].coins, 42); assert.deepEqual(g.discard, ['weed']); assert.equal(g.players[0].carlStole, true); assert.ok(!g.players[0].carlFramed);
 act(g, 'p0', { type: 'inspect', target: 'p2' }); act(g, 'p0', { type: 'carl-frame', index: 0 });
 assert.equal(g.players[2].coins, 50); assert.equal(g.players[0].coins, 58); assert.deepEqual(g.players[2].stall, ['bread']); assert.deepEqual(g.players[0].hand, ['bread']); assert.equal(g.players[0].carlFramed, true); assert.deepEqual(g.discard, ['weed', 'meth']);
});
test('Carl may steal Steve’s returning Weed; Steve still pays half fine', () => {
 const g = inspect(['carl', 'steve', 'rick']); g.players[1].hand = []; g.players[1].bag = bag(['weed']); act(g, 'p0', { type: 'inspect', target: 'p1' }); act(g, 'p0', { type: 'carl-steal', index: 0 });
 assert.equal(g.players[1].coins, 48); assert.deepEqual(g.players[1].hand, []); assert.deepEqual(g.players[0].stall, ['weed']);
});
test('Carl validates card choices without consuming either power and can save his abilities', () => {
 const g = inspect(['carl', 'rick', 'steve']); g.players[0].hand = ['bread']; g.players[1].bag = bag(['weed']); act(g, 'p0', { type: 'inspect', target: 'p1' });
 const before = structuredClone(g); assert.throws(() => act(g, 'p0', { type: 'carl-steal', index: 9 })); assert.deepEqual(g, before); assert.throws(() => act(g, 'p0', { type: 'carl-frame', index: 0 }));
 act(g, 'p0', { type: 'carl-skip' }); assert.ok(!g.players[0].carlStole); assert.equal(g.pendingInspection, null);
});
test('100 games with the newest five finish every response and conserve all physical cards', () => {
 for (let run = 0; run < 100; run++) {
  const g = table(); g.players.forEach(p => p.bot = true); let steps = 0;
  while (g.phase !== 'finished' && steps++ < 1500) {
   if (g.phase === 'results') act(g, 'p0', { type: 'next' });
   else { let moved = false; for (const p of g.players) { const action = botAction(g, p.id); if (action) { act(g, p.id, action); moved = true; break; } } assert.ok(moved, `${g.phase}/${g.pendingInspection?.stage}`); }
   const total = g.deck.length + g.discard.length + g.players.reduce((n, p) => n + p.hand.length + p.stall.length + (p.bag && !p.bag.resolved ? p.bag.cards.length : 0), 0); assert.equal(total, CATALOG_SIZE);
  }
  assert.equal(g.phase, 'finished'); assert.equal(g.round, 10);
 }
});
