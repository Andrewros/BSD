import test from 'node:test';
import assert from 'node:assert/strict';
import { GOODS, act, addPlayer, abilityRemaining, botAction, createGame, isLegalFor, legalGoodsFor, penaltyFor, startGame, viewFor } from '../engine.js';

function table(roles = ['hank', 'benny', 'dana', 'kim', 'l']) {
  const g = createGame('p0', 'P0');
  for (let i = 1; i < roles.length; i++) addPlayer(g, `p${i}`, `P${i}`);
  roles.forEach((role, i) => act(g, `p${i}`, { type: 'choose-character', character: role }));
  startGame(g, 'p0'); return g;
}
const bag = (cards, declaration = 'bread', bribe = 0) => ({ cards, declaration, bribe, count: cards.length, resolved: false });
function inspecting(roles) {
  const g = table(roles); g.phase = 'inspect';
  g.players.forEach((p, i) => { p.coins = 50; if (i) p.bag = bag(['bread']); });
  return g;
}
test('Benny unlocks crowbars only from three in his stash, permanently and for himself only', () => {
  const g = table(), benny = g.players[1]; benny.hand = ['crowbar', 'crowbar', 'crowbar'];
  act(g, 'p1', { type: 'chat', text: 'Hand is not a stash' }); assert.equal(benny.crowbarsUnlocked, false);
  benny.stall = ['crowbar', 'crowbar']; g.phase = 'inspect'; benny.bag = bag(['crowbar']);
  for (const p of g.players.slice(2)) p.bag = bag(['bread']);
  act(g, 'p0', { type: 'pass', target: 'p1' }); assert.equal(benny.crowbarsUnlocked, true);
  assert.equal(isLegalFor(benny, 'crowbar'), true); assert.equal(isLegalFor(g.players[2], 'crowbar'), false);
  assert.ok(legalGoodsFor(benny).includes('crowbar')); assert.equal(penaltyFor(benny, 'crowbar'), 2);
  assert.equal(viewFor(g, 'p0').players[1].contrabandCount, 0); assert.equal(viewFor(g, 'p0').players[1].stall.length, 3);
  benny.stall = []; act(g, 'p1', { type: 'chat', text: 'Unlock persists' }); assert.equal(benny.crowbarsUnlocked, true);
});
test('Benny may declare unlocked crowbars and receives €2 per honest crowbar; Fring cannot steal those legal cards', () => {
  const g = inspecting(['fring', 'benny', 'light']); const benny = g.players[1];
  benny.crowbarsUnlocked = true; benny.bag = bag(['crowbar', 'crowbar'], 'crowbar');
  act(g, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(benny.coins, 54); assert.equal(g.players[0].coins, 46);
  const f = inspecting(['light', 'benny', 'fring']); f.players[1].crowbarsUnlocked = true; f.players[1].bag = bag(['crowbar']);
  act(f, 'p2', { type: 'fring', target: 'p1' });
  assert.deepEqual(f.players[1].stall, ['crowbar']); assert.deepEqual(f.players[2].stall, []); assert.equal(f.players[2].coins, 47);
});
test('Benny discard draws replace exchange draws; malformed or stale requests do not mutate the hand', () => {
  const g = table(); g.players[1].hand = ['bread', 'fish', 'meat', 'wine', 'heroin', 'meth'];
  g.discard = ['wine', 'crowbar', 'fish', 'crowbar']; g.deck = ['bread', 'meat'];
  const before = [...g.players[1].hand];
  assert.throws(() => act(g, 'p1', { type: 'exchange', indices: [4], discardCrowbars: 2 }));
  assert.deepEqual(g.players[1].hand, before);
  assert.throws(() => act(g, 'p2', { type: 'exchange', indices: [0], discardCrowbars: 1 }));
  act(g, 'p1', { type: 'exchange', indices: [4, 5], discardCrowbars: 2 });
  assert.equal(g.players[1].hand.length, 6); assert.deepEqual(g.players[1].hand.slice(-2), ['crowbar', 'crowbar']);
  assert.deepEqual(g.deck, ['bread', 'meat']); assert.equal(g.discard.filter(c => c === 'crowbar').length, 0);
});
test('Hank surveillance shows only the first two replacement draws privately and never the initial deal', () => {
  const g = table(); g.deck = ['bread', 'fish', 'heroin', 'meth'];
  assert.equal(viewFor(g, 'p0').marketIntel, null);
  act(g, 'p1', { type: 'exchange', indices: [0, 1, 2] });
  act(g, 'p0', { type: 'surveil' });
  assert.deepEqual(viewFor(g, 'p0').marketIntel.p1, ['meth', 'heroin']);
  assert.equal(viewFor(g, 'p1').marketIntel, null); assert.equal(viewFor(g, 'p2').marketIntel, null);
  assert.throws(() => act(g, 'p0', { type: 'surveil' }));
  for (const p of g.players.slice(2)) act(g, p.id, { type: 'exchange', indices: [] });
  assert.equal(g.phase, 'pack'); assert.deepEqual(viewFor(g, 'p0').marketIntel.p2, []);
});
test('market waits for Hank to activate or skip, and skipping does not reveal cached draws', () => {
  const g = table(); for (const p of g.players.slice(1)) act(g, p.id, { type: 'exchange', indices: [] });
  assert.equal(g.phase, 'market'); assert.equal(viewFor(g, 'p0').marketIntel, null);
  act(g, 'p0', { type: 'skip-surveillance' }); assert.equal(g.phase, 'pack'); assert.equal(viewFor(g, 'p0').marketIntel, null);
  const wrong = table(); assert.throws(() => act(wrong, 'p1', { type: 'surveil' }));
});
test('Hank sees Benny’s discard crowbars as the first replacement draws', () => {
  const g = table(); g.discard = ['crowbar']; act(g, 'p0', { type: 'surveil' });
  g.deck = ['wine', 'heroin']; act(g, 'p1', { type: 'exchange', indices: [0, 1], discardCrowbars: 1 });
  assert.deepEqual(viewFor(g, 'p0').marketIntel.p1, ['crowbar', 'heroin']);
});
test('Dana selects exactly two illegal cards, the inspector chooses, and only that pair avoids fines', () => {
  const g = inspecting(); g.players[2].bag = bag(['bread', 'weed', 'heroin', 'meth', 'fish']);
  act(g, 'p0', { type: 'inspect', target: 'p2' }); assert.equal(g.pendingInspection.stage, 'dana-response');
  assert.equal(g.players[2].coins, 50); assert.equal(g.players[2].abilityUses, 0);
  assert.deepEqual(viewFor(g, 'p3').pendingInspection.cards, ['bread', 'weed', 'heroin', 'meth', 'fish']);
  assert.throws(() => act(g, 'p2', { type: 'dana-split', indices: [0, 1] }));
  assert.throws(() => act(g, 'p2', { type: 'dana-split', indices: [1, 1] }));
  act(g, 'p2', { type: 'dana-split', indices: [1, 2] }); assert.equal(abilityRemaining(g.players[2]), 1);
  assert.throws(() => act(g, 'p3', { type: 'dana-choose', index: 2 }));
  act(g, 'p0', { type: 'dana-choose', index: 2 });
  assert.deepEqual(g.players[0].stall, ['heroin']); assert.deepEqual(g.players[2].stall, ['weed', 'bread']);
  assert.deepEqual(g.discard, ['meth', 'fish']); assert.equal(g.players[2].coins, 48); // €6 remaining fines, €4 bank bonus.
  assert.equal(g.players[0].coins, 56);
});
test('Dana has two uses; declining saves a use and equal-value choices do not award a bonus', () => {
  const g = inspecting(); const dana = g.players[2]; dana.bag = bag(['weed', 'weed']);
  act(g, 'p0', { type: 'inspect', target: 'p2' }); act(g, 'p2', { type: 'dana-decline' });
  assert.equal(dana.abilityUses, 0); assert.equal(dana.coins, 42);
  for (let round = 0; round < 2; round++) {
    dana.bag = bag(['weed', 'weed']); act(g, 'p0', { type: 'inspect', target: 'p2' });
    act(g, 'p2', { type: 'dana-split', indices: [0, 1] }); act(g, 'p0', { type: 'dana-choose', index: 0 });
    assert.equal(dana.coins, 42);
  }
  assert.equal(abilityRemaining(dana), 0); dana.bag = bag(['weed', 'weed']); act(g, 'p0', { type: 'inspect', target: 'p2' });
  assert.equal(g.pendingInspection, null); assert.equal(dana.coins, 34);
});
test('Kim requires an illegal card and €15; accepting charges exactly €15 and preserves privacy', () => {
  const g = inspecting(); g.players[3].bag = bag(['bread', 'heroin'], 'bread', 1);
  g.players[3].coins = 14; assert.throws(() => act(g, 'p3', { type: 'kim' }));
  g.players[3].coins = 50; act(g, 'p3', { type: 'kim' });
  assert.equal(g.pendingInspection.stage, 'kim-offer'); assert.equal(viewFor(g, 'p1').players[3].bag.cards, null);
  assert.throws(() => act(g, 'p0', { type: 'inspect', target: 'p1' }));
  act(g, 'p0', { type: 'kim-accept' }); assert.equal(g.players[0].coins, 65); assert.equal(g.players[3].coins, 35);
  assert.deepEqual(g.players[3].stall, ['bread', 'heroin']); assert.equal(g.results[0].cards, null);
});
test('refusing Kim delivers all legal cards and pays €4 each, with illegal cards confiscated and no fine', () => {
  const g = inspecting(); g.players[3].bag = bag(['bread', 'fish', 'heroin'], 'wine', 5);
  act(g, 'p3', { type: 'kim' }); act(g, 'p0', { type: 'kim-refuse' });
  assert.equal(g.players[3].coins, 58); assert.equal(g.players[0].coins, 42);
  assert.deepEqual(g.players[3].stall, ['bread', 'fish']); assert.deepEqual(g.discard, ['heroin']);
  assert.throws(() => act(g, 'p3', { type: 'kim' }));
});
test('L’s sample is private until L shares it, preserves card count, and leaves opening up to L', () => {
  const g = inspecting(['l', 'kim', 'fring']); g.players[1].bag = bag(['heroin', 'bread']);
  act(g, 'p0', { type: 'l-peek', target: 'p1' });
  assert.ok(['heroin', 'bread'].includes(viewFor(g, 'p0').pendingInspection.sampledCard));
  assert.equal(viewFor(g, 'p1').pendingInspection.sampledCard, undefined); assert.equal(viewFor(g, 'p2').pendingInspection.sampledCard, undefined);
  assert.equal(g.players[1].bag.cards.length, 2); assert.equal(abilityRemaining(g.players[0]), 2);
  assert.throws(() => act(g, 'p1', { type: 'kim' })); assert.throws(() => act(g, 'p2', { type: 'fring', target: 'p1' }));
  assert.throws(() => act(g, 'p1', { type: 'l-share' }));
  act(g, 'p0', { type: 'l-share' }); assert.equal(viewFor(g, 'p2').pendingInspection.sampledCard, g.pendingInspection.sampledCard);
  act(g, 'p0', { type: 'l-pass' }); assert.deepEqual(g.players[1].stall, ['heroin', 'bread']);
  assert.equal(g.results[0].cards, null);
});
test('L samples at most three times, while guessing remains available without sample charges', () => {
  const g = inspecting(['l', 'benny', 'hank']);
  for (let i = 0; i < 3; i++) { g.players[1].bag = bag(['bread']); act(g, 'p0', { type: 'l-peek', target: 'p1' }); act(g, 'p0', { type: 'l-pass' }); }
  g.players[1].bag = bag(['heroin']); assert.throws(() => act(g, 'p0', { type: 'l-peek', target: 'p1' }));
  act(g, 'p0', { type: 'l-guess', target: 'p1', good: 'heroin' }); assert.equal(abilityRemaining(g.players[0]), 0);
  act(g, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(g.players[0].coins, 55);
});
test('L’s guess pays per matching illegal card only on opening, once per packet, including a Dana pause', () => {
  const g = inspecting(['l', 'dana', 'kim']); g.players[1].bag = bag(['heroin', 'heroin', 'bread']);
  act(g, 'p0', { type: 'l-guess', target: 'p1', good: 'heroin' });
  assert.throws(() => act(g, 'p0', { type: 'l-guess', target: 'p1', good: 'meth' })); assert.equal(g.players[0].coins, 50);
  act(g, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(g.players[0].coins, 52);
  act(g, 'p1', { type: 'dana-decline' }); assert.equal(g.players[0].coins, 60); // €2 guess + €8 normal fines, no duplicate reward.
  const unopened = inspecting(['l', 'hank', 'benny']); unopened.players[1].bag = bag(['heroin']);
  act(unopened, 'p0', { type: 'l-guess', target: 'p1', good: 'heroin' }); act(unopened, 'p0', { type: 'pass', target: 'p1' });
  assert.equal(unopened.players[0].coins, 50);
});
test('competing inspection abilities use first activation: L/Kira beat Dana; Kim beats L/Fring', () => {
  const g = inspecting(['l', 'dana', 'fring']); g.players[1].bag = bag(['heroin', 'meth']);
  act(g, 'p0', { type: 'l-peek', target: 'p1' }); act(g, 'p0', { type: 'l-inspect' });
  assert.equal(g.pendingInspection, null); assert.equal(g.players[1].abilityUses, 0); assert.equal(g.players[1].coins, 42);
  const kim = inspecting(['l', 'kim', 'fring']); kim.players[1].bag = bag(['heroin']); act(kim, 'p1', { type: 'kim' });
  assert.throws(() => act(kim, 'p0', { type: 'l-peek', target: 'p1' })); assert.throws(() => act(kim, 'p2', { type: 'fring', target: 'p1' }));
  const kira = inspecting(['light', 'dana', 'hank']); kira.players[1].bag = bag(['heroin', 'meth']);
  act(kira, 'p0', { type: 'kira', target: 'p1' }); assert.equal(kira.pendingInspection, null); assert.equal(kira.protections.length, 1);
});
test('100 games with all five new characters conserve all 222 cards and finish without pending-decision stalls', () => {
  for (let run = 0; run < 100; run++) {
    const g = table(); g.players.forEach(p => p.bot = true); let ticks = 0;
    while (g.phase !== 'finished' && ticks++ < 900) {
      if (g.phase === 'results') act(g, 'p0', { type: 'next' });
      else {
        let moved = false;
        for (const p of g.players) { const action = botAction(g, p.id); if (action) { act(g, p.id, action); moved = true; break; } }
        assert.ok(moved, `Stalled in ${g.phase}: ${JSON.stringify(g.pendingInspection)}`);
      }
      assert.equal(g.deck.length + g.discard.length + g.players.reduce((sum, p) => sum + p.hand.length + p.stall.length + (p.bag && !p.bag.resolved ? p.bag.cards.length : 0), 0), 222);
      assert.ok(g.players.every(p => p.coins >= 0));
    }
    assert.equal(g.phase, 'finished');
  }
});

test('L samples distinct physical positions without replacement, including duplicate types, and keeps all goods in resolution', () => {
  const g = inspecting(['l', 'benny', 'hank']); g.players[1].bag = bag(['bread', 'bread', 'heroin']);
  const originalRandom = Math.random;
  try {
    Math.random = () => 0;
    act(g, 'p0', { type: 'l-peek', target: 'p1' });
    act(g, 'p0', { type: 'l-share' });
    act(g, 'p0', { type: 'l-peek', target: 'p1' });
    assert.deepEqual(g.pendingInspection.sampledIndices, [0, 1]);
    assert.deepEqual(viewFor(g, 'p2').pendingInspection.samples, [{ card: 'bread', revealed: true }, { revealed: false }]);
    assert.equal(viewFor(g, 'p2').pendingInspection.sampledCard, undefined);
    assert.equal(viewFor(g, 'p0').pendingInspection.sampledIndices, undefined);
    act(g, 'p0', { type: 'l-peek', target: 'p1' });
    assert.deepEqual(g.pendingInspection.sampledIndices, [0, 1, 2]);
    assert.deepEqual(g.pendingInspection.samples.map(s => s.card), ['bread', 'bread', 'heroin']);
    assert.equal(abilityRemaining(g.players[0]), 0);
    act(g, 'p0', { type: 'l-inspect' });
    assert.deepEqual(g.players[1].stall, ['bread', 'bread']); assert.deepEqual(g.discard, ['heroin']); assert.equal(g.players[1].coins, 46);
  } finally { Math.random = originalRandom; }
});
test('L cannot resample an exhausted one-card packet or switch packets while reviewing', () => {
  const g = inspecting(['l', 'benny', 'hank']); g.players[1].bag = bag(['bread']);
  act(g, 'p0', { type: 'l-peek', target: 'p1' }); const before = structuredClone(g);
  assert.throws(() => act(g, 'p0', { type: 'l-peek', target: 'p1' })); assert.deepEqual(g, before);
  assert.throws(() => act(g, 'p0', { type: 'l-peek', target: 'p2' })); assert.deepEqual(g, before);
  act(g, 'p0', { type: 'l-pass' }); assert.deepEqual(g.players[1].stall, ['bread']);
});
