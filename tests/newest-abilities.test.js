import test from 'node:test';
import assert from 'node:assert/strict';
import { act, addPlayer, createGame, startGame, viewFor, legalGoodsFor, penaltyFor, scores, botAction, CATALOG_SIZE } from '../engine.js';
function table(roles = ['raughn', 'peteBadger', 'hector', 'trump', 'rick']) {
  const g = createGame('p0', 'P0');
  roles.slice(1).forEach((_, i) => addPlayer(g, `p${i + 1}`, `P${i + 1}`));
  roles.forEach((character, i) => act(g, `p${i}`, { type: 'choose-character', character }));
  startGame(g, 'p0'); return g;
}
const bag = (cards, declaration = 'bread') => ({ cards, declaration, count: cards.length, bribe: 0, resolved: false });
function inspection(roles) { const g = table(roles); g.phase = 'inspect'; g.players.forEach((p, i) => { p.coins = 50; if (i) p.bag = bag(['bread']); }); return g; }

test('Raughn bans wine declarations only during his DEA turn and snapshots agree', () => {
  const g = table(); g.phase = 'declare'; g.players.slice(1).forEach(p => p.bag = bag(['wine']));
  assert.throws(() => act(g, 'p1', { type: 'declare', declaration: 'wine', bribe: 0 }));
  const p = viewFor(g, 'p1').players[1]; assert.ok(!legalGoodsFor(p).includes('wine')); assert.equal(penaltyFor(p, 'wine'), 4);
  g.dea = 2; assert.ok(legalGoodsFor(g.players[1], g).includes('wine')); act(g, 'p1', { type: 'declare', declaration: 'wine', bribe: 0 });
});
test('Raughn fines wine and actual illegals by two extra, but legal mismatches keep their normal penalty', () => {
  const g = inspection(); g.players[4].bag = bag(['bread', 'wine', 'meth', 'fish']);
  act(g, 'p0', { type: 'inspect', target: 'p4' });
  assert.equal(g.players[4].coins, 38); assert.equal(g.players[0].coins, 62);
  assert.deepEqual(g.players[4].stall, ['bread']); assert.deepEqual(g.discard, ['wine', 'meth', 'fish']);
});
test('Raughn extra fine stacks before Katagiri or Heisenberg doubling; Wendy Meth stays exempt', () => {
  const g = inspection(['raughn', 'katagiri', 'wendy']); g.players[1].bag = bag(['meth']);
  act(g, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(g.players[1].coins, 38);
  g.players[2].bag = bag(['meth', 'blueSky']); act(g, 'p0', { type: 'inspect', target: 'p2' }); assert.equal(g.players[2].coins, 42);
  const h = inspection(['raughn', 'heisenberg', 'wendy']); h.players[1].bag = bag(['meth']);
  act(h, 'p0', { type: 'inspect', target: 'p1' }); act(h, 'p1', { type: 'heisenberg-use' }); act(h, 'p0', { type: 'heisenberg-inspect' }); assert.equal(h.players[1].coins, 38);
});
test('Pete swaps in an illegal hand card after honest inspection, retaining original compensation', () => {
  const g = inspection(); const p = g.players[1]; p.hand = ['heroin', 'fish']; p.bag = bag(['bread', 'bread']);
  assert.throws(() => act(g, 'p1', { type: 'pete-swap', index: 0, handIndex: 0 }));
  act(g, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(g.pendingInspection.stage, 'pete-response');
  assert.equal(viewFor(g, 'p4').pendingInspection.outcome, undefined); assert.equal(viewFor(g, 'p4').players[1].hand, null);
  assert.throws(() => act(g, 'p2', { type: 'pete-swap', index: 0, handIndex: 0 }));
  act(g, 'p1', { type: 'pete-swap', index: 1, handIndex: 0 });
  assert.deepEqual(p.hand, ['bread', 'fish']); assert.deepEqual(p.stall, ['bread', 'heroin']); assert.equal(p.coins, 54); assert.equal(p.peteUsed, true); assert.ok(!p.badgerUsed);
  p.bag = bag(['bread']); act(g, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(g.pendingInspection, null);
});
test('Pete and Badger can each be saved, then used independently; Badger retains the normal fine', () => {
  const g = inspection(); const p = g.players[1]; p.hand = ['meth']; p.bag = bag(['bread']);
  act(g, 'p0', { type: 'inspect', target: 'p1' }); act(g, 'p1', { type: 'pete-skip' }); assert.ok(!p.peteUsed);
  p.bag = bag(['bread', 'weed', 'fish']); act(g, 'p0', { type: 'inspect', target: 'p1' });
  assert.equal(g.pendingInspection.amount, 8); act(g, 'p1', { type: 'badger-skip' }); assert.ok(!p.badgerUsed);
  p.bag = bag(['bread', 'weed']); act(g, 'p0', { type: 'inspect', target: 'p1' });
  const before = p.coins, agent = g.players[0].coins; act(g, 'p1', { type: 'badger-use' });
  assert.equal(p.coins, before - 16); assert.equal(g.players[0].coins, agent + 6); assert.equal(p.badgerUsed, true); assert.ok(!p.peteUsed); assert.deepEqual(p.stall.slice(-2), ['bread', 'weed']);
  p.bag = bag(['weed']); act(g, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(g.pendingInspection, null);
});
test('Badger rejects unaffordable bailouts without consuming the ability or altering the outcome', () => {
  const g = inspection(); g.players[1].coins = 10; g.players[1].bag = bag(['weed']);
  act(g, 'p0', { type: 'inspect', target: 'p1' }); const before = structuredClone(g);
  assert.throws(() => act(g, 'p1', { type: 'badger-use' })); assert.deepEqual(g, before);
});
test('Pete/Badger adds one scoring point per illegal card held, mixed cards included', () => {
  const g = table(); g.players[1].stall = ['weed', 'cannabread', 'bread']; const row = scores(g).find(p => p.id === 'p1');
  assert.ok(row.awards.includes('Pete & Badger: +€2 for illegal goods')); assert.equal(row.goods, 13);
});
test('Hector marks while holding the badge, immediately passes unopened, and pays/receives ordinary bribes', () => {
  const g = inspection(); g.dea = 2; g.round = 3; g.players[0].bag = bag(['bread']); g.players[2].bag = null;
  g.players[1].bag = bag(['meth']); g.players[1].bag.bribe = 4;
  act(g, 'p2', { type: 'hector', target: 'p1' });
  assert.equal(g.pendingInspection, null); assert.equal(g.players[1].bag.resolved, true); assert.deepEqual(g.players[1].stall, ['meth']);
  assert.equal(g.players[2].coins, 54); assert.equal(g.players[1].coins, 46); assert.equal(g.results[0].cards, null);
  assert.deepEqual(g.hectorMarks, [{ hector: 'p2', agent: 'p1', round: 7 }]);
  assert.throws(() => act(g, 'p2', { type: 'hector', target: 'p1' }));
  act(g, 'p2', { type: 'hector', target: 'p3' }); assert.equal(g.players[2].abilityUses, 2); assert.throws(() => act(g, 'p2', { type: 'hector', target: 'p4' }));
});
test('Hector receives five on a marked inspection in addition to honest compensation or his own fine', () => {
  for (const cards of [['bread'], ['weed']]) {
    const g = inspection(['hank', 'hector', 'rick']); g.hectorMarks = [{ hector: 'p1', agent: 'p0', round: 1 }]; g.players[1].bag = bag(cards);
    act(g, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(g.players[1].coins, cards[0] === 'bread' ? 57 : 51);
    assert.equal(g.players[0].coins, cards[0] === 'bread' ? 43 : 49);
  }
});
test('Hector fee expires after the next marked DEA turn; passing incurs no fee', () => {
  const g = inspection(['hank', 'hector', 'rick']); g.hectorMarks = [{ hector: 'p1', agent: 'p0', round: 1 }];
  act(g, 'p0', { type: 'pass', target: 'p1' }); assert.equal(g.players[1].coins, 50);
  g.round = 4; g.players[1].bag = bag(['weed']); act(g, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(g.players[1].coins, 46);
});
test('First active power claims the packet: Hector and Fring cannot override each other', () => {
  const g = inspection(['hector', 'fring', 'rick']); act(g, 'p1', { type: 'fring', target: 'p2' }); assert.throws(() => act(g, 'p0', { type: 'hector', target: 'p2' }));
  const h = inspection(['hector', 'fring', 'rick']); act(h, 'p0', { type: 'hector', target: 'p2' }); assert.throws(() => act(h, 'p1', { type: 'fring', target: 'p2' }));
});
test('Trump explicitly levies each opponent per delivered illegal card at three and five players', () => {
  for (const n of [3, 5]) {
    const roles = ['hank', 'trump', 'rick', 'benny', 'wendy'].slice(0, n), g = inspection(roles); g.players[1].bag = bag(['weed', 'meth', 'heroin']);
    act(g, 'p0', { type: 'pass', target: 'p1' }); assert.equal(g.pendingInspection.stage, 'trump-response'); assert.equal(g.players[1].coins, 50);
    assert.throws(() => act(g, 'p0', { type: 'trump-use' })); act(g, 'p1', { type: 'trump-use' });
    const each = n === 5 ? 3 : 6; assert.equal(g.players[1].coins, 50 + each * (n - 1)); assert.equal(g.players[0].coins, 50 - each); assert.equal(g.players[1].abilityUsed, true);
    assert.equal(g.results[0].cards, null);
  }
});
test('Trump can skip a qualifying final packet without blocking round progression, and honest inspection earns three extra', () => {
  const g = inspection(['hank', 'trump', 'rick']); act(g, 'p0', { type: 'pass', target: 'p2' }); g.players[1].bag = bag(['weed', 'meth', 'heroin']);
  act(g, 'p0', { type: 'pass', target: 'p1' }); assert.equal(g.phase, 'inspect'); assert.throws(() => act(g, 'p0', { type: 'next' }));
  act(g, 'p1', { type: 'trump-skip' }); assert.equal(g.phase, 'results'); assert.equal(g.players[1].abilityUsed, false);
  const h = inspection(['hank', 'trump', 'rick']); h.players[1].bag = bag(['bread', 'bread', 'bread']); act(h, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(h.players[1].coins, 59);
});
test('Trump does not qualify from confiscated goods or two delivered illegals', () => {
  const g = inspection(['hank', 'trump', 'rick']); g.players[1].bag = bag(['weed', 'meth', 'heroin']); act(g, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(g.pendingInspection, null);
  g.players[1].bag = bag(['weed', 'meth']); act(g, 'p0', { type: 'pass', target: 'p1' }); assert.equal(g.pendingInspection, null);
});
test('Rick starts with five extra, privately chooses any three discard cards, then may exchange normally', () => {
  const g = table(); const p = g.players[4]; assert.equal(p.coins, 55); p.hand = ['bread', 'fish', 'meat', 'wine', 'meth', 'heroin']; g.discard = ['weed', 'blueSky', 'bread', 'crowbar', 'wine'];
  assert.deepEqual(viewFor(g, 'p4').rickDiscard, g.discard); assert.equal(viewFor(g, 'p0').rickDiscard, null);
  act(g, 'p4', { type: 'rick', indices: [0, 2, 4], discardIndices: [0, 1, 3], revision: g.revision });
  assert.deepEqual(p.hand, ['fish', 'wine', 'heroin', 'weed', 'blueSky', 'crowbar']); assert.deepEqual(g.discard, ['bread', 'wine', 'bread', 'meat', 'meth']); assert.equal(p.ready, false);
  assert.equal(viewFor(g, 'p4').rickDiscard, null); assert.throws(() => act(g, 'p4', { type: 'rick', indices: [0, 1, 2], discardIndices: [0, 1, 2], revision: g.revision }));
  act(g, 'p4', { type: 'exchange', indices: [0] }); assert.equal(p.ready, true); assert.equal(p.hand.length, 6);
});
test('Rick validates stale discard revision, duplicate selections, and wrong phases atomically', () => {
  const g = table(); g.discard = ['bread', 'wine', 'crowbar'];
  const action = { type: 'rick', indices: [0, 1, 2], discardIndices: [0, 1, 2], revision: g.revision }, before = structuredClone(g);
  for (const invalid of [{ ...action, revision: -1 }, { ...action, discardIndices: [0, 0, 1] }, { ...action, indices: [0, 1] }]) { assert.throws(() => act(g, 'p4', invalid)); assert.deepEqual(g, before); }
  g.phase = 'pack'; assert.throws(() => act(g, 'p4', action));
});
test('100 complete bot games with the newest five preserve all cards and resolve all pending windows', () => {
  for (let run = 0; run < 100; run++) {
    const g = table(); g.players.forEach(p => p.bot = true); let steps = 0;
    while (g.phase !== 'finished' && steps++ < 1500) {
      if (g.phase === 'results') act(g, 'p0', { type: 'next' });
      else { let moved = false; for (const p of g.players) { const action = botAction(g, p.id); if (action) { act(g, p.id, action); moved = true; break; } } assert.ok(moved, `${g.phase}: ${g.pendingInspection?.stage}`); }
      const physical = g.deck.length + g.discard.length + g.players.reduce((n, p) => n + p.hand.length + p.stall.length + (p.bag && !p.bag.resolved ? p.bag.cards.length : 0), 0);
      assert.equal(physical, CATALOG_SIZE);
    }
    assert.equal(g.phase, 'finished'); assert.equal(g.round, 10);
  }
});

test('Rick may dive after his ordinary exchange if the market remains open, including as DEA', () => {
  const g = table(); act(g, 'p4', { type: 'exchange', indices: [0, 1, 2] });
  assert.equal(g.phase, 'market'); assert.equal(g.players[4].ready, true);
  act(g, 'p4', { type: 'rick', indices: [0, 1, 2], discardIndices: [0, 1, 2], revision: g.revision }); assert.equal(g.players[4].abilityUsed, true); assert.equal(g.players[4].ready, true);
  const h = table(['rick', 'hank', 'benny']); h.discard = ['bread', 'wine', 'weed'];
  act(h, 'p0', { type: 'rick', indices: [0, 1, 2], discardIndices: [0, 1, 2], revision: h.revision }); assert.equal(h.players[0].abilityUsed, true); assert.equal(h.phase, 'market');
});
