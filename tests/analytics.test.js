import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, addPlayer, startGame, act, botAction, viewFor } from '../engine.js';
import { completedGame, validateGame, readImport, exportArchive, summarize, packetsCSV, wilsonLower } from '../analytics-core.js';
function game() {
 const g = createGame('connection-host-secret', 'Private Host Name'); addPlayer(g, 'connection-guest-secret', 'Private Guest Name'); addPlayer(g, 'connection-third-secret', 'Private Third Name');
 ['hank', 'benny', 'wendy'].forEach((character, i) => { g.players[i].character = character; g.players[i].analyticsId = `00000000-0000-4000-8000-00000000000${i}`; }); startGame(g, g.hostId); return g;
}
function finish(g) {
 g.players.forEach(p => p.bot = true); let steps = 0;
 while (g.phase !== 'finished' && steps++ < 1000) {
  if (g.phase === 'results') act(g, g.hostId, { type: 'next' });
  else { for (const p of g.players) { const action = botAction(g, p.id); if (action) { act(g, p.id, action); break; } } }
 }
 g.players.forEach(p => p.bot = false); assert.equal(g.phase, 'finished'); return g;
}
function fixture() {
 return { schemaVersion: 1, id: 'fixture-game-1', startedAt: 1000, finishedAt: 2000, rounds: 1, practice: false,
  players: ['hank','benny','wendy'].map((character, seat) => ({ seat, anonymousId: `random-player-${seat}`, bot: false, character, coins: 50, goods: seat === 1 ? 7 : 3, bonus: 0, score: seat === 1 ? 57 : 53, won: seat === 1, initialHand: ['bread'], finalHand: ['bread'], stash: seat === 1 ? ['weed'] : ['fish'] })),
  packets: [
   { round: 1, merchant: 1, dea: 0, declaration: 'bread', declaredCards: ['bread','weed'], effectiveCards: ['bread','weed'], declaredHonest: false, effectiveHonest: false, opened: false, outcome: 'passed', delivered: ['bread','weed'], ability: null, bribeOffered: 3 },
   { round: 1, merchant: 2, dea: 0, declaration: 'fish', declaredCards: ['fish'], effectiveCards: ['fish'], declaredHonest: true, effectiveHonest: true, opened: true, outcome: 'honest', delivered: ['fish'], ability: null, bribeOffered: 0 }
  ], events: [], bribes: [{ round: 1, from: 1, to: 0, offered: 3, paid: 3, coins: 3 }]
 };
}

test('live games never produce archives, and audit details stay out of every player snapshot', () => {
 const g = game(); assert.equal(completedGame(g), null); assert.ok(g.analytics.initialHands.length);
 for (const p of g.players) { const snapshot = viewFor(g, p.id); assert.equal(snapshot.analytics, undefined); assert.equal(snapshot.analyticsId, undefined); assert.ok(snapshot.players.every(p => p.analyticsId === undefined)); }
});
test('finished-game archives include packets, ground truth, actions, scores and winners, without names or credentials', () => {
 const g = finish(game()), archive = completedGame(g); assert.equal(archive.players.length, 3); assert.equal(archive.packets.length, 18); assert.ok(archive.events.length > 30); assert.equal(archive.practice, false);
 const serialized = JSON.stringify(exportArchive([archive])); assert.ok(!serialized.includes('Private Host Name')); assert.ok(!serialized.includes('connection-host-secret')); assert.ok(!serialized.includes('connection-guest-secret'));
 assert.ok(archive.players.some(p => p.won)); assert.ok(archive.players.every(p => p.score === p.coins + p.goods + p.bonus)); assert.deepEqual(readImport(JSON.parse(serialized)), [archive]);
});
test('chat content and failed actions are not recorded', () => {
 const g = game(), before = g.analytics.events.length; act(g, g.hostId, { type: 'chat', text: 'private chat message' }); assert.equal(g.analytics.events.length, before);
 assert.throws(() => act(g, g.players[1].id, { type: 'inspect', target: g.players[2].id })); assert.equal(g.analytics.events.length, before);
});
test('original false declarations are retained when Dahlia changes the remaining packet to honest', () => {
 const g = game(), p = g.players[1]; p.character = 'dahlia'; g.phase = 'declare'; p.bag = { cards: ['bread','weed'], count: 2, declaration: null, bribe: 0, resolved: false }; p.ready = false; g.players[2].bag = { cards: ['bread'], count: 1, declaration: 'bread', bribe: 0, resolved: false };
 act(g, p.id, { type: 'declare', declaration: 'bread', bribe: 0 }); g.phase = 'inspect'; act(g, g.hostId, { type: 'inspect', target: p.id }); act(g, p.id, { type: 'dahlia-remove', indices: [1] }); act(g, g.hostId, { type: 'dahlia-inspect' });
 const packet = g.analytics.packets[0]; assert.equal(packet.declaredHonest, false); assert.equal(packet.effectiveHonest, true); assert.deepEqual(packet.declaredCards, ['bread','weed']); assert.deepEqual(packet.effectiveCards, ['bread']);
});
test('bribe records distinguish offers from actually paid bribes', () => {
 const g = game(), p = g.players[1]; g.phase = 'inspect'; p.bag = { cards: ['bread'], count: 1, declaration: 'bread', bribe: 0, resolved: false }; g.players[2].bag = { cards: ['bread'], count: 1, declaration: 'bread', bribe: 0, resolved: false };
 act(g, p.id, { type: 'bribe', amount: 5 }); assert.equal(g.analytics.bribes.length, 0); act(g, g.hostId, { type: 'accept-bribe', target: p.id, expectedAmount: 5 }); assert.equal(g.analytics.bribes[0].coins, 5); assert.equal(g.analytics.bribes[0].paid, 5);
});
test('summary computes bluff, inspection, character/player win rates and card delivery rates', () => {
 const stats = summarize([validateGame(fixture())]); assert.equal(stats.games, 1); assert.equal(stats.packets, 2); assert.equal(stats.bluffRate, .5); assert.equal(stats.bluffPassRate, 1); assert.equal(stats.hitRate, 0); assert.equal(stats.inspectionRate, .5); assert.equal(stats.bribeCoins, 3);
 assert.equal(stats.characters.find(c => c.key === 'benny').winRate, 1); assert.equal(stats.players.find(p => p.key === 'random-player-1').bluffRate, 1); assert.equal(stats.cards.find(c => c.key === 'weed').deliveryRate, 1); assert.equal(stats.bestCard, null);
});
test('practice games are excluded by default, with explicit inclusion and player/character/date filters', () => {
 const a = fixture(), b = fixture(); b.id = 'fixture-game-2'; b.players[2].bot = true;
 const games = [a,b].map(validateGame); assert.equal(summarize(games).games, 1); assert.equal(summarize(games, {includePractice: true}).games, 2);
 const filtered = summarize(games, { player: 'random-player-1', character: 'benny' }); assert.equal(filtered.packets, 1); assert.equal(filtered.bluffRate, 1); assert.equal(filtered.observations, 1); assert.equal(summarize(games, {from: 3000}).games, 0); assert.equal(summarize(games, {playerCount: 4}).games, 0);
});
test('small card samples are not ranked as best, and conservative ranking has bounded confidence scores', () => {
 const games = Array.from({length:10}, (_,i) => validateGame({...fixture(),id:`fixture-${i}`})); const stats = summarize(games); assert.equal(stats.bestCard.key, 'weed'); assert.equal(stats.bestCard.holders, 10); assert.ok(wilsonLower(1,1) < wilsonLower(10,10)); assert.equal(wilsonLower(0,0), 0);
});
test('import validates all records and strips unknown identifying fields rather than saving them', () => {
 const f = fixture(); f.ip = '192.0.2.1'; f.players[0].name = 'Secret'; f.players[0].token = 'secret'; const clean = readImport({schemaVersion:1,games:[f]})[0]; assert.equal(clean.ip, undefined); assert.equal(clean.players[0].name, undefined); assert.equal(clean.players[0].token, undefined);
 for (const edit of [f=>f.players[0].score=999, f=>f.packets[0].declaredCards=['unknown'], f=>f.players[0].anonymousId='<script>', f=>f.packets.push(f.packets[0]), f=>f.events=[{type:'<script>'}]]) { const invalid=fixture(); edit(invalid); assert.throws(()=>readImport({schemaVersion:1,games:[invalid]})); }
 assert.throws(()=>readImport({schemaVersion:99,games:[]})); assert.throws(()=>readImport({schemaVersion:1,games:[fixture(),fixture()]}));
});
test('CSV exports packet-level ground truth with pseudonymous player IDs', () => {
 const csv = packetsCSV([validateGame(fixture())]); assert.ok(csv.startsWith('"game_id"')); assert.ok(csv.includes('"bread|weed"')); assert.ok(csv.includes('"random-player-1"')); assert.equal(csv.split('\r\n').length, 3);
});
