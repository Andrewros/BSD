import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS, GOODS, act, addPlayer, botAction, challengeActor, collectionProgress, createGame, inspectionBlocked, startGame, viewFor } from '../engine.js';

function lobby(characters = ['light', 'jimmy', 'fring', 'shinomiya', 'katagiri']) {
  const g = createGame('p0', 'Player 0');
  for (let i = 1; i < characters.length; i++) addPlayer(g, `p${i}`, `Player ${i}`);
  characters.forEach((character, i) => act(g, `p${i}`, { type: 'choose-character', character }));
  return g;
}
function bag(cards = ['bread'], declaration = 'bread', bribe = 0) { return { cards, count: cards.length, declaration, bribe, resolved: false }; }
function table(characters) {
  const g = lobby(characters); startGame(g, 'p0'); g.phase = 'inspect';
  g.players.forEach((p, i) => { p.coins = 50; if (i) p.bag = bag(); });
  return g;
}
function passRemaining(g) {
  for (const p of g.players.filter((p, i) => i !== g.dea && !p.bag.resolved)) act(g, g.players[g.dea].id, { type: 'pass', target: p.id });
}
test('characters are unique, private choices cannot be changed by other players, and bots may be assigned by host', () => {
  const g = createGame('p0', 'Host'); addPlayer(g, 'p1', 'Guest'); addPlayer(g, 'bot', 'Bot', true);
  act(g, 'p1', { type: 'choose-character', character: 'jimmy' });
  assert.throws(() => act(g, 'p0', { type: 'choose-character', character: 'jimmy' }));
  assert.throws(() => act(g, 'p0', { type: 'choose-character', target: 'p1', character: 'fring' }));
  assert.throws(() => act(g, 'p1', { type: 'choose-character', target: 'bot', character: 'fring' }));
  assert.throws(() => act(g, 'p0', { type: 'choose-character', character: 'invalid' }));
  act(g, 'p0', { type: 'choose-character', target: 'bot', character: 'fring' });
  startGame(g, 'p0'); assert.equal(new Set(g.players.map(p => p.character)).size, 3);
  assert.throws(() => act(g, 'p1', { type: 'choose-character', character: 'light' }));
});
test('random assignment fills five unique seats from the twenty-nine-board pool', () => {
  const g = createGame('p0', 'Host'); for (let i = 1; i < 5; i++) addPlayer(g, `p${i}`, `P${i}`);
  startGame(g, 'p0'); assert.equal(Object.keys(CHARACTERS).length, 30);
  assert.equal(new Set(g.players.map(p => p.character)).size, 5);
  assert.ok(g.players.every(p => Object.hasOwn(CHARACTERS, p.character)));
});
test('Katagiri pays every other player €10 exactly once', () => {
  const g = lobby(); startGame(g, 'p0');
  assert.equal(g.players.find(p => p.character === 'katagiri').coins, 10);
  assert.ok(g.players.filter(p => p.character !== 'katagiri').every(p => p.coins === 60));
  assert.equal(g.players.reduce((sum, p) => sum + p.coins, 0), 250);
  assert.throws(() => startGame(g, 'p0'));
});
test('Shinomiya has a pre-declaration decision; skipping preserves the once-per-game ability', () => {
  const g = table(); g.phase = 'declare';
  assert.equal(challengeActor(g), 'p3');
  assert.throws(() => act(g, 'p1', { type: 'declare', declaration: 'bread', bribe: 0 }));
  assert.throws(() => act(g, 'p1', { type: 'challenge', target: 'p2' }));
  act(g, 'p3', { type: 'skip-challenge' }); assert.equal(challengeActor(g), null); assert.equal(g.players[3].abilityUsed, false);
  act(g, 'p1', { type: 'declare', declaration: 'bread', bribe: 0 });
});
test('Shinomiya transfers the two delivered envelopes to the higher-value owner, keeping passed illegals private', () => {
  const g = table(); g.phase = 'declare'; g.players[3].bag = bag(['bread', 'wine']); g.players[1].bag = bag(['blueSky']);
  assert.throws(() => act(g, 'p3', { type: 'challenge', target: 'p0' }));
  assert.throws(() => act(g, 'p3', { type: 'challenge', target: 'p3' }));
  act(g, 'p3', { type: 'challenge', target: 'p1' }); assert.equal(g.players[3].abilityUsed, true);
  g.phase = 'inspect'; passRemaining(g);
  assert.deepEqual(g.contest.totals, [6, 10]); assert.equal(g.contest.winner, 'p1');
  assert.deepEqual(g.players[3].stall, []); assert.deepEqual(g.players[1].stall, ['blueSky', 'bread', 'wine']);
  assert.equal(viewFor(g, 'p2').results.find(r => r.name === 'Player 1').cards, null);
});
test('Shinomiya ties preserve deliveries, and Fring’s stolen cards are excluded from the opponent’s total', () => {
  const g = table(); g.phase = 'declare'; g.players[1].bag = bag(['bread', 'blueSky']);
  act(g, 'p3', { type: 'challenge', target: 'p1' }); g.phase = 'inspect';
  act(g, 'p2', { type: 'fring', target: 'p1' }); passRemaining(g);
  assert.deepEqual(g.contest.totals, [2, 2]); assert.equal(g.contest.winner, null);
  assert.deepEqual(g.players[1].stall, ['bread']); assert.deepEqual(g.players[2].stall, ['blueSky', 'bread']);
});
test('Fring steals only illegal cards, delivers all legal goods, and replaces normal inspection fines', () => {
  const g = table(); g.players[1].bag = bag(['bread', 'fish', 'heroin', 'cannabread'], 'wine', 9);
  act(g, 'p2', { type: 'fring', target: 'p1' });
  assert.deepEqual(g.players[2].stall, ['heroin', 'cannabread']); assert.deepEqual(g.players[1].stall, ['bread', 'fish']);
  assert.equal(g.players[1].coins, 50); assert.equal(g.players[2].coins, 50); assert.equal(g.players[2].abilityUsed, true);
  assert.throws(() => act(g, 'p2', { type: 'fring', target: 'p3' }));
  const honest = table(); honest.players[1].bag = bag(['wine', 'fish']); act(honest, 'p2', { type: 'fring', target: 'p1' });
  assert.equal(honest.players[2].coins, 47); assert.equal(honest.players[1].coins, 53); assert.deepEqual(honest.players[1].stall, ['wine', 'fish']);
});
test('Jimmy’s accepted offer charges €3 per illegal card, ignores the earlier bribe, and does not reveal contents', () => {
  const g = table(); g.players[1].bag = bag(['bread', 'heroin', 'cannabread'], 'bread', 20);
  act(g, 'p1', { type: 'jimmy' }); assert.equal(g.pendingInspection.stage, 'jimmy-offer');
  const publicPending = viewFor(g, 'p2').pendingInspection;
  assert.deepEqual(Object.keys(publicPending).sort(), ['inspector', 'stage', 'target']);
  assert.equal(viewFor(g, 'p2').players[1].bag.cards, null);
  assert.throws(() => act(g, 'p2', { type: 'jimmy-accept' }));
  assert.throws(() => act(g, 'p0', { type: 'pass', target: 'p3' }));
  act(g, 'p1', { type: 'bribe', amount: 0 }); // Ordinary offers stay editable during fixed ability decisions.
  assert.equal(g.players[1].bag.bribe, 0);
  act(g, 'p0', { type: 'jimmy-accept' }); assert.equal(g.players[1].coins, 44); assert.equal(g.players[0].coins, 56);
  assert.deepEqual(g.players[1].stall, ['bread', 'heroin', 'cannabread']); assert.equal(g.results[0].cards, null);
});
test('opening Jimmy’s envelope pays €3 per ordinary legal card and confiscates all illegal cards without fines', () => {
  const g = table(); g.players[1].bag = bag(['bread', 'fish', 'heroin', 'cannabread'], 'wine', 10);
  act(g, 'p1', { type: 'jimmy' }); act(g, 'p0', { type: 'jimmy-refuse' });
  assert.equal(g.players[1].coins, 56); assert.equal(g.players[0].coins, 44);
  assert.deepEqual(g.players[1].stall, ['bread', 'fish']); assert.deepEqual(g.discard, ['heroin', 'cannabread']);
  assert.equal(g.players[1].abilityUsed, true);
});
test('ordinary inspection resolves immediately and Jimmy cannot activate after it is chosen', () => {
  const g = table(); g.players[1].bag = bag(['heroin']); act(g, 'p0', { type: 'inspect', target: 'p1' });
  assert.equal(g.pendingInspection, null); assert.equal(g.players[1].bag.resolved, true);
  assert.equal(g.players[1].coins, 46); assert.equal(g.players[1].abilityUsed, false);
  assert.throws(() => act(g, 'p1', { type: 'jimmy' }));
  assert.throws(() => act(g, 'p1', { type: 'jimmy-use' }));
  const honest = table(); act(honest, 'p0', { type: 'inspect', target: 'p1' });
  assert.equal(honest.pendingInspection, null); assert.equal(honest.players[1].coins, 52);
});
test('Jimmy and Fring priority is first valid activation before ordinary inspection', () => {
  const jimmyFirst = table(); jimmyFirst.players[1].bag = bag(['heroin']);
  act(jimmyFirst, 'p1', { type: 'jimmy' }); assert.throws(() => act(jimmyFirst, 'p2', { type: 'fring', target: 'p1' }));
  assert.equal(jimmyFirst.players[2].abilityUsed, false);
  const fringFirst = table(); fringFirst.players[1].bag = bag(['heroin']);
  act(fringFirst, 'p2', { type: 'fring', target: 'p1' });
  assert.equal(fringFirst.pendingInspection, null); assert.equal(fringFirst.players[1].abilityUsed, false);
  assert.throws(() => act(fringFirst, 'p1', { type: 'jimmy' })); assert.deepEqual(fringFirst.players[2].stall, ['heroin']);
});
test('an unaffordable Jimmy offer preserves his unused ability and lets the ordinary inspection continue', () => {
  const g = table(); g.players[1].bag = bag(['heroin', 'cannabread']); g.players[1].coins = 5;
  assert.throws(() => act(g, 'p1', { type: 'jimmy' }));
  assert.equal(g.pendingInspection, null); assert.equal(g.players[1].abilityUsed, false);
  act(g, 'p0', { type: 'inspect', target: 'p1' });
  assert.equal(g.players[1].bag.resolved, true); assert.equal(g.pendingInspection, null); assert.equal(g.players[1].abilityUsed, false);
});
test('Katagiri needs four ordinary legal categories plus any illegal; completion is permanent and privately tracked', () => {
  const g = table(), kat = g.players[4]; kat.stall = ['cannabread', 'fish', 'meat', 'wine'];
  act(g, 'p4', { type: 'chat', text: 'Not complete yet' }); assert.equal(kat.collectionComplete, false);
  kat.stall.push('bread'); act(g, 'p4', { type: 'chat', text: 'Complete!' }); assert.equal(kat.collectionComplete, true);
  assert.deepEqual(collectionProgress(kat), ['bread', 'fish', 'meat', 'wine', 'illegal']);
  assert.equal(viewFor(g, 'p0').players[4].collection, null); assert.equal(viewFor(g, 'p4').players[4].collection.length, 5);
  kat.stall = []; act(g, 'p4', { type: 'chat', text: 'Still unlocked' }); assert.equal(kat.collectionComplete, true);
});
test('Katagiri doubles only illegal-card fines until completing the set', () => {
  const g = table(); g.players[4].bag = bag(['fish', 'crowbar', 'cannabread']);
  act(g, 'p0', { type: 'inspect', target: 'p4' }); assert.equal(g.players[4].coins, 50 - 2 - 8 - 6);
  const unlocked = table(); unlocked.players[4].collectionComplete = true; unlocked.players[4].bag = bag(['fish', 'crowbar']);
  act(unlocked, 'p0', { type: 'inspect', target: 'p4' }); assert.equal(unlocked.players[4].coins, 44);
});
test('Katagiri can complete his collection on delivery before losing that delivery to Shinomiya', () => {
  const g = table(); g.phase = 'declare'; g.players[4].stall = ['bread', 'fish', 'meat', 'wine'];
  g.players[4].bag = bag(['crowbar']); g.players[3].bag = bag(['blueSky']);
  act(g, 'p3', { type: 'challenge', target: 'p4' }); g.phase = 'inspect';
  for (const id of ['p1', 'p2', 'p3', 'p4']) act(g, 'p0', { type: 'pass', target: id });
  assert.equal(g.contest.winner, 'p3'); assert.equal(g.players[4].collectionComplete, true);
  assert.ok(!g.players[4].stall.includes('crowbar')); assert.ok(g.players[3].stall.includes('crowbar'));
});
test('Katagiri receives the end-game payment once, before final scoring', () => {
  const g = table(); g.players[4].collectionComplete = true; g.phase = 'results'; g.round = 10;
  act(g, 'p0', { type: 'next' }); assert.equal(g.phase, 'finished'); assert.equal(g.players[4].coins, 130);
  assert.ok(g.players.slice(0, 4).every(p => p.coins === 30));
  assert.equal(viewFor(g, 'p4').scores.find(r => r.id === 'p4').coins, 130);
  assert.throws(() => act(g, 'p0', { type: 'next' })); assert.equal(g.players[4].coins, 130);
});
test('Kira’s Judgement blocks inspection on exactly the rival’s next D.E.A. turn', () => {
  const g = table(); g.players[3].bag = bag(['heroin']); act(g, 'p0', { type: 'kira', target: 'p3' });
  assert.deepEqual(g.protections, [{ lightId: 'p0', agentId: 'p3', round: 4 }]);
  assert.equal(g.players[0].abilityUsed, true); assert.throws(() => act(g, 'p0', { type: 'kira', target: 'p2' }));
  g.round = 4; g.dea = 3; g.phase = 'inspect'; g.players[0].bag = bag(['heroin']);
  assert.equal(inspectionBlocked(g, 'p3', 'p0'), true);
  assert.throws(() => act(g, 'p3', { type: 'inspect', target: 'p0' }));
  act(g, 'p3', { type: 'pass', target: 'p0' }); assert.deepEqual(g.players[0].stall, ['heroin']);
  g.phase = 'results'; act(g, 'p0', { type: 'next' }); assert.equal(g.protections.length, 0);
});
test('Kira awards €20 only for a lie with no future rival turn; an honest packet gets normal compensation', () => {
  const g = table(['fring', 'shinomiya', 'jimmy', 'katagiri', 'light']); g.dea = 4; g.round = 10;
  g.players[0].bag = bag();
  g.players[1].bag = bag(['heroin']); act(g, 'p4', { type: 'kira', target: 'p1' }); assert.equal(g.players[4].coins, 74);
  const honest = table(); act(honest, 'p0', { type: 'kira', target: 'p3' });
  assert.equal(honest.players[0].coins, 48); assert.equal(honest.protections.length, 0); assert.equal(honest.players[0].abilityUsed, true);
});
test('Kira accounts for the third DEA rotation in a three-player game', () => {
  const g = table(['light', 'fring', 'jimmy']); g.round = 7;
  g.players[2].bag = bag(['heroin']); act(g, 'p0', { type: 'kira', target: 'p2' });
  assert.deepEqual(g.protections, [{ lightId: 'p0', agentId: 'p2', round: 9 }]);
  assert.equal(g.players[0].coins, 54);
});
test('Kira resolves immediately against Jimmy; a Jimmy offer activated first blocks Kira', () => {
  const kiraFirst = table(); kiraFirst.players[1].bag = bag(['bread', 'heroin']);
  act(kiraFirst, 'p0', { type: 'kira', target: 'p1' });
  assert.equal(kiraFirst.pendingInspection, null); assert.equal(kiraFirst.players[1].bag.resolved, true);
  assert.equal(kiraFirst.protections.length, 1); assert.throws(() => act(kiraFirst, 'p1', { type: 'jimmy' }));
  const jimmyFirst = table(); jimmyFirst.players[1].bag = bag(['bread', 'heroin']);
  act(jimmyFirst, 'p1', { type: 'jimmy' });
  assert.throws(() => act(jimmyFirst, 'p0', { type: 'kira', target: 'p1' }));
  assert.equal(jimmyFirst.players[0].abilityUsed, false);
  act(jimmyFirst, 'p0', { type: 'jimmy-refuse' }); assert.equal(jimmyFirst.protections.length, 0);
});
test('200 full bot games with characters finish without losing cards or stalling on ability responses', () => {
  for (let run = 0; run < 200; run++) {
    const count = 3 + run % 3, g = createGame('p0', 'Host'); g.players[0].bot = true;
    for (let i = 1; i < count; i++) addPlayer(g, `p${i}`, `Bot ${i}`, true);
    startGame(g, 'p0'); let tick = 0;
    while (g.phase !== 'finished' && tick++ < 800) {
      if (g.phase === 'results' && !g.piperOffers?.length) act(g, 'p0', { type: 'next' });
      else {
        let moved = false;
        for (const p of g.players) { const action = botAction(g, p.id); if (action) { act(g, p.id, action); moved = true; break; } }
        assert.ok(moved, `Stalled in ${g.phase} with ${JSON.stringify(g.pendingInspection)}`);
      }
      const cards = g.deck.length + g.discard.length + g.players.reduce((total, p) => total + p.hand.length + p.stall.length + (p.bag && !p.bag.resolved ? p.bag.cards.length : 0), 0);
      assert.equal(cards + (g.retired?.length || 0), g.cardTotal); assert.ok(g.players.every(p => p.coins >= 0));
    }
    assert.equal(g.phase, 'finished'); assert.equal(viewFor(g, 'p0').scores.length, count);
  }
});
