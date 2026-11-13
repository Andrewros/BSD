import { GOODS, CHARACTERS, scores } from './engine.js';
export const ANALYTICS_VERSION = 1;
const cardList = value => Array.isArray(value) && value.length <= 256 && value.every(key => Object.hasOwn(GOODS, key));
const number = value => Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER;
const integer = value => Number.isSafeInteger(value) && value >= 0;
const id = value => typeof value === 'string' && /^[a-zA-Z0-9:-]{1,100}$/.test(value);
const text = value => typeof value === 'string' && value.length <= 80;
function requireField(condition, message) { if (!condition) throw Error(`Invalid analytics file: ${message}`); }
export function completedGame(g) {
  if (g.phase !== 'finished' || !g.analytics) return null;
  const ranking = scores(g), best = ranking[0].total;
  return validateGame({
    schemaVersion: ANALYTICS_VERSION, id: g.analytics.id, startedAt: g.analytics.startedAt,
    finishedAt: Date.now(), rounds: g.round, practice: g.players.some(p => p.bot),
    players: g.players.map((p, seat) => {
      const row = ranking.find(row => row.id === p.id);
      return { seat, anonymousId: p.bot ? `${g.analytics.id}:bot-${seat}` : p.analyticsId || `${g.analytics.id}:seat-${seat}`, bot: p.bot, character: p.character,
        coins: row.coins, goods: row.goods, bonus: row.bonus, score: row.total, won: row.total === best,
        initialHand: g.analytics.initialHands[seat] || [], finalHand: [...p.hand], stash: [...p.stall] };
    }), packets: g.analytics.packets, events: g.analytics.events, bribes: g.analytics.bribes
  });
}
export function validateGame(raw) {
  requireField(raw && raw.schemaVersion === ANALYTICS_VERSION && id(raw.id), 'unsupported schema or game ID.');
  requireField(Number.isFinite(raw.startedAt) && raw.startedAt >= 0 && raw.startedAt < 1e14, 'invalid start time.');
  requireField(Number.isFinite(raw.finishedAt) && raw.finishedAt >= raw.startedAt && raw.finishedAt < 1e14, 'invalid finish time.');
  requireField(integer(raw.rounds) && raw.rounds <= 30, 'invalid round count.');
  requireField(Array.isArray(raw.players) && raw.players.length >= 3 && raw.players.length <= 5, 'invalid players.');
  const n = raw.players.length, seat = value => Number.isInteger(value) && value >= 0 && value < n;
  const players = raw.players.map((p, i) => {
    requireField(p.seat === i && id(p.anonymousId) && typeof p.bot === 'boolean' && Object.hasOwn(CHARACTERS, p.character), 'invalid player.');
    requireField(['coins', 'goods', 'bonus', 'score'].every(key => number(p[key]) && p[key] >= 0) && typeof p.won === 'boolean', 'invalid score.');
    requireField(p.score === p.coins + p.goods + p.bonus, 'score components do not match.');
    requireField(cardList(p.initialHand) && cardList(p.finalHand) && cardList(p.stash), 'invalid card list.');
    return { seat: i, anonymousId: p.anonymousId, bot: p.bot, character: p.character, coins: p.coins, goods: p.goods, bonus: p.bonus, score: p.score, won: p.won, initialHand: [...p.initialHand], finalHand: [...p.finalHand], stash: [...p.stash] };
  });
  requireField(players.some(p => p.won) && players.every(p => p.won === (p.score === Math.max(...players.map(p => p.score)))), 'invalid winners.');
  requireField(Array.isArray(raw.packets) && raw.packets.length <= 300, 'too many packets.');
  const packets = raw.packets.map(p => {
    requireField(integer(p.round) && p.round <= raw.rounds && seat(p.merchant) && seat(p.dea) && p.merchant !== p.dea, 'invalid packet seats.');
    requireField(Object.hasOwn(GOODS, p.declaration) && [p.declaredCards, p.effectiveCards, p.delivered].every(cardList) && p.declaredCards.length <= 5 && p.effectiveCards.length <= 5 && p.delivered.length <= 5, 'invalid packet cards.');
    requireField(['declaredHonest', 'effectiveHonest', 'opened'].every(key => typeof p[key] === 'boolean') && ['honest', 'caught', 'passed'].includes(p.outcome) && (p.ability === null || text(p.ability)) && number(p.bribeOffered), 'invalid packet outcome.');
    return { round: p.round, merchant: p.merchant, dea: p.dea, declaration: p.declaration, declaredCards: [...p.declaredCards], effectiveCards: [...p.effectiveCards], declaredHonest: p.declaredHonest, effectiveHonest: p.effectiveHonest, opened: p.opened, outcome: p.outcome, delivered: [...p.delivered], ability: p.ability, bribeOffered: p.bribeOffered };
  });
  requireField(new Set(packets.map(p => `${p.round}:${p.merchant}`)).size === packets.length, 'duplicate packet.');
  requireField(Array.isArray(raw.events) && raw.events.length <= 10000, 'too many events.');
  const events = raw.events.map(e => {
    requireField(Number.isFinite(e.at) && integer(e.round) && text(e.phase) && text(e.nextPhase) && (seat(e.actor) || e.actor === -1) && (e.target === null || seat(e.target) || e.target === -1) && /^[a-z-]{1,50}$/.test(e.type), 'invalid event.');
    requireField(cardList(e.handBefore) && cardList(e.handAfter) && Array.isArray(e.coinDeltas) && e.coinDeltas.length === n && e.coinDeltas.every(number), 'invalid event changes.');
    const details = {};
    for (const key of ['amount', 'declaration', 'good', 'indices', 'discardIndices', 'index', 'handIndex', 'discardCrowbars', 'automatic']) {
      const v = e.details?.[key]; if (v === undefined) continue;
      requireField(v === null || typeof v === 'boolean' || number(v) || (typeof v === 'string' && Object.hasOwn(GOODS, v)) || (Array.isArray(v) && v.length <= 256 && v.every(integer)), 'invalid event details.'); details[key] = structuredClone(v);
    }
    return { at: e.at, round: e.round, phase: e.phase, nextPhase: e.nextPhase, actor: e.actor, target: e.target, type: e.type, details, handBefore: [...e.handBefore], handAfter: [...e.handAfter], coinDeltas: [...e.coinDeltas] };
  });
  requireField(Array.isArray(raw.bribes) && raw.bribes.length <= 1000, 'too many bribes.');
  const bribes = raw.bribes.map(b => {
    requireField(integer(b.round) && seat(b.from) && seat(b.to) && b.from !== b.to && ['offered', 'paid', 'coins'].every(key => number(b[key]) && b[key] >= 0), 'invalid bribe.');
    return { round: b.round, from: b.from, to: b.to, offered: b.offered, paid: b.paid, coins: b.coins };
  });
  return { schemaVersion: ANALYTICS_VERSION, id: raw.id, startedAt: raw.startedAt, finishedAt: raw.finishedAt, rounds: raw.rounds, practice: players.some(p => p.bot), players, packets, events, bribes };
}
export function readImport(input) {
  requireField(input && input.schemaVersion === ANALYTICS_VERSION && Array.isArray(input.games) && input.games.length <= 5000, 'expected a version 1 game archive.');
  const games = input.games.map(validateGame);
  requireField(new Set(games.map(g => g.id)).size === games.length, 'duplicate game IDs in file.');
  return games;
}
export function exportArchive(games) { return { schemaVersion: ANALYTICS_VERSION, exportedAt: new Date().toISOString(), games: games.map(validateGame) }; }
export function playerLabel(p) { return p.bot ? `Bot · ${CHARACTERS[p.character].name}` : `Player ${(p.anonymousId.includes(':seat-') ? `${p.anonymousId.slice(0, 5)}-${p.seat + 1}` : p.anonymousId.slice(0, 8)).toUpperCase()}`; }
const rate = (a, b) => b ? a / b : 0;
export function wilsonLower(wins, n) {
  if (!n) return 0; const z = 1.96, p = wins / n;
  return (p + z*z/(2*n) - z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)) / (1+z*z/n);
}
export function summarize(games, filters = {}) {
  const selected = games.filter(g => (filters.includePractice || !g.practice) && (!filters.playerCount || g.players.length === filters.playerCount) && (!filters.from || g.finishedAt >= filters.from) && (!filters.to || g.finishedAt <= filters.to));
  const matches = p => (!filters.player || p.anonymousId === filters.player) && (!filters.character || p.character === filters.character);
  const characters = new Map(), people = new Map(), cards = new Map(); let packets = 0, bluffs = 0, opened = 0, caught = 0, passedBluffs = 0, scoreSum = 0, observations = 0, bribeCoins = 0, paidBribes = 0;
  function row(map, key, name) { if (!map.has(key)) map.set(key, { key, name, games: 0, wins: 0, score: 0, packets: 0, bluffs: 0, opened: 0, caught: 0, passedBluffs: 0 }); return map.get(key); }
  function card(key) { if (!cards.has(key)) cards.set(key, { key, name: GOODS[key].name, loaded: 0, delivered: 0, holders: 0, holderWins: 0 }); return cards.get(key); }
  for (const g of selected) {
    for (const p of g.players.filter(matches)) {
      const c = row(characters, p.character, CHARACTERS[p.character].name), person = row(people, p.anonymousId, playerLabel(p));
      for (const r of [c, person]) { r.games++; r.wins += Number(p.won); r.score += p.score; }
      scoreSum += p.score; observations++;
      for (const key of new Set(p.stash)) { const r = card(key); r.holders++; r.holderWins += Number(p.won); }
    }
    for (const p of g.packets) {
      const merchant = g.players[p.merchant]; if (!matches(merchant)) continue;
      const bluff = !p.declaredHonest, hit = p.opened && !p.effectiveHonest;
      packets++; bluffs += Number(bluff); opened += Number(p.opened); caught += Number(hit); passedBluffs += Number(bluff && !p.opened);
      for (const r of [characters.get(merchant.character), people.get(merchant.anonymousId)]) { r.packets++; r.bluffs += Number(bluff); r.opened += Number(p.opened); r.caught += Number(hit); r.passedBluffs += Number(bluff && !p.opened); }
      for (const key of p.declaredCards) card(key).loaded++;
      // A card inserted by Pete is a delivery too; denominator includes that additional exposure.
      const loaded = new Map(); for (const key of p.declaredCards) loaded.set(key, (loaded.get(key) || 0) + 1);
      const delivered = new Map(); for (const key of p.delivered) delivered.set(key, (delivered.get(key) || 0) + 1);
      for (const [key, count] of delivered) { const r = card(key); r.delivered += count; r.loaded += Math.max(0, count - (loaded.get(key) || 0)); }
    }
    for (const b of g.bribes) if (matches(g.players[b.from]) && b.paid > 0) { bribeCoins += b.coins; paidBribes++; }
  }
  const finish = map => [...map.values()].map(r => ({ ...r, winRate: rate(r.wins, r.games), averageScore: rate(r.score, r.games), bluffRate: rate(r.bluffs, r.packets), inspectionRate: rate(r.opened, r.packets), hitRate: rate(r.caught, r.opened), bluffPassRate: rate(r.passedBluffs, r.bluffs) })).sort((a, b) => b.winRate - a.winRate || b.games - a.games);
  const cardRows = [...cards.values()].map(r => ({ ...r, deliveryRate: rate(r.delivered, r.loaded), holderWinRate: rate(r.holderWins, r.holders), lowerBound: wilsonLower(r.holderWins, r.holders), expectedDeliveredValue: rate(r.delivered * GOODS[r.key].value, r.loaded) })).sort((a, b) => b.lowerBound - a.lowerBound || b.holders - a.holders);
  const qualifying = cardRows.filter(r => r.holders >= 10 && !GOODS[r.key].special);
  return { games: selected.filter(g => g.players.some(matches)).length, observations, packets, bluffs, bluffRate: rate(bluffs, packets), inspectionRate: rate(opened, packets), hitRate: rate(caught, opened), bluffPassRate: rate(passedBluffs, bluffs), averageScore: rate(scoreSum, observations), bribeCoins, paidBribes, characters: finish(characters), players: finish(people), cards: cardRows, bestCard: qualifying[0] || null };
}
export function packetsCSV(games) {
  const rows = [['game_id', 'finished_at', 'round', 'player_id', 'character', 'declaration', 'declared_cards', 'effective_cards', 'declared_honest', 'effective_honest', 'opened', 'delivered_cards', 'outcome', 'ability', 'bribe_offered']];
  for (const g of games) for (const p of g.packets) { const player = g.players[p.merchant]; rows.push([g.id, new Date(g.finishedAt).toISOString(), p.round, player.anonymousId, player.character, p.declaration, p.declaredCards.join('|'), p.effectiveCards.join('|'), p.declaredHonest, p.effectiveHonest, p.opened, p.delivered.join('|'), p.outcome, p.ability || '', p.bribeOffered]); }
  const quote = value => `"${String(value).replaceAll('"', '""')}"`;
  return rows.map(row => row.map(quote).join(',')).join('\r\n');
}
