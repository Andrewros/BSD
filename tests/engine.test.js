import test from 'node:test';
import assert from 'node:assert/strict';
import { GOODS, LEGAL, CATALOG_SIZE, majorityCount, createGame, addPlayer, startGame as startWithCharacters, act, viewFor, scores, botAction, deaTurnsPerPlayer, totalRounds } from '../engine.js';

// Baseline rule tests isolate ordinary gameplay from character passives.
function startGame(g, actor) {
  // Keep the ordinary-deal fixture deterministic; special starting hands are tested separately.
  g.players.forEach((p, i) => p.character = ['benny', 'wendy', 'raughn', 'hank', 'steve'][i]);
  startWithCharacters(g, actor);
  for (const p of g.players) { p.character = null; p.coins = 50; }
}

function table() {
  const g = createGame('host', 'Robin'); addPlayer(g, 'alice', 'Alice'); addPlayer(g, 'bob', 'Bob'); return g;
}
function inspection(cards, declaration = 'bread', bribe = 0) {
  const g = table(); startGame(g, 'host'); g.phase = 'inspect';
  g.players[1].bag = { cards, declaration, count: cards.length, bribe, resolved: false };
  g.players[2].bag = { cards: ['bread'], declaration: 'bread', count: 1, bribe: 0, resolved: false };
  return g;
}
test('all 17 card types match the photographed quantities, values, and penalties', () => {
  const expected = {
    bread: [48, 2, 2], fish: [36, 3, 2], meat: [36, 3, 2], wine: [24, 4, 2],
    crowbar: [22, 6, 4], weed: [20, 7, 4], meth: [12, 8, 4], heroin: [6, 9, 4],
    cannabread: [2, 4, 3], methambreadamine: [2, 6, 4], reeferFish: [2, 6, 4], needleFish: [1, 9, 5],
    highSteaks: [2, 6, 4], methMignon: [1, 9, 5], herowine: [2, 8, 4], blueSky: [3, 10, 6], burnerPhone: [3, 10, 6]
  };
  assert.equal(CATALOG_SIZE, 222); assert.equal(Object.values(GOODS).filter(good => !good.special).length, 17);
  assert.deepEqual(LEGAL, ['bread', 'fish', 'meat', 'wine']);
  const g = table(); startGame(g, 'host'); const deck = [...g.deck, ...g.players.flatMap(p => p.hand)];
  for (const [key, [count, value, penalty]] of Object.entries(expected)) {
    assert.deepEqual([GOODS[key].count, GOODS[key].value, GOODS[key].penalty], [count, value, penalty], key);
    assert.equal(deck.filter(c => c === key).length, count, `${key} is included in the playable deck`);
  }
  assert.deepEqual(LEGAL.map(k => [GOODS[k].king, GOODS[k].queen]), [[20, 10], [15, 10], [15, 10], [10, 5]]);
});
test('every mixed card is illegal even when declared as its matching legal good', () => {
  for (const [key, good] of Object.entries(GOODS).filter(([, good]) => good.majority)) {
    const g = inspection([good.majority, key], good.majority);
    act(g, 'host', { type: 'inspect', target: 'alice' });
    assert.deepEqual(g.players[1].stall, [good.majority], key);
    assert.deepEqual(g.discard, [key]); assert.equal(g.players[1].coins, 50 - good.penalty);
    assert.equal(g.results[0].kind, 'caught');
  }
});
test('mixed cards count twice for matching majority bonuses, but keep their printed score values', () => {
  const g = table();
  g.players[0].stall = ['cannabread', 'methambreadamine'];
  g.players[1].stall = ['bread', 'bread', 'bread'];
  assert.equal(majorityCount(g.players[0].stall, 'bread'), 4);
  const rows = scores(g), host = rows.find(r => r.id === 'host'), alice = rows.find(r => r.id === 'alice');
  assert.equal(host.bonus, 20); assert.equal(host.goods, 10); assert.equal(host.total, 80);
  assert.equal(alice.bonus, 10); assert.deepEqual(host.awards, ['Kingpin of Bread']);
  for (const [key, good] of Object.entries(GOODS).filter(([, good]) => good.majority)) {
    for (const legal of LEGAL) assert.equal(majorityCount([key], legal), legal === good.majority ? 2 : 0);
  }
  const view = viewFor(g, 'alice'); assert.deepEqual(view.players[0].stall, []); assert.equal(view.players[0].contrabandCount, 2);
});
test('Blue Sky and Burner Phone use ordinary illegal-goods inspection and scoring', () => {
  for (const key of ['blueSky', 'burnerPhone']) {
    const g = inspection([key]); act(g, 'host', { type: 'inspect', target: 'alice' });
    assert.equal(g.players[1].coins, 44); assert.deepEqual(g.discard, [key]);
    const pass = inspection([key], 'wine', 0); act(pass, 'host', { type: 'pass', target: 'alice' });
    const row = scores(pass).find(r => r.id === 'alice'); assert.equal(row.goods, 10); assert.equal(row.bonus, 0);
  }
});
test('lobby capacity, host authorization, and initial deal', () => {
  const g = createGame('host', 'Robin'); assert.throws(() => startGame(g, 'host'));
  addPlayer(g, 'a', 'A'); addPlayer(g, 'b', 'B'); assert.throws(() => startGame(g, 'a'));
  addPlayer(g, 'c', 'C'); addPlayer(g, 'd', 'D'); assert.throws(() => addPlayer(g, 'e', 'E'));
  startGame(g, 'host'); assert.equal(g.round, 1); assert.equal(g.phase, 'market');
  assert.ok(g.players.every(p => p.hand.length === 6 && p.coins === 50));
  assert.equal(g.deck.length + 30, 222); assert.throws(() => addPlayer(g, 'f', 'F'));
});
test('market validates unique card indices and locks completed exchanges', () => {
  const g = table(); startGame(g, 'host');
  assert.throws(() => act(g, 'host', { type: 'exchange', indices: [] }));
  for (const indices of [[1, 1], [-1], [6], ['1'], [0, 1, 2, 3, 4, 5]]) assert.throws(() => act(g, 'alice', { type: 'exchange', indices }));
  act(g, 'alice', { type: 'exchange', indices: [0, 2] }); assert.equal(g.players[1].hand.length, 6);
  assert.throws(() => act(g, 'alice', { type: 'exchange', indices: [] }));
  act(g, 'bob', { type: 'exchange', indices: [] }); assert.equal(g.phase, 'pack');
  assert.equal(g.players[1].ready, false);
});
test('loading and declaration are separate phases with locked contents and validated offers', () => {
  const g = table(); startGame(g, 'host'); g.phase = 'pack';
  assert.throws(() => act(g, 'alice', { type: 'pack', indices: [] }));
  assert.throws(() => act(g, 'alice', { type: 'declare', declaration: 'bread', bribe: 0 }));
  act(g, 'alice', { type: 'pack', indices: [0, 1] });
  assert.equal(g.players[1].hand.length, 4); assert.equal(g.phase, 'pack');
  assert.equal(g.players[1].bag.declaration, null);
  assert.throws(() => act(g, 'alice', { type: 'pack', indices: [0] }));
  act(g, 'bob', { type: 'pack', indices: [0] }); assert.equal(g.phase, 'declare');
  const contents = [...g.players[1].bag.cards];
  for (const action of [
    { indices: [0], declaration: 'meth', bribe: 0 },
    { indices: [0], declaration: 'bread', bribe: 51 },
    { indices: [0], declaration: 'bread', bribe: -1 },
    { indices: [0], declaration: 'bread', bribe: 1.1 }
  ]) assert.throws(() => act(g, 'alice', { type: 'declare', ...action }));
  act(g, 'alice', { type: 'declare', declaration: 'bread', bribe: 3 });
  assert.deepEqual(g.players[1].bag.cards, contents);
  assert.throws(() => act(g, 'alice', { type: 'declare', declaration: 'fish', bribe: 0 }));
  act(g, 'bob', { type: 'declare', declaration: 'meat', bribe: 0 }); assert.equal(g.phase, 'inspect');
});
test('honest bag receives compensation from DEA without paying bribe', () => {
  const g = inspection(['bread', 'bread'], 'bread', 8);
  act(g, 'host', { type: 'inspect', target: 'alice' });
  assert.equal(g.players[0].coins, 46); assert.equal(g.players[1].coins, 54);
  assert.deepEqual(g.players[1].stall, ['bread', 'bread']); assert.equal(g.results[0].kind, 'honest');
});
test('dishonest inspection confiscates all undeclared goods, including legal goods', () => {
  const g = inspection(['bread', 'fish', 'meth'], 'bread', 8);
  act(g, 'host', { type: 'inspect', target: 'alice' });
  assert.equal(g.players[0].coins, 56); assert.equal(g.players[1].coins, 44);
  assert.deepEqual(g.players[1].stall, ['bread']); assert.deepEqual(g.discard, ['fish', 'meth']);
  assert.deepEqual(g.results[0].cards, ['bread', 'fish', 'meth']);
});
test('unopened bag pays current bribe and keeps contraband private', () => {
  const g = inspection(['heroin', 'meth'], 'wine', 2);
  act(g, 'alice', { type: 'bribe', amount: 7 });
  act(g, 'host', { type: 'pass', target: 'alice' });
  assert.equal(g.players[0].coins, 57); assert.equal(g.players[1].coins, 43);
  assert.deepEqual(g.players[1].stall, ['heroin', 'meth']);
  assert.equal(g.results[0].cards, null);
  assert.throws(() => act(g, 'alice', { type: 'bribe', amount: 9 }));
  assert.throws(() => act(g, 'host', { type: 'pass', target: 'alice' }));
  act(g, 'host', { type: 'pass', target: 'bob' }); assert.equal(g.phase, 'results');
});
test('host authority does not permit inspecting unless host is the DEA', () => {
  const g = inspection(['meth']); g.dea = 2;
  assert.throws(() => act(g, 'host', { type: 'inspect', target: 'alice' }));
  assert.throws(() => act(g, 'alice', { type: 'inspect', target: 'alice' }));
  assert.throws(() => act(g, 'bob', { type: 'inspect', target: 'bob' }));
});
test('private snapshots do not expose deck, other hands, bag contents or hidden goods', () => {
  const g = inspection(['meth', 'heroin']); g.players[1].stall = ['meth', 'bread'];
  const view = viewFor(g, 'bob');
  assert.equal(view.deck, undefined); assert.equal(view.discard, undefined);
  assert.equal(view.players[1].hand, null); assert.equal(view.players[1].bag.cards, null);
  assert.deepEqual(view.players[1].stall, ['bread']); assert.equal(view.players[1].contrabandCount, 1);
  assert.ok(view.players[2].hand.length); assert.equal(view.scores, null);
  const own = viewFor(g, 'alice'); assert.deepEqual(own.players[1].bag.cards, ['meth', 'heroin']);
  own.players[1].hand.push('fake'); assert.ok(!g.players[1].hand.includes('fake'));
});
test('insufficient coins surrender goods without creating negative balances', () => {
  const g = inspection(['meth', 'heroin']);
  g.players[1].coins = 1; g.players[1].stall = ['bread', 'wine', 'meat'];
  act(g, 'host', { type: 'inspect', target: 'alice' });
  assert.equal(g.players[1].coins, 0); assert.equal(g.players[0].coins, 51);
  assert.deepEqual(g.players[0].stall, ['bread', 'wine', 'meat']); assert.deepEqual(g.players[1].stall, []);
  const broke = inspection(['heroin']); broke.players[1].coins = 0;
  act(broke, 'host', { type: 'inspect', target: 'alice' }); assert.equal(broke.players[1].coins, 0);
});
test('majority bonuses: sole king, tied queens, tied kings, and zero counts', () => {
  const g = table(); g.players[0].stall = ['bread', 'bread', 'bread']; g.players[1].stall = ['bread']; g.players[2].stall = ['bread'];
  let r = scores(g); assert.equal(r.find(r => r.id === 'host').bonus, 20); assert.equal(r.find(r => r.id === 'alice').bonus, 5);
  g.players[0].stall = ['bread']; r = scores(g); assert.ok(r.every(r => r.bonus === 10));
  g.players.forEach(p => p.stall = []); assert.ok(scores(g).every(r => r.bonus === 0));
  g.players[0].stall = ['wine']; g.players[1].stall = ['wine']; r = scores(g);
  assert.equal(r.find(r => r.id === 'host').bonus, 7); assert.equal(r.find(r => r.id === 'bob').bonus, 0);
});
test('round advance restricted to host, refills hands and rotates DEA', () => {
  const g = inspection(['bread']); act(g, 'host', { type: 'pass', target: 'alice' }); act(g, 'host', { type: 'pass', target: 'bob' });
  assert.throws(() => act(g, 'alice', { type: 'next' })); act(g, 'host', { type: 'next' });
  assert.equal(g.round, 2); assert.equal(g.dea, 1); assert.equal(g.phase, 'market'); assert.ok(g.players.every(p => p.hand.length === 6 && !p.bag));
});
test('game length gives each player three DEA turns at three players and two at four or five', () => {
  assert.equal(deaTurnsPerPlayer(2), 3);
  for (const [count, expected] of [[3, 9], [4, 8], [5, 10]]) {
    const g = createGame('host', 'Host');
    for (let i = 1; i < count; i++) addPlayer(g, `p${i}`, `P${i}`);
    startGame(g, 'host'); const turns = Array(count).fill(0);
    assert.equal(totalRounds(g), expected); assert.equal(viewFor(g, 'host').totalRounds, expected);
    while (g.phase !== 'finished') { turns[g.dea]++; g.phase = 'results'; act(g, 'host', { type: 'next' }); }
    assert.equal(g.round, expected); assert.ok(turns.every(n => n === (count <= 3 ? 3 : 2)));
  }
});
test('chat is bounded and actions from unknown players are rejected', () => {
  const g = table(); for (let i = 0; i < 65; i++) act(g, 'host', { type: 'chat', text: 'x'.repeat(300) });
  assert.equal(g.chat.length, 60); assert.equal(g.chat[0].text.length, 240);
  assert.throws(() => act(g, 'unknown', { type: 'chat', text: 'hello' }));
});
test('100 full bot games conserve every card, finish, and reveal final scores', () => {
  for (let run = 0; run < 100; run++) {
    const count = 3 + run % 3, g = createGame('host', 'Host'); g.players[0].bot = true;
    for (let i = 1; i < count; i++) addPlayer(g, `bot-${i}`, `Bot ${i}`, true);
    startGame(g, 'host'); let ticks = 0;
    while (g.phase !== 'finished' && ticks++ < 500) {
      if (g.phase === 'results' && !g.piperOffers?.length) act(g, 'host', { type: 'next' });
      else {
        let progressed = false;
        for (const p of g.players) { const a = botAction(g, p.id); if (a) { act(g, p.id, a); progressed = true; break; } }
        assert.ok(progressed, `Game stalled in ${g.phase}`);
      }
      const total = g.deck.length + g.discard.length + g.players.reduce((n, p) => n + p.hand.length + p.stall.length + (p.bag && !p.bag.resolved ? p.bag.cards.length : 0), 0);
      assert.equal(total + (g.retired?.length || 0), g.cardTotal); assert.ok(g.players.every(p => p.coins >= 0));
    }
    assert.equal(g.phase, 'finished'); assert.equal(g.round, count * deaTurnsPerPlayer(count));
    assert.equal(viewFor(g, 'host').scores.length, count);
    assert.ok(scores(g).every(r => Number.isFinite(r.total)));
  }
});
