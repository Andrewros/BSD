import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS, GOODS, abilityRemaining, act, addPlayer, botAction, cardValueFor, createGame, penaltyFor, scores, startGame, viewFor } from '../engine.js';

function table(roles = ['zach', 'heisenberg', 'junior', 'selena', 'wendy']) {
  const g = createGame('p0', 'P0');
  for (let i = 1; i < roles.length; i++) addPlayer(g, `p${i}`, `P${i}`);
  roles.forEach((character, i) => act(g, `p${i}`, { type: 'choose-character', character }));
  startGame(g, 'p0'); return g;
}
const bag = (cards, declaration = 'bread', bribe = 0) => ({ cards, count: cards.length, declaration, bribe, resolved: false });
function inspecting(roles) {
  const g = table(roles); g.phase = 'inspect';
  g.players.forEach((p, i) => { p.coins = 50; if (i) p.bag = bag(['bread']); }); return g;
}

test('all twenty-nine character boards can be claimed in the lobby, including the new five', () => {
  const g = createGame('host', 'Host');
  assert.equal(Object.keys(CHARACTERS).length, 30);
  for (const character of Object.keys(CHARACTERS)) {
    act(g, 'host', { type: 'choose-character', character }); assert.equal(g.players[0].character, character);
  }
  for (const [character, uses] of [['zach', 1], ['heisenberg', 1], ['junior', 2], ['selena', 3], ['wendy', null]]) {
    act(g, 'host', { type: 'choose-character', character }); assert.equal(abilityRemaining(g.players[0]), uses);
  }
});
test('Heisenberg scores Meth at €10 and Blue Sky at €13 only while those cards are his', () => {
  const g = createGame('host', 'Heisenberg'); addPlayer(g, 'a', 'A'); addPlayer(g, 'b', 'B');
  act(g, 'host', { type: 'choose-character', character: 'heisenberg' });
  act(g, 'a', { type: 'choose-character', character: 'benny' });
  act(g, 'b', { type: 'choose-character', character: 'hank' });
  startGame(g, 'host');
  const heisenberg = g.players[0], other = g.players[1];
  heisenberg.stall = ['meth', 'blueSky', 'methambreadamine', 'methMignon'];
  assert.equal(cardValueFor(heisenberg, 'meth'), 10); assert.equal(cardValueFor(heisenberg, 'blueSky'), 13);
  assert.equal(cardValueFor(other, 'meth'), 8); assert.equal(GOODS.meth.value, 8);
  assert.equal(scores(g).find(r => r.id === 'host').goods, 38);
  heisenberg.stall = []; other.stall = ['meth', 'blueSky'];
  assert.equal(scores(g).find(r => r.id === 'a').goods, 18);
});
test('Zach steals entirely legal envelopes regardless of declaration and voids ordinary payments', () => {
  const g = inspecting(); g.players[1].bag = bag(['bread', 'fish', 'wine'], 'meat', 9);
  act(g, 'p0', { type: 'zach', target: 'p1' });
  assert.deepEqual(g.players[0].stall, ['bread', 'fish', 'wine']); assert.deepEqual(g.players[1].stall, []);
  assert.equal(g.players[0].coins, 50); assert.equal(g.players[1].coins, 50); assert.deepEqual(g.players[1].bag.delivered, []);
  assert.throws(() => act(g, 'p0', { type: 'zach', target: 'p2' }));
});
test('Zach lets the entire envelope through when any illegal card is present', () => {
  const g = inspecting(); g.players[1].bag = bag(['bread', 'meth'], 'bread', 9);
  act(g, 'p0', { type: 'zach', target: 'p1' });
  assert.deepEqual(g.players[1].stall, ['bread', 'meth']); assert.deepEqual(g.players[0].stall, []);
  assert.equal(g.players[1].coins, 50); assert.equal(g.players[3].coins, 50); assert.equal(g.pendingInspection, null);
});
test('Junior has two special inspections: legal packets earn €8 and all packets stay with their owners', () => {
  const g = inspecting(); g.dea = 2; g.round = 3; g.players[2].bag = null;
  for (let i = 0; i < 2; i++) {
    g.players[0].bag = bag(['fish', 'wine'], 'bread', 5); act(g, 'p2', { type: 'junior', target: 'p0' });
  }
  assert.equal(g.players[2].coins, 66); assert.equal(g.players[0].coins, 50); assert.equal(abilityRemaining(g.players[2]), 0);
  g.players[0].bag = bag(['bread']); assert.throws(() => act(g, 'p2', { type: 'junior', target: 'p0' }));
  const illegal = inspecting(['junior', 'heisenberg', 'selena']); illegal.players[1].bag = bag(['meth', 'fish'], 'bread', 10);
  act(illegal, 'p0', { type: 'junior', target: 'p1' });
  assert.deepEqual(illegal.players[1].stall, ['meth', 'fish']); assert.equal(illegal.players[0].coins, 50); assert.equal(illegal.players[1].coins, 50);
});
test('Heisenberg’s response follows inspection choice, keeps cards sealed, and declining preserves the ability', () => {
  const g = inspecting(); g.players[1].bag = bag(['meth']);
  assert.throws(() => act(g, 'p1', { type: 'heisenberg-use' }));
  act(g, 'p0', { type: 'inspect', target: 'p1' }); assert.equal(g.pendingInspection.stage, 'heisenberg-response');
  assert.equal(g.players[1].coins, 50); assert.equal(g.players[1].abilityUsed, false);
  assert.equal(viewFor(g, 'p2').players[1].bag.cards, null); assert.equal(viewFor(g, 'p2').pendingInspection.cards, undefined);
  act(g, 'p1', { type: 'heisenberg-decline' }); assert.equal(g.players[1].coins, 46); assert.equal(g.players[1].abilityUsed, false);
});
test('Say My Name doubles dishonest fines and pays €5 on backing down without paying the earlier bribe', () => {
  const g = inspecting(); g.players[1].bag = bag(['bread', 'meth', 'fish'], 'bread', 10);
  act(g, 'p0', { type: 'inspect', target: 'p1' }); act(g, 'p1', { type: 'heisenberg-use' });
  assert.equal(g.players[1].abilityUsed, true); act(g, 'p0', { type: 'heisenberg-inspect' });
  assert.equal(g.players[1].coins, 38); assert.equal(g.players[0].coins, 62); assert.deepEqual(g.players[1].stall, ['bread']);
  const pass = inspecting(); pass.players[1].bag = bag(['meth'], 'bread', 10);
  act(pass, 'p0', { type: 'inspect', target: 'p1' }); act(pass, 'p1', { type: 'heisenberg-use' }); act(pass, 'p0', { type: 'heisenberg-backdown' });
  assert.equal(pass.players[1].coins, 55); assert.equal(pass.players[0].coins, 50); assert.equal(pass.players[3].coins, 50);
  assert.deepEqual(pass.players[1].stall, ['meth']); assert.equal(pass.results[0].cards, null);
});
test('Selena can cover doubled honest compensation from the bank after its exact amount is known', () => {
  const g = inspecting(['selena', 'heisenberg', 'wendy']); g.players[1].bag = bag(['bread', 'bread']);
  act(g, 'p0', { type: 'inspect', target: 'p1' }); act(g, 'p1', { type: 'heisenberg-use' }); act(g, 'p0', { type: 'heisenberg-inspect' });
  assert.equal(g.pendingInspection.stage, 'selena-fine'); assert.equal(g.pendingInspection.amount, 8);
  assert.equal(viewFor(g, 'p2').pendingInspection.outcome, undefined); assert.equal(g.players[0].coins, 50); assert.equal(g.players[1].coins, 50);
  assert.throws(() => act(g, 'p1', { type: 'selena-bank' })); act(g, 'p0', { type: 'selena-bank' });
  assert.equal(g.players[0].coins, 50); assert.equal(g.players[1].coins, 58); assert.equal(abilityRemaining(g.players[0]), 2);
  assert.throws(() => act(g, 'p0', { type: 'selena-bank' }));
});
test('Selena gets three bank payments and may save uses by paying a fine herself', () => {
  const g = inspecting(), selena = g.players[3];
  selena.bag = bag(['heroin']); act(g, 'p0', { type: 'inspect', target: 'p3' }); act(g, 'p3', { type: 'selena-pay' });
  assert.equal(selena.coins, 46); assert.equal(abilityRemaining(selena), 3);
  for (let i = 0; i < 3; i++) {
    selena.bag = bag(['heroin']); act(g, 'p0', { type: 'inspect', target: 'p3' }); act(g, 'p3', { type: 'selena-bank' });
  }
  assert.equal(selena.coins, 46); assert.equal(abilityRemaining(selena), 0);
  selena.bag = bag(['heroin']); act(g, 'p0', { type: 'inspect', target: 'p3' }); assert.equal(g.pendingInspection, null); assert.equal(selena.coins, 42);
});
test('Selena’s passive triggers once for a positive paid bribe between others, never offers, zero bribes, or her own bribe', () => {
  const g = inspecting();
  act(g, 'p2', { type: 'bribe', amount: 2 }); act(g, 'p2', { type: 'bribe', amount: 3 }); assert.equal(g.players[3].coins, 50);
  act(g, 'p0', { type: 'pass', target: 'p2' }); assert.equal(g.players[3].coins, 51);
  act(g, 'p0', { type: 'pass', target: 'p1' }); assert.equal(g.players[3].coins, 51);
  g.players[3].bag.bribe = 7; act(g, 'p0', { type: 'pass', target: 'p3' }); assert.equal(g.players[3].coins, 44);
});
test('Selena recognizes paid Jimmy/Kim bribes, and can cover a special inspection compensation fine', () => {
  for (const character of ['jimmy', 'kim']) {
    const g = inspecting(['zach', character, 'selena']); g.players[1].bag = bag(['bread', 'heroin']);
    act(g, 'p1', { type: character }); act(g, 'p0', { type: `${character}-accept` }); assert.equal(g.players[2].coins, 51);
  }
  const fine = inspecting(['selena', 'kim', 'wendy']); fine.players[1].bag = bag(['bread', 'heroin']);
  act(fine, 'p1', { type: 'kim' }); act(fine, 'p0', { type: 'kim-refuse' }); assert.equal(fine.pendingInspection.amount, 4);
  act(fine, 'p0', { type: 'selena-bank' }); assert.equal(fine.players[0].coins, 50); assert.equal(fine.players[1].coins, 54);
});
test('Wendy’s Meth and Blue Sky draw directly into the stash without chaining; bonus identities are private', () => {
  const g = inspecting(); g.players[4].bag = bag(['meth', 'blueSky']); g.deck = ['wine', 'meth', 'blueSky']; g.discard = ['bread'];
  act(g, 'p0', { type: 'pass', target: 'p4' });
  assert.deepEqual(g.players[4].stall, ['meth', 'blueSky', 'blueSky', 'meth', 'wine']); assert.deepEqual(g.deck, []); assert.deepEqual(g.discard, ['bread']);
  assert.deepEqual(viewFor(g, 'p4').players[4].bonusCards, ['blueSky', 'meth', 'wine']); assert.equal(viewFor(g, 'p0').players[4].bonusCards, null);
  assert.deepEqual(g.players[4].bag.delivered, ['meth', 'blueSky']); assert.equal(g.results[0].cards, null);
});
test('Wendy’s Meth fine is zero but the card stays illegal and is confiscated; Blue Sky and mixed cards retain fines', () => {
  const g = inspecting(); const wendy = g.players[4]; wendy.bag = bag(['meth', 'blueSky', 'methambreadamine', 'methMignon', 'herowine']);
  assert.equal(penaltyFor(wendy, 'meth'), 0); assert.equal(penaltyFor(wendy, 'blueSky'), 6);
  act(g, 'p0', { type: 'inspect', target: 'p4' }); assert.equal(wendy.coins, 31); assert.equal(g.discard.length, 5);
  assert.deepEqual(wendy.stall, []); assert.deepEqual(wendy.bonusDraws, []);
});
test('Wendy’s draw bonus stops when the deck and discard pile are empty', () => {
  const g = inspecting(); g.players[4].bag = bag(['blueSky']); g.deck = []; g.discard = ['meth'];
  act(g, 'p0', { type: 'pass', target: 'p4' }); assert.deepEqual(g.players[4].bonusDraws, ['meth']);
  assert.deepEqual(g.players[4].stall, ['blueSky', 'meth']); assert.equal(g.discard.length, 0);
});
test('competing abilities honor first activation around Heisenberg’s response', () => {
  const g = inspecting(['selena', 'heisenberg', 'fring']); g.players[1].bag = bag(['meth']);
  act(g, 'p0', { type: 'inspect', target: 'p1' }); act(g, 'p2', { type: 'fring', target: 'p1' });
  assert.equal(g.players[1].abilityUsed, false); assert.deepEqual(g.players[2].stall, ['meth']);
  const challenge = inspecting(['selena', 'heisenberg', 'fring']); challenge.players[1].bag = bag(['meth']);
  act(challenge, 'p0', { type: 'inspect', target: 'p1' }); act(challenge, 'p1', { type: 'heisenberg-use' });
  assert.throws(() => act(challenge, 'p2', { type: 'fring', target: 'p1' }));
  const kira = inspecting(['light', 'heisenberg', 'selena']); kira.players[1].bag = bag(['meth']);
  act(kira, 'p0', { type: 'kira', target: 'p1' }); assert.equal(kira.pendingInspection, null); assert.equal(kira.players[1].abilityUsed, false);
});
test('100 games with the newest five characters conserve all 222 cards through bonuses, challenges, and bank payments', () => {
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
