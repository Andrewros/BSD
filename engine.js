// Pure game rules. Only the room host keeps this state; peers receive viewFor().
export const GOODS = {
  bread: { name: 'Bread', icon: '🍞', value: 2, penalty: 2, count: 48, king: 20, queen: 10, legal: true },
  fish: { name: 'Fish', icon: '🐟', value: 3, penalty: 2, count: 36, king: 15, queen: 10, legal: true },
  meat: { name: 'Meat', icon: '🍖', value: 3, penalty: 2, count: 36, king: 15, queen: 10, legal: true },
  wine: { name: 'Wine', icon: '🍷', value: 4, penalty: 2, count: 24, king: 10, queen: 5, legal: true },
  crowbar: { name: 'Crowbar', icon: '🔧', value: 6, penalty: 4, count: 22 },
  weed: { name: 'Weed', icon: '🌿', value: 7, penalty: 4, count: 20 },
  meth: { name: 'Meth', icon: '🧊', value: 8, penalty: 4, count: 12 },
  heroin: { name: 'Heroin', icon: '💉', value: 9, penalty: 4, count: 6 },
  cannabread: { majority: 'bread', majorityWeight: 2, name: 'Cannabread', icon: '🍞', value: 4, penalty: 3, count: 2, category: 'mixed' },
  methambreadamine: { majority: 'bread', majorityWeight: 2, name: 'Methambreadamine', icon: '🍞', value: 6, penalty: 4, count: 2, category: 'mixed' },
  reeferFish: { majority: 'fish', majorityWeight: 2, name: 'Reefer Fish', icon: '🐟', value: 6, penalty: 4, count: 2, category: 'mixed' },
  needleFish: { majority: 'fish', majorityWeight: 2, name: 'Needle Fish', icon: '💉', value: 9, penalty: 5, count: 1, category: 'mixed' },
  highSteaks: { majority: 'meat', majorityWeight: 2, name: 'High Steaks', icon: '🍖', value: 6, penalty: 4, count: 2, category: 'mixed' },
  methMignon: { majority: 'meat', majorityWeight: 2, name: 'Meth Mignon', icon: '🍖', value: 9, penalty: 5, count: 1, category: 'mixed' },
  herowine: { majority: 'wine', majorityWeight: 2, name: 'Herowine', icon: '🍷', value: 8, penalty: 4, count: 2, category: 'mixed' },
  blueSky: { name: 'Blue Sky', icon: '💎', value: 10, penalty: 6, count: 3, category: 'extra' },
  burnerPhone: { name: 'Burner Phone', icon: '📱', value: 10, penalty: 6, count: 3, category: 'extra' },
  chiliPowder: { name: 'Chili Powder', icon: '🌶️', value: 0, penalty: 0, count: 0, category: 'special', special: true },
  usedNeedle: { name: 'Used Needle', icon: '💉', value: 0, penalty: 0, count: 0, category: 'special', special: true }
};
export const LEGAL = Object.keys(GOODS).filter(k => GOODS[k].legal);
export const PLAYABLE = Object.keys(GOODS).filter(key => !GOODS[key].special);
export const CATALOG_SIZE = Object.values(GOODS).reduce((n, good) => n + good.count, 0);
export function deaTurnsPerPlayer(playerCount) { return playerCount <= 3 ? 3 : 2; }
export function totalRounds(g) { return g.players.length * deaTurnsPerPlayer(g.players.length); }
export const CHARACTERS = {
  shinomiya: { name: 'Sinister Shinomiya', ability: 'Because I’m a genius', timing: 'Before declarations · Once per game', description: 'When you are not the D.E.A., challenge another smuggler after envelopes are loaded. At round end, compare the printed values of goods delivered from your two envelopes. The higher total wins both deliveries. A tie changes nothing.' },
  katagiri: { name: 'Killer Katagiri', ability: 'The Devil Himself', timing: 'Start / end of game · Passive', description: 'Pay each other player €10 at the start. Collect ordinary Bread, Fish, Meat, Wine, and any illegal card to complete your set. Until then, your illegal-card fines are doubled. Completing the set unlocks a €20 payment from every other player at game end.' },
  fring: { name: 'Fearsome Fring', ability: 'The Boss Man', timing: 'Inspection · Once per game', description: 'When you are not the D.E.A., take over one other smuggler’s inspection. Steal their illegal cards. If every card is legal, pay the smuggler €3 instead.' },
  jimmy: { name: 'Slippin’ Jimmy', ability: 'Better Call Saul', timing: 'Before inspection is chosen · Once per game', description: 'Before the D.E.A. chooses to inspect your envelope, click the ability to offer a choice: open it, pay you €3 per ordinary legal card, and confiscate the illegals; or let it pass and receive €3 per illegal card from you. No normal inspection fines apply. Jimmy and Fring cannot both act on the same envelope.' },
  light: { name: 'Lawful Light', ability: 'Kira’s Judgement', timing: 'As D.E.A., before opening an envelope · Once per game', description: 'Announce “I’m Kira” and inspect an envelope. If its owner lied, they cannot inspect you on their next D.E.A. turn. If they have no D.E.A. turn left, take €20 from the bank. An honest envelope receives the normal compensation.' },
  benny: { name: 'Bootleg Benny', ability: 'Back-Alley Bargain', timing: 'Collection unlock · Market passive', uses: null, description: 'After delivering three crowbars to your stash, crowbars become legal for you: you may declare them and their penalty becomes €2. During the market, you may draw crowbars from the discard pile instead of the deck.' },
  dana: { name: 'Duplicity Dana²', ability: 'Split Decision', timing: 'Caught with at least two illegal goods · Twice per game', uses: 2, description: 'When caught with at least two illegal cards, split two with the D.E.A.: one for them and one for you, avoiding fines on those two cards. You receive no compensation for legal cards. If the D.E.A. takes the higher-value card, take €4 from the bank.' },
  hank: { name: 'Hardline Hank', ability: 'Shrader Surveillance', timing: 'Each D.E.A. market phase', uses: null, description: 'When you are the D.E.A., look at the first two cards each smuggler draws during the market phase.' },
  kim: { name: 'Criminal Defender Kim', ability: 'Legal Loophole', timing: 'After declaring, before inspection · Once per game', description: 'With at least one illegal card, offer a €15 bribe for your pro bono case. If refused, the D.E.A. must open the envelope and pay you €4 per legal card. You pay no illegal-card fines.' },
  l: { name: 'L', ability: 'Master Detective', timing: 'As D.E.A. · Three uses per game', uses: 3, description: 'Sample a random unseen card from a packet without replacement, spending one of your three uses. You may sample it again while uses and unseen cards remain, then inspect or pass. Sampled goods still count in the final inspection or delivery. Nobody may force you to open it. Once per envelope, guess an illegal card type before inspecting; an opened envelope earns €1 per matching illegal card. The sample is private unless you choose to reveal it.' },
  zach: { name: 'Zach Star Himself', ability: 'What the fuck is this?', timing: 'As D.E.A. · Once per game', description: 'Inspect an envelope with your special declaration. If every card is legal, steal the entire envelope. If any card is illegal, its owner keeps every card.' },
  heisenberg: { name: 'Heistmaster Heisenberg', ability: 'Say My Name', timing: 'After inspection is chosen · Once per game', description: 'After the D.E.A. chooses to inspect, click to challenge before cards are revealed. If the D.E.A. backs down, take €5 from the bank. If they inspect, the loser pays double. Passive: Meth in your stash is worth €2 extra, and Blue Sky is worth €3 extra.' },
  junior: { name: 'Judgemental Junior', ability: 'This is Bullshit', timing: 'As D.E.A. · Twice per game', uses: 2, description: 'Announce your special inspection. If every card is legal, take €8 from the bank and pay no compensation. If any card is illegal, the owner keeps all goods and owes you nothing.' },
  selena: { name: 'Safecracker Selena', ability: 'Vault Venture', timing: 'When a fine is owed · Three uses per game', uses: 3, description: 'Pay a fine with money stolen from the bank, up to three times per game. Passive: whenever two other players pay a bribe, take €1 from the bank.' },
  wendy: { name: 'Windy Wendy', ability: 'Meth Madness', timing: 'Smuggled Meth / Blue Sky · Passive', uses: null, description: 'Each Meth card smuggled past the D.E.A. adds one card from the deck to your stash. Each Blue Sky adds two. Bonus cards do not trigger further draws. Only ordinary Meth has no fine; it is still illegal and can be confiscated.' },
  raughn: { name: 'Resident Advisor Raughn', ability: 'Room Inspection', timing: 'While D.E.A. · Passive', uses: null, description: 'While you are the D.E.A., each illegal card found adds €2 to its fine. Wine is illegal during your D.E.A. turn.' },
  peteBadger: { name: 'Skinny Pete & Badger', ability: 'Skinny Pete’s Swap / Badger’s Bailout', timing: 'After inspection · One use of each ability', uses: null, description: 'Pete may swap one delivered card with a hand card after an honest inspection. Badger may pay €10 to the bank to keep a caught envelope after paying its fine. Each illegal card held at game end adds €1 to your score.' },
  hector: { name: 'Hellbell Hector', ability: 'Salamanca Money', timing: 'As D.E.A., before returning an envelope · Twice per game', uses: 2, description: 'Click “This is personal!” while holding a declared packet to mark its owner and immediately pass it unopened. If that player inspects you on their next D.E.A. turn, they owe you €5.' },
  trump: { name: 'Tariff Trump', ability: 'Executive Order', timing: 'After delivering 3+ illegal cards · Once per game', description: 'After smuggling at least three illegal cards in one envelope, collect a tariff per illegal card from every other player: €2 each, or €1 with five or more players. Passive: an honest inspected envelope of at least three cards earns €3 from the bank.' },
  rick: { name: 'Ransack Rick', ability: 'Dumpster Dive', timing: 'Market phase · Once per game', description: 'Privately swap three hand cards for three cards from the discard pile during the market. Start the game with €5 extra.' },
  dahlia: { name: 'Deceptive Dahlia', ability: 'Smoke and Mirrors', timing: 'After inspection is chosen · Twice per game', uses: 2, description: 'After an ordinary inspection is chosen, secretly remove 1–4 packet cards, leaving at least one. The D.E.A. may continue or cancel. Removed cards are revealed only after that decision; honesty uses the remaining packet.' },
  steve: { name: 'Stoner Steve', ability: 'Blunt Force Strategy', timing: 'End-game reward / Weed protection · Passive', uses: null, description: 'At game end, collect €3 per illegal card in your stash, or €6 for ordinary Weed instead. Caught ordinary Weed costs half its normal fine and returns to your hand.' },
  mike: { name: 'Manhandler Mike', ability: 'No Half Measures', timing: 'After finding illegal goods · Once per game', description: 'After finding illegal goods as D.E.A., choose to double the normal total fine once per game. Passive: your first honest inspection costs no compensation.' },
  timothy: { name: 'Tattletale Timothy', ability: 'Rat’s Gambit', timing: 'Before opening another player’s packet · Twice per game', uses: 2, description: 'While not D.E.A., force an inspection of another smuggler. If they lied, take €12 from the bank and split the collected fine with the D.E.A. If honest, split their compensation with the D.E.A.' },
  carl: { name: 'Corrupt Cop Carl', ability: 'Shady Inspection / Framed by the Badge', timing: 'After opening · One use of each ability', uses: null, description: 'Once per game as D.E.A., steal one caught illegal card while its fine still applies. Separately, once per game after an honest inspection, discard an illegal card from your hand to frame the owner and cancel compensation; no fine is charged on that added card.' },
  pinkman: { name: 'Chili Powder Pinkman', ability: 'It’s the bomb yo!', timing: 'Chili Powder delivery · Passive', uses: null, description: 'Start with Chili Powder instead of your sixth card. Pass it unopened to earn €10 from the bank and return it to your hand. If caught, it leaves the game permanently. Other illegal goods cost €1 less each in fines.' },
  nile: { name: 'Needlestick Nile', ability: 'Sharp Business', timing: 'Choose a needle while loading · Two needles per game', uses: null, description: 'Start with two extra Used Needles. Load at most one per packet, within the five-card limit. Needles count as honest legal cards, regardless of declaration. Inspection makes the inspector pay you €8 in addition to normal payments; passing costs you €4. A used needle always leaves the game.' },
  tuco: { name: 'Temperamental Tuco', ability: 'Tight! Tight! Tight!', timing: 'Contraband scoring / fines · Passive', uses: null, description: 'Illegal goods held score 1.5× their combined printed value, rounded up once. When caught, pay 1.5× the combined normal red fines for illegal cards, rounded down once. Legal mismatches retain their ordinary fine.' },
  piper: { name: 'Pickpocket Piper', ability: 'Thief in the Night', timing: 'After another pair pays a bribe · Twice per game', uses: 2, description: 'Start with €10 extra. After a positive bribe between two other players is paid, you have 20 seconds to steal half the payment, rounded up. The recipient keeps the rest. Skipping or timing out saves the use.' }


};
export function abilityRemaining(p) {
  if (!p.character || CHARACTERS[p.character]?.uses === null) return null;
  return Math.max(0, (CHARACTERS[p.character]?.uses || 1) - (p.abilityUses || (p.abilityUsed ? 1 : 0)));
}
function useAbility(p) {
  p.abilityUses = (p.abilityUses || 0) + 1;
  p.abilityUsed = abilityRemaining(p) === 0;
}
export function isLegalFor(p, key, g = null) {
  if (key === 'usedNeedle') return true;
  if (g?.players[g.dea]?.character === 'raughn' && key === 'wine') return false;
  if (!g && p?.legalGoods) return p.legalGoods.includes(key);
  return !!GOODS[key]?.legal || (key === 'crowbar' && p?.character === 'benny' && !!p.crowbarsUnlocked);
}
export function legalGoodsFor(p, g = null) { return PLAYABLE.filter(key => isLegalFor(p, key, g)); }
export function penaltyFor(p, key, g = null) {
  if (GOODS[key].special) return 0;
  if (p?.character === 'wendy' && key === 'meth') return 0;
  const base = key === 'crowbar' && isLegalFor(p, key, g) ? 2 : GOODS[key].penalty;
  const raughn = g?.players[g.dea]?.character === 'raughn' || (!g && p?.raughnInspection);
  const fine = base + (raughn && !isLegalFor(p, key, g) ? 2 : 0);
  if (p?.character === 'pinkman' && !isLegalFor(p, key, g)) return Math.max(0, fine - 1);
  return p?.character === 'steve' && key === 'weed' ? Math.ceil(fine / 2) : fine;
}
export function cardValueFor(p, key) {
  return GOODS[key].value + (p?.character === 'heisenberg' ? key === 'meth' ? 2 : key === 'blueSky' ? 3 : 0 : 0);
}
export function shuffle(cards) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
export function createGame(hostId, name) {
  return { hostId, phase: 'lobby', round: 0, dea: 0, players: [player(hostId, name)], deck: [], discard: [], log: [], chat: [], results: [], revision: 0, contest: null, protections: [], pendingInspection: null, finalAbilitiesSettled: false, marketDraws: {} };
}
function player(id, name, bot = false) {
  return { id, name: cleanName(name), bot, online: true, coins: 50, hand: [], stall: [], bag: null, ready: false, character: null, abilityUsed: false, abilityUses: 0, collectionComplete: false, challengeDecisionRound: 0, crowbarsUnlocked: false, hankDecisionRound: 0, surveillanceRound: 0, bonusDraws: [] };
}
function cleanName(name) {
  if (typeof name !== 'string' || !name.trim()) throw Error('Enter a smuggler name.');
  return name.trim().slice(0, 18);
}
export function addPlayer(g, id, name, bot = false) {
  if (g.players.some(p => p.id === id)) return;
  if (g.phase !== 'lobby') throw Error('This game has already started.');
  if (g.players.length >= 5) throw Error('This table is full.');
  g.players.push(player(id, name, bot));
}
export function removePlayer(g, id) {
  if (g.phase !== 'lobby' || id === g.hostId) throw Error('Players can only be removed in the lobby.');
  g.players = g.players.filter(p => p.id !== id);
}
export function startGame(g, actor) {
  if (actor !== g.hostId || g.phase !== 'lobby') throw Error('Only the host can start a new game.');
  if (g.players.length < 3 || g.players.some(p => !p.online)) throw Error('You need 3–5 connected players. Add practice bots to fill the table.');
  const available = shuffle(Object.keys(CHARACTERS).filter(key => !g.players.some(p => p.character === key)));
  for (const p of g.players) if (!p.character) p.character = available.pop();
  const rick = g.players.find(p => p.character === 'rick');
  if (rick) { rick.coins += 5; note(g, `${rick.name} scavenged an extra €5 for Ransack Rick.`); }
  const piper = g.players.find(p => p.character === 'piper');
  if (piper) { piper.coins += 10; note(g, `${piper.name} starts with an extra €10 from the bank.`); }
  const katagiri = g.players.find(p => p.character === 'katagiri');
  if (katagiri) {
    for (const p of g.players) if (p !== katagiri) { katagiri.coins -= 10; p.coins += 10; }
    note(g, `${katagiri.name} (Killer Katagiri) paid every other player €10.`);
  }
  g.deck = shuffle(PLAYABLE.flatMap(key => Array(GOODS[key].count).fill(key)));
  g.retired = []; g.piperOffers = []; g.cardTotal = CATALOG_SIZE;
  for (const p of g.players) { draw(g, p, p.character === 'pinkman' ? 5 : 6); if (p.character === 'pinkman') { p.hand.push('chiliPowder'); g.cardTotal++; } if (p.character === 'nile') { p.hand.push('usedNeedle', 'usedNeedle'); g.cardTotal += 2; } }
  g.analytics = { id: crypto.randomUUID(), startedAt: Date.now(), initialHands: g.players.map(p => [...p.hand]), packets: [], events: [], bribes: [] };
  g.round = 1;
  newRound(g);
}
function draw(g, p, n) {
  const drawn = [];
  for (let i = 0; i < n; i++) {
    if (!g.deck.length) g.deck = shuffle(g.discard.splice(0));
    if (g.deck.length) { const card = g.deck.pop(); p.hand.push(card); drawn.push(card); }
  }
  return drawn;
}
function discardCards(g, cards) { g.discard.push(...cards); }
function payNeedleInspection(g, inspector, merchant) {
  if (!merchant.bag.cards.includes('usedNeedle') || merchant.bag.needlePaid) return;
  merchant.bag.needlePaid = true; payment(inspector, merchant, 8);
  note(g, `${inspector.name} paid ${merchant.name} €8 for the Used Needle, in addition to normal inspection payments.`);
}
function settleSpecialCards(g, merchant, result, delivered) {
  if (merchant.bag.specialSettled) return delivered.filter(key => !GOODS[key].special);
  merchant.bag.specialSettled = true;
  const special = merchant.bag.cards.filter(key => GOODS[key].special);
  if (!special.length) return delivered;
  const opened = result.cards !== null;
  if (special.includes('usedNeedle')) {
    const inspector = g.players.find(p => p.id === merchant.bag.actualInspector) || g.players[g.dea];
    if (opened) payNeedleInspection(g, inspector, merchant);
    else { payment(merchant, g.players[g.dea], 4); note(g, `${merchant.name} paid €4 for passing a Used Needle. This is separate from the bribe.`); }
    (g.retired ||= []).push('usedNeedle'); result.message += ' The Used Needle left the game.';
  }
  if (special.includes('chiliPowder')) {
    if (!opened && delivered.includes('chiliPowder') && merchant.character === 'pinkman') {
      merchant.coins += 10; merchant.hand.push('chiliPowder'); result.message += ' Chili Powder earned €10 and returned to Pinkman’s hand.';
    } else { (g.retired ||= []).push('chiliPowder'); result.message += ' Caught Chili Powder left the game permanently.'; }
  }
  for (const p of g.players) p.stall = p.stall.filter(key => !special.includes(key));
  g.discard = g.discard.filter(key => !special.includes(key));
  return delivered.filter(key => !GOODS[key].special);
}
function resolvePiper(g, p, action) {
  const offer = g.piperOffers?.find(offer => offer.id === action.offer && offer.piper === p.id);
  if (!offer || p.character !== 'piper') throw Error('That bribe opportunity is no longer available.');
  if (action.type === 'piper-use') {
    if (!abilityRemaining(p)) throw Error('Thief in the Night has no uses remaining.');
    useAbility(p); p.coins += offer.share; note(g, `${p.name} stole €${offer.share} from the accepted €${offer.amount} bribe.`);
  } else g.players.find(other => other.id === offer.to).coins += offer.share;
  g.piperOffers = g.piperOffers.filter(other => other !== offer);
  if (!abilityRemaining(p)) {
    for (const remaining of g.piperOffers) g.players.find(other => other.id === remaining.to).coins += remaining.share;
    g.piperOffers = [];
  }
}
export const TRIGGER_WINDOW_MS = 20000;
const TRIGGER_SKIPS = {
  'heisenberg-response': 'heisenberg-decline', 'dahlia-response': 'dahlia-skip',
  'dana-response': 'dana-decline', 'pete-response': 'pete-skip', 'badger-response': 'badger-skip',
  'mike-response': 'mike-skip', 'carl-response': 'carl-skip', 'selena-fine': 'selena-pay', 'trump-response': 'trump-skip'
};
function syncTriggerDeadline(g, now = Date.now()) {
  const pending = g.pendingInspection;
  if (!pending) return;
  if (!TRIGGER_SKIPS[pending.stage]) { delete pending.expiresAt; delete pending.timerStage; return; }
  if (pending.timerStage !== pending.stage || !pending.expiresAt) { pending.timerStage = pending.stage; pending.expiresAt = now + TRIGGER_WINDOW_MS; }
}
export function expireAbilities(g, now = Date.now()) {
  let changed = false;
  for (const offer of [...(g.piperOffers || [])]) if (offer.expiresAt <= now) {
    const piper = g.players.find(p => p.id === offer.piper), before = analyticsBefore(g, piper.id); resolvePiper(g, piper, { type: 'piper-skip', offer: offer.id }); recordAnalyticsAction(g, piper.id, { type: 'piper-skip', automatic: true }, before); changed = true;
    note(g, 'Piper’s opportunity expired. The held bribe share went to its original recipient.');
  }
  const pending = g.pendingInspection, skip = pending && TRIGGER_SKIPS[pending.stage];
  if (skip && pending.expiresAt <= now) {
    const actor = pending.stage === 'selena-fine' ? pending.payer : ['mike-response', 'carl-response'].includes(pending.stage) ? pending.inspector : pending.target;
    note(g, 'The 20-second triggered ability window expired; the unused ability was saved.');
    const before = analyticsBefore(g, actor);
    applyAction(g, actor, { type: skip }); recordAnalyticsAction(g, actor, { type: skip, automatic: true }, before); syncTriggerDeadline(g, now); changed = true;
  }
  return changed;
}

function matchesDeclaration(p, key, g) { return key === 'usedNeedle' || (key === p.bag.declaration && isLegalFor(p, key, g)); }
function newRound(g) {
  g.phase = 'market'; g.results = []; g.contest = null; g.marketDraws = {};
  g.protections = g.protections.filter(protection => protection.round >= g.round);
  for (const p of g.players) { p.ready = false; p.bag = null; p.bribeOffer = 0; p.bonusDraws = []; draw(g, p, 6 - p.hand.filter(key => key !== 'usedNeedle').length); }
  note(g, `${g.players[g.dea].name} is the D.E.A. Market is open.`);
}
function note(g, message) { g.log.push(message); g.log = g.log.slice(-60); }
function merchants(g) { return g.players.filter((_, i) => i !== g.dea); }
function selection(p, indices, min, max) {
  if (!Array.isArray(indices) || indices.length < min || indices.length > max || new Set(indices).size !== indices.length || indices.some(i => !Number.isInteger(i) || i < 0 || i >= p.hand.length)) throw Error(`Select ${min}–${max} cards.`);
  return indices.map(i => p.hand[i]);
}
function take(p, indices) { p.hand = p.hand.filter((_, i) => !indices.includes(i)); }
function payment(from, to, amount) {
  // Inability to pay: surrender stall goods at face value, with no change.
  const coins = Math.min(from.coins, amount);
  from.coins -= coins; to.coins += coins;
  let remaining = amount - coins, paid = coins;
  while (remaining > 0 && from.stall.length) {
    const card = from.stall.shift(); to.stall.push(card); remaining -= GOODS[card].value; paid += GOODS[card].value;
  }
  return paid;
}
function bribePayment(g, from, to, amount) {
  const coinPayment = Math.min(from.coins, amount), paid = payment(from, to, amount);
  const selena = g.players.find(p => p.character === 'selena' && p !== from && p !== to);
  if (g.analytics) g.analytics.bribes.push({ round: g.round, from: g.players.indexOf(from), to: g.players.indexOf(to), offered: amount, paid, coins: coinPayment });
  const piper = g.players.find(p => p.character === 'piper' && p !== from && p !== to && abilityRemaining(p));
  if (piper && coinPayment > 0) {
    const share = Math.ceil(coinPayment / 2); to.coins -= share;
    (g.piperOffers ||= []).push({ id: `${g.round}-${g.revision}-${g.piperSequence = (g.piperSequence || 0) + 1}`, piper: piper.id, from: from.id, to: to.id, amount: coinPayment, share, expiresAt: Date.now() + TRIGGER_WINDOW_MS });
    note(g, `${piper.name} has 20 seconds to claim €${share} from the €${coinPayment} bribe. That share is held until the choice resolves.`);
  }
  if (paid > 0 && selena) { selena.coins++; note(g, `${selena.name} stole €1 from the bank after a paid bribe between two other players.`); }
}
export function challengeActor(g) {
  if (g.phase !== 'declare') return null;
  return merchants(g).find(p => p.character === 'shinomiya' && !p.abilityUsed && p.challengeDecisionRound !== g.round)?.id || null;
}
export function inspectionBlocked(g, inspectorId, targetId) {
  return (g.protections || []).some(p => p.round === g.round && p.agentId === inspectorId && p.lightId === targetId);
}
function settleContest(g) {
  if (!g.contest || g.contest.resolved) return;
  const a = g.players.find(p => p.id === g.contest.challenger), b = g.players.find(p => p.id === g.contest.target);
  const value = p => (p.bag?.delivered || []).reduce((n, key) => n + GOODS[key].value, 0);
  const aValue = value(a), bValue = value(b);
  g.contest.totals = [aValue, bValue]; g.contest.resolved = true;
  if (aValue === bValue) { g.contest.winner = null; note(g, `Shinomiya’s contest tied at €${aValue}. Both smugglers keep their goods.`); return; }
  const winner = aValue > bValue ? a : b, loser = winner === a ? b : a;
  g.contest.winner = winner.id;
  // Goods already surrendered for debts cannot be transferred a second time.
  for (const key of loser.bag?.delivered || []) {
    const index = loser.stall.indexOf(key);
    if (index >= 0) { loser.stall.splice(index, 1); winner.stall.push(key); }
  }
  note(g, `${winner.name} won Shinomiya’s contest (€${Math.max(aValue, bValue)} to €${Math.min(aValue, bValue)}) and claimed ${loser.name}’s delivered goods.`);
}
function resolveEnvelope(g, merchant, result, delivered) {
  delivered = settleSpecialCards(g, merchant, result, delivered);
  if (g.analytics) {
    const declaredCards = merchant.bag.declaredCards || merchant.bag.cards;
    g.analytics.packets.push({ round: g.round, merchant: g.players.indexOf(merchant), dea: g.dea, declaration: merchant.bag.declaration, declaredCards: [...declaredCards], effectiveCards: [...merchant.bag.cards], declaredHonest: merchant.bag.declaredHonest ?? declaredCards.every(key => matchesDeclaration(merchant, key, g)), effectiveHonest: merchant.bag.cards.every(key => matchesDeclaration(merchant, key, g)), opened: result.cards !== null, outcome: result.kind, delivered: [...delivered], ability: merchant.bag.abilityClaim || null, bribeOffered: merchant.bag.bribe });
  }
  merchant.bag.deaRequest = null;
  merchant.bag.delivered = [...delivered]; merchant.bag.resolved = true;
  awardWendyDraws(g, merchant, delivered);
  g.results.push(result); note(g, `${merchant.name}: ${result.message}`);
  updateCollections(g);
  const illegalCount = delivered.filter(key => !isLegalFor(merchant, key, g)).length;
  if (merchant.character === 'trump' && !merchant.abilityUsed && illegalCount >= 3) {
    g.pendingInspection = { stage: 'trump-response', target: merchant.id, inspector: g.players[g.dea].id, count: illegalCount }; return;
  }
  finishInspections(g);
}
const NEGOTIABLE_STAGES = ['heisenberg-response', 'dahlia-response', 'dahlia-choice', 'l-review'];
function requestTarget(g, id) {
  if (g.phase !== 'inspect') throw Error('Request bribes during the inspection phase.');
  const target = merchants(g).find(p => p.id === id && p.bag && !p.bag.resolved);
  if (!target) throw Error('Choose an unresolved smuggler’s packet.');
  if (g.pendingInspection?.target === target.id && !NEGOTIABLE_STAGES.includes(g.pendingInspection.stage)) throw Error('That packet has already been opened or claimed by another ability.');
  return target;
}
function handleBribeRequest(g, p, action) {
  const inspector = g.players[g.dea];
  if (action.type === 'request-bribe') {
    if (p !== inspector) throw Error('Only the D.E.A. can request a bribe.');
    const target = requestTarget(g, action.target);
    if (action.amount === null) { target.bag.deaRequest = null; note(g, `${p.name} withdrew the bribe request for ${target.name}.`); return; }
    if (!Number.isSafeInteger(action.amount) || action.amount < 0) throw Error('Request a nonnegative whole number of coins.');
    target.bag.deaRequest = { id: `${g.round}-${g.bribeRequestSequence = (g.bribeRequestSequence || 0) + 1}`, amount: action.amount };
    note(g, `${p.name} requested €${action.amount} from ${target.name}: accepting pays and passes the packet automatically.`); return;
  }
  if (p === inspector) throw Error('Only the packet owner can accept or decline the request.');
  const target = requestTarget(g, p.id), request = target.bag.deaRequest;
  if (!request || action.request !== request.id) throw Error('The D.E.A. request changed or was withdrawn. Review the current request.');
  if (action.type === 'decline-request') { target.bag.deaRequest = null; note(g, `${p.name} declined the D.E.A.’s €${request.amount} request.`); return; }
  if (g.pendingInspection && g.pendingInspection.target !== p.id) throw Error('Wait for the current packet decision before accepting.');
  if (p.coins < request.amount) throw Error('You do not have enough coins to accept this request.');
  target.bag.bribe = request.amount; target.bribeOffer = request.amount;
  acceptBribe(g, inspector, { type: 'accept-bribe', target: target.id, expectedAmount: request.amount });
}
function clearInvalidRequests(g) {
  for (const p of g.players) if (p.bag?.deaRequest && (p.bag.resolved || g.phase !== 'inspect' || (g.pendingInspection?.target === p.id && !NEGOTIABLE_STAGES.includes(g.pendingInspection.stage)))) p.bag.deaRequest = null;
}

function assertCurrentOffer(merchant, action) {
  if (action.expectedAmount !== undefined && action.expectedAmount !== merchant.bag.bribe) throw Error('The bribe changed or was revoked. Review the current offer.');
  if (merchant.bag.bribe > merchant.coins) throw Error('The offered bribe is no longer affordable. Ask for a new offer.');
}
function passUnopened(g, inspector, merchant, message = 'Current offer accepted; packet passed unopened.') {
  bribePayment(g, merchant, inspector, merchant.bag.bribe); merchant.stall.push(...merchant.bag.cards);
  resolveEnvelope(g, merchant, { name: merchant.name, kind: 'passed', message: `${message} €${merchant.bag.bribe} paid.`, cards: null }, merchant.bag.cards);
}
function acceptBribe(g, inspector, action) {
  if (g.phase !== 'inspect' || g.players[g.dea] !== inspector) throw Error('Only the D.E.A. may accept a packet’s bribe.');
  const merchant = merchants(g).find(p => p.id === action.target && p.bag && !p.bag.resolved);
  if (!merchant) throw Error('Choose an unresolved packet.');
  assertCurrentOffer(merchant, action);
  const pending = g.pendingInspection;
  if (pending) {
    if (pending.target !== merchant.id || pending.inspector !== inspector.id) throw Error('Resolve the current decision first.');
    if (pending.stage === 'dahlia-choice') return resolveFifthPending(g, inspector, { ...action, type: 'dahlia-pass' });
    if (pending.stage === 'l-review') return resolveExtraPending(g, inspector, { type: 'l-pass' });
    if (!['heisenberg-response', 'dahlia-response'].includes(pending.stage)) throw Error('This packet is already opened or an ability has claimed its outcome.');
    g.pendingInspection = null;
  }
  passUnopened(g, inspector, merchant);
}
function activateTimothy(g, rat, targetId) {
  const inspector = g.players[g.dea];
  if (g.phase !== 'inspect' || rat === inspector || rat.character !== 'timothy' || !abilityRemaining(rat)) throw Error('Timothy may force another smuggler’s inspection twice while not D.E.A.');
  const merchant = merchants(g).find(p => p.id === targetId && p !== rat && p.bag && !p.bag.resolved && !p.bag.abilityClaim);
  if (!merchant || inspectionBlocked(g, inspector.id, merchant.id)) throw Error('Choose another unclaimed, inspectable packet.');
  if (g.pendingInspection && !(g.pendingInspection.target === merchant.id && ['heisenberg-response', 'dahlia-response'].includes(g.pendingInspection.stage))) throw Error('Another inspection or ability is in progress.');
  useAbility(rat); merchant.bag.abilityClaim = 'timothy'; merchant.bag.rat = rat.id; g.pendingInspection = null;
  note(g, `${rat.name} used Rat’s Gambit to force inspection of ${merchant.name}.`);
  ordinaryInspection(g, inspector, merchant);
}
function resolveFifthPending(g, p, action) {
  const pending = g.pendingInspection;
  if (g.phase !== 'inspect' || !pending) throw Error('There is no pending ability decision.');
  const target = g.players.find(other => other.id === pending.target), inspector = g.players.find(other => other.id === pending.inspector);
  if (['dahlia-remove', 'dahlia-skip'].includes(action.type)) {
    if (pending.stage !== 'dahlia-response' || p !== target || p.character !== 'dahlia') throw Error('Only Dahlia may answer Smoke and Mirrors.');
    if (action.type === 'dahlia-skip') { g.pendingInspection = null; ordinaryInspection(g, inspector, target); return; }
    if (!abilityRemaining(p)) throw Error('Smoke and Mirrors has no uses remaining.');
    const indices = action.indices;
    selection({ hand: p.bag.cards }, indices, 1, Math.min(4, p.bag.cards.length - 1));
    useAbility(p); p.bag.abilityClaim = 'dahlia'; pending.removedIndices = [...indices]; pending.removedCount = indices.length; pending.stage = 'dahlia-choice';
    p.bag.count = p.bag.cards.length - indices.length;
    note(g, `${p.name} hid ${indices.length} card(s) with Smoke and Mirrors; ${p.bag.count} remain. The D.E.A. may inspect or accept the current bribe and cancel.`); return;
  }
  if (['dahlia-inspect', 'dahlia-pass'].includes(action.type)) {
    if (pending.stage !== 'dahlia-choice' || p !== inspector) throw Error('Only the D.E.A. may continue or cancel this inspection.');
    if (action.type === 'dahlia-pass') assertCurrentOffer(target, action);
    const removed = pending.removedIndices.map(i => target.bag.cards[i]);
    target.bag.cards = target.bag.cards.filter((_, i) => !pending.removedIndices.includes(i));
    discardCards(g, removed); g.pendingInspection = null;
    note(g, `After the D.E.A. chose ${action.type === 'dahlia-inspect' ? 'inspection' : 'to cancel'}, Dahlia revealed and discarded: ${removed.map(key => GOODS[key].name).join(', ')}.`);
    if (action.type === 'dahlia-inspect') ordinaryInspection(g, inspector, target);
    else passUnopened(g, inspector, target, 'Inspection canceled after Smoke and Mirrors; remaining packet passed unopened.');
    return;
  }
  const reactive = ['mike-response', 'carl-response', 'dana-response', 'pete-response', 'badger-response'];
  if (!reactive.includes(pending.stage) || p !== inspector || target.bag.abilityClaim) throw Error('Only the inspector may activate an unclaimed response after opening.');
  if (action.type === 'mike-use' || action.type === 'mike-skip') {
    if (p.character !== 'mike' || !abilityRemaining(p) || !target.bag.cards.some(key => !isLegalFor(target, key, g))) throw Error('Mike needs a caught illegal card and an unused ability.');
    if (action.type === 'mike-use') { useAbility(p); target.bag.abilityClaim = 'mike'; note(g, `${p.name} activated No Half Measures. The total inspection fine is doubled.`); }
    else target.bag.mikeDeclined = true;
    g.pendingInspection = null; ordinaryInspection(g, inspector, target, false, false, action.type === 'mike-use' ? 2 : 1); return;
  }
  if (p.character !== 'carl') throw Error('Only Carl may use Shady Inspection or Framed by the Badge.');
  if (action.type === 'carl-steal') {
    const i = action.index;
    if (p.carlStole || !Number.isInteger(i) || i < 0 || i >= target.bag.cards.length || isLegalFor(target, target.bag.cards[i], g)) throw Error('Select one caught illegal card while Shady Inspection is unused.');
    p.carlStole = true; target.bag.carlSteal = i; target.bag.abilityClaim = 'carl'; g.pendingInspection = null;
    ordinaryInspection(g, inspector, target, false, false); return;
  }
  if (action.type === 'carl-frame') {
    const i = action.index;
    if (p.carlFramed || !target.bag.cards.every(key => matchesDeclaration(target, key, g)) || !Number.isInteger(i) || i < 0 || i >= p.hand.length || isLegalFor(p, p.hand[i], g)) throw Error('Frame an honest packet using one illegal card from your hand, once per game.');
    const [key] = p.hand.splice(i, 1); discardCards(g, [key]); p.carlFramed = true; target.bag.abilityClaim = 'carl'; g.pendingInspection = null;
    settleOutcome(g, inspector, target, { payer: inspector.id, payee: target.id, amount: 0, delivered: [...target.bag.cards], discard: [], result: { name: target.name, kind: 'caught', message: `Framed by the Badge: Carl discarded his ${GOODS[key].name}. Honest goods were delivered, compensation canceled, and no added fine charged.`, cards: [...target.bag.cards, key] } }); return;
  }
  if (action.type === 'carl-skip') { target.bag.carlDeclined = true; g.pendingInspection = null; ordinaryInspection(g, inspector, target, false, false); return; }
  throw Error('That action does not match the current response.');
}

function nextDeaRound(g, id) {
  for (let offset = 1; g.round + offset <= totalRounds(g); offset++) if (g.players[(g.dea + offset) % g.players.length].id === id) return g.round + offset;
  return null;
}
function chargeHector(g, inspector, merchant) {
  if (merchant.character !== 'hector' || merchant.bag.hectorCharged) return;
  const marks = (g.hectorMarks || []).filter(mark => mark.hector === merchant.id && mark.agent === inspector.id && mark.round === g.round);
  if (!marks.length) return;
  merchant.bag.hectorCharged = true;
  payment(inspector, merchant, marks.length * 5);
  note(g, `${inspector.name} owes Hector €${marks.length * 5} for choosing to inspect his marked packet. Normal inspection payments still apply.`);
}
function finishInspections(g) {
  if (!g.pendingInspection && merchants(g).every(p => p.bag.resolved)) { settleContest(g); g.phase = 'results'; }
}
function resolveNewestPending(g, p, action) {
  const pending = g.pendingInspection;
  if (g.phase !== 'inspect' || !pending || pending.target !== p.id) throw Error('Only the packet owner may answer this ability decision.');
  const inspector = g.players.find(other => other.id === pending.inspector);
  if (pending.stage === 'trump-response' && ['trump-use', 'trump-skip'].includes(action.type)) {
    if (action.type === 'trump-use') {
      if (p.character !== 'trump' || !abilityRemaining(p)) throw Error('Executive Order is not available.');
      useAbility(p); const fee = pending.count * (g.players.length >= 5 ? 1 : 2);
      for (const other of g.players) if (other !== p) payment(other, p, fee);
      note(g, `${p.name} used Executive Order: every other player owed €${fee} for ${pending.count} illegal cards delivered in this packet.`);
    }
    g.pendingInspection = null; updateCollections(g); finishInspections(g); return;
  }
  if (pending.stage === 'pete-response' && ['pete-swap', 'pete-skip'].includes(action.type)) {
    if (action.type === 'pete-swap') {
      if (p.character !== 'peteBadger' || p.peteUsed) throw Error('Pete’s Swap has already been used.');
      const i = action.index, j = action.handIndex;
      if (!Number.isInteger(i) || i < 0 || i >= p.bag.cards.length || !Number.isInteger(j) || j < 0 || j >= p.hand.length) throw Error('Select one packet card and one hand card.');
      const incoming = p.hand[j], outgoing = p.bag.cards[i]; p.hand[j] = outgoing; p.bag.cards[i] = incoming;
      pending.outcome.delivered[i] = incoming; pending.outcome.result.cards = [...p.bag.cards];
      pending.outcome.result.message += ` Pete swapped ${GOODS[outgoing].name} for ${GOODS[incoming].name}; original compensation is unchanged.`;
      p.peteUsed = true; p.bag.abilityClaim = 'pete';
    }
    g.pendingInspection = null; settleOutcome(g, inspector, p, pending.outcome); return;
  }
  if (pending.stage === 'badger-response' && ['badger-use', 'badger-skip'].includes(action.type)) {
    if (action.type === 'badger-use') {
      if (p.character !== 'peteBadger' || p.badgerUsed || p.coins < pending.amount + 10) throw Error('Badger needs enough coins to pay the full inspection fine plus €10.');
      p.coins -= 10; p.badgerUsed = true; p.bag.abilityClaim = 'badger';
      pending.outcome.delivered = [...p.bag.cards]; pending.outcome.discard = [];
      pending.outcome.result.message += ' Badger paid €10 to the bank to keep every packet card; the normal fine still applies.';
    }
    g.pendingInspection = null; settleOutcome(g, inspector, p, pending.outcome); return;
  }
  throw Error('That choice does not match this pending ability.');
}

function applyJudgement(g, light, merchant) {
  const remaining = totalRounds(g) - g.round;
  let nextRound = null;
  for (let offset = 1; offset <= remaining; offset++) if (g.players[(g.dea + offset) % g.players.length].id === merchant.id) { nextRound = g.round + offset; break; }
  if (nextRound) {
    g.protections.push({ lightId: light.id, agentId: merchant.id, round: nextRound });
    note(g, `Kira’s Judgement: ${merchant.name} cannot inspect ${light.name} in round ${nextRound}.`);
  } else { light.coins += 20; note(g, `Kira’s Judgement: ${light.name} took €20 from the bank; ${merchant.name} has no D.E.A. turns remaining.`); }
}
function applyAction(g, actor, action) {
  if (!action || typeof action.type !== 'string') throw Error('Invalid action.');
  const p = g.players.find(p => p.id === actor);
  if (!p) throw Error('You are not at this table.');
  const isDea = g.players[g.dea].id === actor;
  if (action.type === 'chat') {
    if (typeof action.text !== 'string' || !action.text.trim()) return;
    g.chat.push({ name: p.name, text: action.text.trim().slice(0, 240) });
    g.chat = g.chat.slice(-60); return;
  }
  if (action.type === 'start') return startGame(g, actor);
  if (action.type === 'choose-character') {
    if (g.phase !== 'lobby') throw Error('Characters are locked after the game starts.');
    const target = action.target ? g.players.find(p => p.id === action.target) : p;
    if (!target || (target !== p && !(actor === g.hostId && target.bot))) throw Error('Choose your own character, or a bot’s character if you host the table.');
    if (action.character !== null && !Object.hasOwn(CHARACTERS, action.character)) throw Error('Choose an available character.');
    if (action.character && g.players.some(other => other !== target && other.character === action.character)) throw Error('That character is already taken.');
    target.character = action.character; return;
  }
  if (action.type === 'next') {
    if (actor !== g.hostId || g.phase !== 'results') throw Error('Wait for the host to continue.');
    if (g.piperOffers?.length) throw Error('Wait for Piper’s triggered ability countdown, or ask Piper to skip.');
    if (g.round >= totalRounds(g)) { settleFinalAbilities(g); g.phase = 'finished'; note(g, 'The market has closed. Final scores are in!'); return; }
    g.round++; g.dea = (g.dea + 1) % g.players.length; newRound(g); return;
  }
  if (['request-bribe', 'accept-request', 'decline-request'].includes(action.type)) return handleBribeRequest(g, p, action);
  if (action.type === 'piper-use' || action.type === 'piper-skip') return resolvePiper(g, p, action);
  if (action.type === 'surveil' || action.type === 'skip-surveillance') {
    if (g.phase !== 'market' || !isDea || p.character !== 'hank' || p.hankDecisionRound === g.round) throw Error('Hank may choose surveillance once during each of his D.E.A. market phases.');
    p.hankDecisionRound = g.round;
    if (action.type === 'surveil') { p.surveillanceRound = g.round; note(g, `${p.name} activated Shrader Surveillance. Replacement draws are private to Hank.`); }
    finishMarket(g); return;
  }
  if (['pete-swap', 'pete-skip', 'badger-use', 'badger-skip', 'trump-use', 'trump-skip'].includes(action.type)) return resolveNewestPending(g, p, action);
  if (action.type === 'rick') {
    if (g.phase !== 'market' || p.character !== 'rick' || p.abilityUsed) throw Error('Use Dumpster Dive while the market is open.');
    const cards = selection(p, action.indices, 3, 3);
    if (cards.some(key => GOODS[key].special)) throw Error('Special cards cannot be exchanged.');
    if (action.revision !== g.revision) throw Error('The discard pile changed. Review it and select again.');
    const picks = action.discardIndices;
    if (!Array.isArray(picks) || picks.length !== 3 || new Set(picks).size !== 3 || picks.some(i => !Number.isInteger(i) || i < 0 || i >= g.discard.length)) throw Error('Choose exactly three available discard cards.');
    const replacements = picks.map(i => g.discard[i]);
    g.discard = g.discard.filter((_, i) => !picks.includes(i)); take(p, action.indices); g.discard.push(...cards); p.hand.push(...replacements); useAbility(p);
    const intel = g.marketDraws[p.id] || []; g.marketDraws[p.id] = intel.concat(replacements).slice(0, 2);
    note(g, `${p.name} used Dumpster Dive to privately exchange three hand cards with the discard pile.`); return;
  }
  if (action.type === 'hector') {
    if (g.phase !== 'inspect' || !isDea || p.character !== 'hector' || !abilityRemaining(p) || g.pendingInspection) throw Error('Hector may mark and return a packet while holding the badge, twice per game.');
    const target = merchants(g).find(other => other.id === action.target && other.bag && !other.bag.resolved && !other.bag.abilityClaim);
    if (!target) throw Error('Choose an unopened, unclaimed packet.');
    useAbility(p); target.bag.abilityClaim = 'hector';
    const round = nextDeaRound(g, target.id);
    if (round) (g.hectorMarks ||= []).push({ hector: p.id, agent: target.id, round });
    note(g, `${p.name}: “This is personal!” ${target.name}’s packet is returned unopened.${round ? ` Inspecting Hector in round ${round} will cost €5.` : ' That player has no D.E.A. turns remaining.'}`);
    bribePayment(g, target, p, target.bag.bribe); target.stall.push(...target.bag.cards);
    resolveEnvelope(g, target, { name: target.name, kind: 'passed', message: 'Salamanca Money: packet returned unopened; the ordinary offered bribe was paid.', cards: null }, target.bag.cards); return;
  }
  if (action.type === 'exchange') {
    if (g.phase !== 'market' || isDea || p.ready) throw Error('It is not your market turn.');
    const cards = selection(p, action.indices, 0, 5);
    if (cards.some(key => GOODS[key].special)) throw Error('Keep special cards for loading; they cannot be exchanged in the market.');
    const discardCrowbars = action.discardCrowbars ?? 0;
    if (!Number.isInteger(discardCrowbars) || discardCrowbars < 0 || discardCrowbars > cards.length || (discardCrowbars && p.character !== 'benny')) throw Error('Only Benny may replace market draws with discard crowbars, up to the number exchanged.');
    const available = g.discard.filter(c => c === 'crowbar').length + cards.filter(c => c === 'crowbar').length;
    if (discardCrowbars > available) throw Error('There are no longer enough discard crowbars. Choose fewer and try again.');
    take(p, action.indices); g.discard.push(...cards);
    const drawn = [];
    for (let i = 0; i < discardCrowbars; i++) { g.discard.splice(g.discard.indexOf('crowbar'), 1); p.hand.push('crowbar'); drawn.push('crowbar'); }
    drawn.push(...draw(g, p, cards.length - discardCrowbars));
    g.marketDraws[p.id] = (g.marketDraws[p.id] || []).concat(drawn).slice(0, 2); p.ready = true; finishMarket(g); return;
  }
  if (action.type === 'pack') {
    if (g.phase !== 'pack' || isDea || p.ready) throw Error('You cannot load an envelope now.');
    const cards = selection(p, action.indices, 1, 5);
    if (cards.filter(key => key === 'usedNeedle').length > 1) throw Error('Load at most one Used Needle in a packet.');
    p.bag = { cards, declaration: null, count: cards.length, bribe: p.bribeOffer || 0, resolved: false };
    take(p, action.indices); p.ready = true;
    if (merchants(g).every(p => p.ready)) { g.phase = 'declare'; merchants(g).forEach(p => p.ready = false); note(g, 'All envelopes are loaded. Make your declarations.'); }
    return;
  }
  if (action.type === 'declare') {
    if (g.phase !== 'declare' || isDea || p.ready || !p.bag) throw Error('You cannot declare an envelope now.');
    if (challengeActor(g)) throw Error('Wait for Shinomiya to choose a contest or skip it this round.');
    if (!legalGoodsFor(p, g).includes(action.declaration)) throw Error('Declare one of your legal goods.');
    if (!Number.isInteger(action.bribe) || action.bribe < 0 || action.bribe > p.coins) throw Error('Your bribe must fit your coin purse.');
    p.bag.declaration = action.declaration; p.bag.declaredCards = [...p.bag.cards]; p.bag.declaredHonest = p.bag.cards.every(key => matchesDeclaration(p, key, g)); p.bag.bribe = action.bribe; p.bribeOffer = action.bribe; p.ready = true;
    if (merchants(g).every(p => p.ready)) { g.phase = 'inspect'; note(g, 'All declarations are in. Time to bargain with the D.E.A.'); }
    return;
  }
  if (action.type === 'challenge' || action.type === 'skip-challenge') {
    if (challengeActor(g) !== actor) throw Error('Shinomiya can decide only before declarations, while not the D.E.A., with the ability unused.');
    if (action.type === 'skip-challenge') { p.challengeDecisionRound = g.round; return; }
    const target = merchants(g).find(target => target.id === action.target && target !== p && target.bag && !target.ready);
    if (!target) throw Error('Challenge another smuggler with a loaded, undeclared envelope.');
    useAbility(p); p.challengeDecisionRound = g.round;
    g.contest = { challenger: actor, target: target.id, round: g.round, resolved: false };
    note(g, `${p.name} challenged ${target.name}: the higher delivered envelope value wins both deliveries.`); return;
  }
  if (action.type === 'bribe') {
    if (!['market', 'pack', 'declare', 'inspect'].includes(g.phase) || isDea || p.bag?.resolved) throw Error('Only an unresolved smuggler’s delivery can be negotiated.');
    if (!Number.isInteger(action.amount) || action.amount < 0 || action.amount > p.coins) throw Error('Offer between 0 and your available coins.');
    p.bribeOffer = action.amount; if (p.bag) p.bag.bribe = action.amount; return;
  }
  if (['dahlia-remove', 'dahlia-skip', 'dahlia-inspect', 'dahlia-pass', 'mike-use', 'mike-skip', 'carl-steal', 'carl-frame', 'carl-skip'].includes(action.type)) return resolveFifthPending(g, p, action);
  if (action.type === 'timothy') return activateTimothy(g, p, action.target);
  if (action.type === 'accept-bribe') return acceptBribe(g, p, action);
  if (['heisenberg-use', 'heisenberg-decline', 'heisenberg-backdown', 'heisenberg-inspect', 'selena-bank', 'selena-pay'].includes(action.type)) return resolveThirdPending(g, p, action.type);
  if (action.type === 'zach' || action.type === 'junior') {
    if (g.phase !== 'inspect' || !isDea || p.character !== action.type || !abilityRemaining(p)) throw Error('Use your special inspection as D.E.A. while you have uses remaining.');
    const target = merchants(g).find(other => other.id === action.target && other.bag && !other.bag.resolved);
    if (!target || target.bag.abilityClaim || inspectionBlocked(g, actor, target.id)) throw Error('Choose an unopened envelope that is not protected or already claimed.');
    if (g.pendingInspection && !(['heisenberg-response', 'dahlia-response'].includes(g.pendingInspection.stage) && g.pendingInspection.target === target.id)) throw Error('Another inspection decision is pending.');
    chargeHector(g, p, target); useAbility(p); target.bag.abilityClaim = action.type; g.pendingInspection = null;
    note(g, action.type === 'zach' ? `${p.name}: “What the fuck is this?”` : `${p.name}: “You’re a pussy!”`);
    const legalOnly = target.bag.cards.every(key => isLegalFor(target, key, g)), stolen = action.type === 'zach' && legalOnly;
    if (stolen) p.stall.push(...target.bag.cards); else target.stall.push(...target.bag.cards);
    if (action.type === 'junior' && legalOnly) p.coins += 8;
    const message = stolen ? 'Zach stole the entirely legal envelope. No ordinary fines or bribes.' : action.type === 'junior' && legalOnly ? 'All goods were legal. Junior earned €8 from the bank; the owner kept every card.' : 'An illegal card was present. The owner kept every card; no fines or bribes.';
    resolveEnvelope(g, target, { name: target.name, kind: stolen ? 'caught' : 'passed', message, cards: [...target.bag.cards] }, stolen ? [] : target.bag.cards); return;
  }
  if (['dana-split', 'dana-decline', 'dana-choose', 'l-share', 'l-inspect', 'l-pass', 'kim-accept', 'kim-refuse'].includes(action.type)) return resolveExtraPending(g, p, action);
  if (action.type === 'l-guess') {
    const pending = g.pendingInspection;
    if (g.phase !== 'inspect' || !isDea || p.character !== 'l' || (pending && !(pending.stage === 'l-review' && pending.inspector === actor && pending.target === action.target))) throw Error('L must guess before opening an envelope or while reviewing his own sample.');
    const target = merchants(g).find(other => other.id === action.target && other.bag && !other.bag.resolved);
    if (!target || target.bag.guess || !Object.hasOwn(GOODS, action.good) || isLegalFor(target, action.good, g) || inspectionBlocked(g, actor, target.id)) throw Error('Choose one illegal card type for an unguessed, inspectable envelope.');
    target.bag.guess = action.good;
    note(g, `${p.name} guessed ${GOODS[action.good].name} in ${target.name}’s envelope.`); return;
  }
  if (action.type === 'l-peek') {
    const pending = g.pendingInspection;
    const reviewing = pending?.stage === 'l-review' && pending.inspector === actor && pending.target === action.target;
    if (g.phase !== 'inspect' || !isDea || p.character !== 'l' || !abilityRemaining(p) || (pending && !reviewing)) throw Error('L may sample an unopened envelope three times per game, as D.E.A.');
    const target = merchants(g).find(other => other.id === action.target && other.bag && !other.bag.resolved);
    if (!target || (target.bag.abilityClaim && !reviewing) || inspectionBlocked(g, actor, target.id)) throw Error('That envelope is protected or already claimed by another ability.');
    const sampledIndices = reviewing ? pending.sampledIndices : [];
    const available = target.bag.cards.map((_, i) => i).filter(i => !sampledIndices.includes(i));
    if (!available.length) throw Error('Every card in this packet has already been sampled.');
    const index = available[Math.floor(Math.random() * available.length)], sampledCard = target.bag.cards[index];
    useAbility(p); target.bag.abilityClaim = 'l';
    const review = reviewing ? pending : { stage: 'l-review', target: target.id, inspector: actor, sampledIndices: [], samples: [] };
    review.sampledIndices.push(index); review.samples.push({ card: sampledCard, revealed: false });
    review.sampledCard = sampledCard; review.samplePublic = false; g.pendingInspection = review;
    note(g, `${p.name} privately sampled one previously unseen card from ${target.name}’s envelope, without replacement.`); return;
  }
  if (action.type === 'kim') {
    if (g.phase !== 'inspect' || isDea || p.character !== 'kim' || p.abilityUsed || !p.bag || p.bag.resolved || p.bag.abilityClaim || g.pendingInspection) throw Error('Kim must activate after declaring and before an inspection or competing ability is chosen.');
    if (!p.bag.cards.some(c => !isLegalFor(p, c, g)) || p.coins < 15) throw Error('Kim needs at least one illegal card and €15 to cover the offer.');
    useAbility(p); p.bag.abilityClaim = 'kim'; g.pendingInspection = { stage: 'kim-offer', target: actor, inspector: g.players[g.dea].id };
    note(g, `${p.name}: “This is a pro bono case.” A €15 Legal Loophole offer is pending.`); return;
  }
  if (action.type === 'jimmy-accept' || action.type === 'jimmy-refuse') {
    return resolveJimmyAction(g, p, action.type);
  }
  if (action.type === 'jimmy') {
    if (g.phase !== 'inspect' || isDea || p.character !== 'jimmy' || p.abilityUsed || !p.bag || p.bag.resolved || p.bag.abilityClaim || g.pendingInspection) throw Error('Jimmy must activate before an inspection is chosen, once per game.');
    activateJimmy(g, p, g.players[g.dea]); return;
  }
  if (action.type === 'fring') {
    if (g.phase !== 'inspect' || isDea || p.character !== 'fring' || p.abilityUsed) throw Error('Fring can take over one inspection per game, while not the D.E.A.');
    const target = merchants(g).find(other => other.id === action.target && other !== p && other.bag && !other.bag.resolved);
    if (!target || target.bag.abilityClaim) throw Error('Choose another smuggler’s unopened envelope that no ability has claimed.');
    if (g.pendingInspection && !(['heisenberg-response', 'dahlia-response'].includes(g.pendingInspection.stage) && g.pendingInspection.target === target.id)) throw Error('Another ability or inspection is already in progress.');
    target.bag.actualInspector = p.id;
    useAbility(p); target.bag.abilityClaim = 'fring'; g.pendingInspection = null; settleGuess(g, target);
    const illegal = target.bag.cards.filter(c => !isLegalFor(target, c, g)), legal = target.bag.cards.filter(c => isLegalFor(target, c, g));
    p.stall.push(...illegal); target.stall.push(...legal);
    if (!illegal.length) payment(p, target, 3);
    resolveEnvelope(g, target, { name: target.name, kind: illegal.length ? 'caught' : 'honest', message: illegal.length ? `Fring stole ${illegal.length} illegal card(s). Legal goods were delivered; no inspection fines.` : 'All goods were legal. Fring paid €3; legal goods were delivered.', cards: [...target.bag.cards] }, legal);
    return;
  }
  if (action.type === 'inspect' || action.type === 'pass' || action.type === 'kira') {
    if (g.phase !== 'inspect' || !isDea) throw Error('Only the D.E.A. can decide.');
    if (g.pendingInspection) throw Error('Resolve the current inspection before choosing another envelope.');
    const merchant = merchants(g).find(other => other.id === action.target && other.bag && !other.bag.resolved);
    if (!merchant) throw Error('Choose an unopened envelope.');
    if (action.type === 'pass') {
      bribePayment(g, merchant, p, merchant.bag.bribe); merchant.stall.push(...merchant.bag.cards);
      resolveEnvelope(g, merchant, { name: merchant.name, kind: 'passed', message: `Envelope passed. €${merchant.bag.bribe} paid to the D.E.A.`, cards: null }, merchant.bag.cards); return;
    }
    if (inspectionBlocked(g, actor, merchant.id)) throw Error('Kira’s Judgement protects this envelope during your D.E.A. turn. Let it pass instead.');
    const kira = action.type === 'kira';
    if (kira) {
      if (p.character !== 'light' || p.abilityUsed) throw Error('Only Lawful Light can use Kira’s Judgement, once per game.');
      useAbility(p); merchant.bag.abilityClaim = 'light'; note(g, `${p.name}: “I’m Kira.”`);
    }
    if (merchant.character === 'dahlia' && abilityRemaining(merchant) && !merchant.bag.abilityClaim && merchant.bag.cards.length > 1) {
      g.pendingInspection = { stage: 'dahlia-response', target: merchant.id, inspector: p.id };
      note(g, `${p.name} chose to inspect ${merchant.name}. Dahlia may remove cards before opening.`); return;
    }
    if (merchant.character === 'heisenberg' && !merchant.abilityUsed && !merchant.bag.abilityClaim) {
      g.pendingInspection = { stage: 'heisenberg-response', target: merchant.id, inspector: p.id };
      note(g, `${p.name} chose to inspect ${merchant.name}. Heisenberg may challenge before the envelope is revealed.`); return;
    }
    ordinaryInspection(g, p, merchant, kira); return;
  }
  throw Error('Unknown game action.');
}
export function collectionProgress(p) {
  const categories = LEGAL.filter(key => p.stall.includes(key));
  if (p.stall.some(key => !GOODS[key].legal)) categories.push('illegal');
  return categories;
}
function updateCollections(g) {
  for (const p of g.players) if (p.character === 'benny' && !p.crowbarsUnlocked && p.stall.filter(c => c === 'crowbar').length >= 3) {
    p.crowbarsUnlocked = true; note(g, `${p.name} delivered three crowbars. Crowbars are now legal for Benny, with a €2 penalty.`);
  }
  for (const p of g.players) if (p.character === 'katagiri' && !p.collectionComplete && collectionProgress(p).length === 5) {
    p.collectionComplete = true; note(g, `${p.name} completed Katagiri’s five-category set. Doubled illegal fines are over; the end-game payment is unlocked.`);
  }
}
function settleFinalAbilities(g) {
  if (g.finalAbilitiesSettled) return;
  updateCollections(g);
  const katagiri = g.players.find(p => p.character === 'katagiri' && p.collectionComplete);
  if (katagiri) {
    for (const p of g.players) if (p !== katagiri) payment(p, katagiri, 20);
    note(g, `${katagiri.name} collected €20 from every other player for The Devil Himself.`);
  }
  const steve = g.players.find(p => p.character === 'steve');
  if (steve) { const reward = steve.stall.reduce((n, key) => n + (!GOODS[key].legal ? key === 'weed' ? 6 : 3 : 0), 0); steve.coins += reward; note(g, `${steve.name} collected €${reward} from the bank with Blunt Force Strategy.`); }
  g.finalAbilitiesSettled = true;
}
function ordinaryInspection(g, inspector, merchant, kira = false, allowDana = true, multiplier = 1) {
  merchant.bag.deaRequest = null;
  merchant.bag.actualInspector = inspector.id;
  payNeedleInspection(g, inspector, merchant);
  chargeHector(g, inspector, merchant);
  settleGuess(g, merchant);
  const illegalCount = merchant.bag.cards.filter(c => !isLegalFor(merchant, c, g)).length;
  if (allowDana && merchant.character === 'dana' && abilityRemaining(merchant) && illegalCount >= 2 && !merchant.bag.abilityClaim) {
    g.pendingInspection = { stage: 'dana-response', target: merchant.id, inspector: inspector.id, cards: [...merchant.bag.cards] };
    note(g, `${merchant.name} was caught with at least two illegal cards and may use Split Decision.`); return;
  }
  const doubleLabel = merchant.bag.abilityClaim === 'mike' ? 'No Half Measures' : 'Say My Name';
  const cards = merchant.bag.cards, lies = cards.filter(c => !matchesDeclaration(merchant, c, g));
  if (kira && lies.length) applyJudgement(g, inspector, merchant);
  let outcome;
  if (!lies.length) {
    const fee = cards.reduce((n, c) => n + penaltyFor(merchant, c, g), 0) * multiplier;
    outcome = { payer: inspector.id, payee: merchant.id, amount: fee, delivered: [...cards], discard: [], result: { name: merchant.name, kind: 'honest', message: `Honest smuggler! D.E.A. owes €${fee}${multiplier === 2 ? ` (${doubleLabel} doubles compensation)` : ''}.`, cards: [...cards] } };
  } else {
    const doubled = merchant.character === 'katagiri' && !merchant.collectionComplete;
    const legalFine = lies.filter(c => isLegalFor(merchant, c, g)).reduce((n, c) => n + penaltyFor(merchant, c, g), 0);
    const illegalFine = lies.filter(c => !isLegalFor(merchant, c, g)).reduce((n, c) => n + penaltyFor(merchant, c, g), 0);
    const fee = (legalFine + (merchant.character === 'tuco' ? Math.floor(illegalFine * 1.5) : illegalFine * (doubled ? 2 : 1))) * multiplier;
    outcome = { payer: merchant.id, payee: inspector.id, amount: fee, delivered: cards.filter(c => matchesDeclaration(merchant, c, g)), discard: lies, result: { name: merchant.name, kind: 'caught', message: `Caught bluffing! ${lies.length} seized; €${fee} owed${doubled ? ' (illegal-card fines doubled for Katagiri)' : multiplier === 2 ? ` (${doubleLabel} doubles the fine)` : ''}.`, cards: [...cards] } };
  }
  if (inspector.character === 'mike' && outcome.result.kind === 'honest' && !inspector.mikeWaived) {
    inspector.mikeWaived = true; outcome.amount = 0; outcome.result.message = 'Honest packet delivered. Mike’s first honest-inspection compensation is waived.';
  }
  if (merchant.character === 'steve') {
    outcome.returned = outcome.discard.filter(key => key === 'weed'); outcome.discard = outcome.discard.filter(key => key !== 'weed');
    if (outcome.returned.length) outcome.result.message += ` ${outcome.returned.length} Weed card(s) returned to Steve’s hand at half fine.`;
  }
  if (merchant.bag.rat) {
    const rat = g.players.find(p => p.id === merchant.bag.rat);
    if (outcome.result.kind === 'honest') {
      const half = Math.floor(outcome.amount / 2); outcome.amount -= half;
      outcome.secondary = { payer: rat.id, payee: merchant.id, amount: half };
      outcome.result.message += ` Timothy owes €${half}; the D.E.A. owes €${outcome.amount}.`;
    } else { outcome.rat = rat.id; outcome.result.message += ' Collected fine is split with Timothy, who also receives €12 from the bank.'; }
  }
  if (merchant.bag.carlSteal !== undefined) {
    const key = cards[merchant.bag.carlSteal], index = outcome.discard.indexOf(key);
    if (index >= 0 || outcome.returned?.includes(key)) { if (index >= 0) outcome.discard.splice(index, 1); else outcome.returned.splice(outcome.returned.indexOf(key), 1); outcome.stolen = [key]; outcome.result.message += ` Carl stole ${GOODS[key].name}; its fine still applies.`; }
  }
  if (!merchant.bag.abilityClaim && inspector.character === 'mike' && abilityRemaining(inspector) && illegalCount && !merchant.bag.mikeDeclined) {
    g.pendingInspection = { stage: 'mike-response', target: merchant.id, inspector: inspector.id, cards: [...cards], amount: outcome.amount, outcome }; return;
  }
  const carlCanSteal = inspector.character === 'carl' && !inspector.carlStole && illegalCount > 0;
  const carlCanFrame = inspector.character === 'carl' && !inspector.carlFramed && outcome.result.kind === 'honest' && inspector.hand.some(key => !isLegalFor(inspector, key, g));
  if (!merchant.bag.abilityClaim && !merchant.bag.carlDeclined && (carlCanSteal || carlCanFrame)) {
    g.pendingInspection = { stage: 'carl-response', target: merchant.id, inspector: inspector.id, cards: [...cards], amount: outcome.amount, canSteal: carlCanSteal, canFrame: carlCanFrame, outcome }; return;
  }
  if (merchant.character === 'peteBadger' && !merchant.bag.abilityClaim) {
    const stage = outcome.result.kind === 'honest' && !merchant.peteUsed && merchant.hand.length ? 'pete-response' : illegalCount && !merchant.badgerUsed ? 'badger-response' : null;
    if (stage) { g.pendingInspection = { stage, target: merchant.id, inspector: inspector.id, cards: [...cards], amount: outcome.amount, outcome }; return; }
  }
  settleOutcome(g, inspector, merchant, outcome);
}
function settleOutcome(g, inspector, merchant, outcome) {
  const payer = g.players.find(p => p.id === outcome.payer);
  if (outcome.amount > 0 && payer.character === 'selena' && abilityRemaining(payer)) {
    g.pendingInspection = { stage: 'selena-fine', target: merchant.id, inspector: inspector.id, payer: payer.id, payee: outcome.payee, amount: outcome.amount, cards: [...merchant.bag.cards], outcome };
    note(g, `${payer.name} owes a known inspection fine of €${outcome.amount}. Selena may choose Vault Venture.`); return;
  }
  completeOutcome(g, inspector, merchant, outcome, false);
}
function completeOutcome(g, inspector, merchant, outcome, fromBank) {
  const payer = g.players.find(p => p.id === outcome.payer), payee = g.players.find(p => p.id === outcome.payee);
  if (fromBank) { useAbility(payer); payee.coins += outcome.amount; note(g, `${payer.name} used Vault Venture. The bank paid €${outcome.amount} directly to ${payee.name}.`); }
  else if (outcome.rat) {
    const rat = g.players.find(p => p.id === outcome.rat), pot = { coins: 0, stall: [] };
    payment(payer, pot, outcome.amount); const half = Math.floor(pot.coins / 2); rat.coins += half; payee.coins += pot.coins - half;
    let ratValue = half, agentValue = pot.coins - half;
    for (const key of pot.stall) { const recipient = ratValue < agentValue ? rat : payee; recipient.stall.push(key); if (recipient === rat) ratValue += GOODS[key].value; else agentValue += GOODS[key].value; }
  } else payment(payer, payee, outcome.amount);
  if (outcome.rat) { const rat = g.players.find(p => p.id === outcome.rat); if (fromBank) { const half = Math.floor(outcome.amount / 2); payee.coins -= half; rat.coins += half; } rat.coins += 12; }
  if (outcome.secondary) payment(g.players.find(p => p.id === outcome.secondary.payer), g.players.find(p => p.id === outcome.secondary.payee), outcome.secondary.amount);
  merchant.hand.push(...(outcome.returned || [])); inspector.stall.push(...(outcome.stolen || []));
  if (merchant.character === 'trump' && outcome.result.kind === 'honest' && merchant.bag.count >= 3) { merchant.coins += 3; note(g, `${merchant.name} received €3 from the bank for an honest inspected packet of 3+ cards.`); }
  merchant.stall.push(...outcome.delivered); discardCards(g, outcome.discard);
  if (fromBank) outcome.result.message += ' Vault Venture covered the payment.';
  resolveEnvelope(g, merchant, outcome.result, outcome.delivered);
}
function awardWendyDraws(g, merchant, delivered) {
  if (merchant.character !== 'wendy') return;
  const count = delivered.reduce((total, key) => total + (key === 'meth' ? 1 : key === 'blueSky' ? 2 : 0), 0);
  if (!count) return;
  const holder = { hand: [] }, bonus = draw(g, holder, count);
  merchant.stall.push(...bonus); merchant.bonusDraws.push(...bonus);
  note(g, `${merchant.name} added ${bonus.length} bonus card(s) to her stash with Meth Madness. Bonus draws do not chain.`);
}
function resolveThirdPending(g, p, type) {
  const pending = g.pendingInspection;
  if (g.phase !== 'inspect' || !pending) throw Error('There is no pending ability decision.');
  const target = g.players.find(other => other.id === pending.target), inspector = g.players.find(other => other.id === pending.inspector);
  if (type === 'selena-bank' || type === 'selena-pay') {
    if (pending.stage !== 'selena-fine' || p.id !== pending.payer || p.character !== 'selena') throw Error('Only the Selena who owes this fine may choose its payment source.');
    if (type === 'selena-bank' && !abilityRemaining(p)) throw Error('Vault Venture has no uses remaining.');
    g.pendingInspection = null; completeOutcome(g, inspector, target, pending.outcome, type === 'selena-bank'); return;
  }
  if (type === 'heisenberg-use' || type === 'heisenberg-decline') {
    if (pending.stage !== 'heisenberg-response' || p !== target || p.character !== 'heisenberg') throw Error('Only Heisenberg may respond to this inspection request.');
    if (type === 'heisenberg-decline') { g.pendingInspection = null; ordinaryInspection(g, inspector, target); return; }
    if (!abilityRemaining(p)) throw Error('Say My Name has already been used.');
    useAbility(p); target.bag.abilityClaim = 'heisenberg'; pending.stage = 'heisenberg-choice';
    note(g, `${p.name}: “Say my name.” The D.E.A. must back down or accept a doubled inspection.`); return;
  }
  if (type === 'heisenberg-backdown' || type === 'heisenberg-inspect') {
    if (pending.stage !== 'heisenberg-choice' || p !== inspector) throw Error('Only the inspector may answer Say My Name.');
    g.pendingInspection = null;
    if (type === 'heisenberg-inspect') ordinaryInspection(g, inspector, target, false, true, 2);
    else { target.coins += 5; target.stall.push(...target.bag.cards); resolveEnvelope(g, target, { name: target.name, kind: 'passed', message: 'The D.E.A. backed down. Heisenberg kept the unopened envelope and took €5 from the bank; no bribe was paid.', cards: null }, target.bag.cards); }
    return;
  }
  throw Error('That choice does not match the pending ability.');
}
function activateJimmy(g, jimmy, inspector) {
  const count = jimmy.bag.cards.filter(c => !isLegalFor(jimmy, c, g)).length;
  if (!count) throw Error('Jimmy needs at least one illegal card to use Better Call Saul.');
  if (jimmy.coins < count * 3) throw Error(`You need €${count * 3} to cover Jimmy’s offer.`);
  useAbility(jimmy); jimmy.bag.abilityClaim = 'jimmy';
  g.pendingInspection = { target: jimmy.id, inspector: inspector.id, stage: 'jimmy-offer' };
  note(g, `${jimmy.name} used Better Call Saul. The inspector must choose to open the envelope or accept the offer.`);
}
function resolveJimmyAction(g, p, type) {
  const pending = g.pendingInspection;
  if (g.phase !== 'inspect' || !pending) throw Error('No inspection response is pending.');
  const jimmy = g.players.find(other => other.id === pending.target), inspector = g.players.find(other => other.id === pending.inspector);
  if (pending.stage !== 'jimmy-offer' || p !== inspector) throw Error('Only the inspector may decide Jimmy’s offer.');
  const illegal = jimmy.bag.cards.filter(c => !isLegalFor(jimmy, c, g)), legal = jimmy.bag.cards.filter(c => isLegalFor(jimmy, c, g));
  g.pendingInspection = null;
  if (type === 'jimmy-accept') {
    bribePayment(g, jimmy, inspector, illegal.length * 3); jimmy.stall.push(...jimmy.bag.cards);
    resolveEnvelope(g, jimmy, { name: jimmy.name, kind: 'passed', message: `Better Call Saul: unopened envelope passed; Jimmy paid €${illegal.length * 3}.`, cards: null }, jimmy.bag.cards);
  } else {
    settleGuess(g, jimmy);
    settleOutcome(g, inspector, jimmy, { payer: inspector.id, payee: jimmy.id, amount: legal.length * 3, delivered: legal, discard: illegal, result: { name: jimmy.name, kind: 'caught', message: `Better Call Saul: ${illegal.length} illegal card(s) confiscated; inspector paid €${legal.length * 3} for legal goods. No normal fines.`, cards: [...jimmy.bag.cards] } });
  }
}
function finishMarket(g) {
  const dea = g.players[g.dea];
  if (!merchants(g).every(p => p.ready) || (dea.character === 'hank' && dea.hankDecisionRound !== g.round)) return;
  g.phase = 'pack'; merchants(g).forEach(p => p.ready = false);
}
function settleGuess(g, target) {
  const dea = g.players[g.dea];
  if (dea.character !== 'l' || !target.bag.guess || target.bag.guessSettled) return;
  target.bag.guessSettled = true;
  const count = target.bag.cards.filter(c => c === target.bag.guess && !isLegalFor(target, c, g)).length;
  if (count) { dea.coins += count; note(g, `${dea.name} correctly guessed ${count} ${GOODS[target.bag.guess].name} card(s) and earned €${count} from the bank.`); }
  else note(g, `${dea.name}’s illegal-type guess did not match. No bank reward.`);
}
function resolveExtraPending(g, p, action) {
  const pending = g.pendingInspection;
  if (g.phase !== 'inspect' || !pending) throw Error('There is no ability decision to resolve.');
  const target = g.players.find(other => other.id === pending.target), inspector = g.players.find(other => other.id === pending.inspector);
  if (['l-share', 'l-inspect', 'l-pass'].includes(action.type)) {
    if (pending.stage !== 'l-review' || p !== inspector) throw Error('Only L may decide what to do with his sample.');
    if (action.type === 'l-share') {
      if (pending.samplePublic) throw Error('The sample has already been revealed.');
      pending.samplePublic = true; pending.samples.forEach(sample => sample.revealed = true); note(g, `${p.name} revealed the sampled cards from ${target.name}’s envelope: ${pending.samples.map(sample => GOODS[sample.card].name).join(', ')}.`); return;
    }
    g.pendingInspection = null;
    if (action.type === 'l-inspect') ordinaryInspection(g, inspector, target);
    else { bribePayment(g, target, inspector, target.bag.bribe); target.stall.push(...target.bag.cards); resolveEnvelope(g, target, { name: target.name, kind: 'passed', message: 'L let the whole envelope pass, including its sampled cards. Unsampled contents remain private.', cards: null }, target.bag.cards); }
    return;
  }
  if (action.type === 'dana-decline') {
    if (pending.stage !== 'dana-response' || p !== target) throw Error('Only Dana may decline Split Decision.');
    g.pendingInspection = null; ordinaryInspection(g, inspector, target, false, false); return;
  }
  if (action.type === 'dana-split') {
    if (pending.stage !== 'dana-response' || p !== target || !abilityRemaining(p)) throw Error('Only Dana can select a pair while Split Decision is available.');
    const indices = action.indices;
    if (!Array.isArray(indices) || indices.length !== 2 || new Set(indices).size !== 2 || indices.some(i => !Number.isInteger(i) || i < 0 || i >= target.bag.cards.length || isLegalFor(target, target.bag.cards[i], g))) throw Error('Select exactly two distinct illegal cards from this envelope.');
    useAbility(p); target.bag.abilityClaim = 'dana'; pending.stage = 'dana-choice'; pending.pair = [...indices]; return;
  }
  if (action.type === 'dana-choose') {
    if (pending.stage !== 'dana-choice' || p !== inspector || !pending.pair.includes(action.index)) throw Error('Only the inspector may choose one of Dana’s selected cards.');
    const cards = target.bag.cards, taken = cards[action.index], retained = cards[pending.pair.find(i => i !== action.index)];
    const rest = cards.filter((_, i) => !pending.pair.includes(i)), delivered = [retained, ...rest.filter(c => matchesDeclaration(target, c, g))];
    const confiscated = rest.filter(c => !matchesDeclaration(target, c, g)), fine = confiscated.reduce((sum, c) => sum + penaltyFor(target, c, g), 0);
    payment(target, inspector, fine); inspector.stall.push(taken); target.stall.push(...delivered); discardCards(g, confiscated);
    const bonus = GOODS[taken].value > GOODS[retained].value ? 4 : 0; target.coins += bonus;
    g.pendingInspection = null;
    resolveEnvelope(g, target, { name: target.name, kind: 'caught', message: `Split Decision: inspector kept ${GOODS[taken].name}; Dana kept ${GOODS[retained].name}. Remaining fines: €${fine}.${bonus ? ' Dana earned €4 from the bank.' : ''}`, cards: [...cards] }, delivered); return;
  }
  if (action.type === 'kim-accept' || action.type === 'kim-refuse') {
    if (pending.stage !== 'kim-offer' || p !== inspector) throw Error('Only the D.E.A. may settle Kim’s offer.');
    g.pendingInspection = null;
    if (action.type === 'kim-accept') {
      bribePayment(g, target, inspector, 15); target.stall.push(...target.bag.cards);
      resolveEnvelope(g, target, { name: target.name, kind: 'passed', message: 'Legal Loophole: €15 accepted and the unopened envelope passed.', cards: null }, target.bag.cards);
    } else {
      settleGuess(g, target);
      const legal = target.bag.cards.filter(c => isLegalFor(target, c, g)), illegal = target.bag.cards.filter(c => !isLegalFor(target, c, g));
      settleOutcome(g, inspector, target, { payer: inspector.id, payee: target.id, amount: legal.length * 4, delivered: legal, discard: illegal, result: { name: target.name, kind: 'caught', message: `Legal Loophole: illegal goods confiscated; Kim received €${legal.length * 4} for legal goods. No ordinary fines or bribe.`, cards: [...target.bag.cards] } });
    }
    return;
  }
  throw Error('That ability cannot answer the current decision.');
}
function analyticsBefore(g, actor) {
  const p = g.players.find(p => p.id === actor);
  return { round: g.round, phase: g.phase, hand: p ? [...p.hand] : [], coins: g.players.map(p => p.coins) };
}
function recordAnalyticsAction(g, actor, action, before) {
  if (!g.analytics || action.type === 'chat' || action.type === 'choose-character') return;
  const p = g.players.find(p => p.id === actor), details = {};
  for (const key of ['amount', 'declaration', 'good', 'indices', 'discardIndices', 'index', 'handIndex', 'discardCrowbars', 'automatic']) if (action[key] !== undefined) details[key] = structuredClone(action[key]);
  g.analytics.events.push({ at: Date.now(), round: before.round || g.round, phase: before.phase, nextPhase: g.phase, actor: g.players.indexOf(p), target: action.target ? g.players.findIndex(p => p.id === action.target) : null, type: action.type, details, handBefore: before.hand, handAfter: p ? [...p.hand] : [], coinDeltas: g.players.map((p, i) => p.coins - (before.coins[i] ?? p.coins)) });
}
export function act(g, actor, action) {
  expireAbilities(g);
  const before = analyticsBefore(g, actor);
  applyAction(g, actor, action); updateCollections(g); clearInvalidRequests(g); syncTriggerDeadline(g);
  recordAnalyticsAction(g, actor, action, before);
}
export function majorityCount(cards, key) {
  return cards.reduce((total, card) => total + (card === key ? 1 : GOODS[card].majority === key ? GOODS[card].majorityWeight : 0), 0);
}
export function scores(g) {
  const rows = g.players.map(p => ({ id: p.id, name: p.name, coins: p.coins, goods: p.stall.reduce((n, c) => n + cardValueFor(p, c), 0), bonus: 0, awards: [] }));
  g.players.forEach((p, i) => { if (p.character === 'tuco') { const printed = p.stall.filter(key => !GOODS[key].legal && !GOODS[key].special).reduce((n, key) => n + GOODS[key].value, 0); rows[i].goods += Math.ceil(printed * 1.5) - printed; } });
  g.players.forEach((p, i) => { if (p.character === 'peteBadger') { const count = p.stall.filter(key => !GOODS[key].legal).length; rows[i].bonus += count; if (count) rows[i].awards.push(`Pete & Badger: +€${count} for illegal goods`); } });
  for (const key of LEGAL) {
    const groups = new Map();
    for (let i = 0; i < g.players.length; i++) {
      const count = majorityCount(g.players[i].stall, key);
      if (count) { if (!groups.has(count)) groups.set(count, []); groups.get(count).push(i); }
    }
    const ranks = [...groups.keys()].sort((a, b) => b - a);
    if (!ranks.length) continue;
    const first = groups.get(ranks[0]);
    const award = (ids, amount, title) => ids.forEach(i => { rows[i].bonus += Math.floor(amount / ids.length); rows[i].awards.push(`${title} of ${GOODS[key].name}`); });
    if (first.length > 1) award(first, GOODS[key].king + GOODS[key].queen, 'Joint Kingpin');
    else { award(first, GOODS[key].king, 'Kingpin'); if (ranks.length > 1) award(groups.get(ranks[1]), GOODS[key].queen, 'Queenpin'); }
  }
  return rows.map(r => ({ ...r, total: r.coins + r.goods + r.bonus })).sort((a, b) => b.total - a.total);
}
export function viewFor(g, viewer) {
  const final = g.phase === 'finished';
  const pending = structuredClone(g.pendingInspection);
  if (pending) { delete pending.outcome; if (viewer !== pending.target) delete pending.removedIndices; }
  if (pending?.stage === 'dahlia-choice' && viewer === pending.target) pending.removedCards = pending.removedIndices.map(i => g.players.find(p => p.id === pending.target).bag.cards[i]);
  if (pending?.stage === 'l-review') {
    delete pending.sampledIndices;
    if (viewer !== pending.inspector) {
      if (!pending.samplePublic) delete pending.sampledCard;
      pending.samples = pending.samples.map(sample => sample.revealed ? sample : { revealed: false });
    }
  }
  const viewerPlayer = g.players.find(p => p.id === viewer), dea = g.players[g.dea];

  return {
    hostId: g.hostId, phase: g.phase, round: g.round, dea: g.dea, totalRounds: totalRounds(g),
    log: [...g.log], chat: structuredClone(g.chat), results: structuredClone(g.results), revision: g.revision,
    scores: final ? scores(g) : null,
    serverNow: Date.now(), piperOffers: structuredClone(g.piperOffers || []), cardTotal: g.cardTotal || CATALOG_SIZE, retiredCount: g.retired?.length || 0, pendingInspection: pending, rickDiscard: viewerPlayer?.character === 'rick' && g.phase === 'market' && !viewerPlayer.abilityUsed ? [...g.discard] : null, hectorMarks: structuredClone(g.hectorMarks || []), discardCrowbars: viewerPlayer?.character === 'benny' ? g.discard.filter(c => c === 'crowbar').length : null, marketIntel: dea.character === 'hank' && dea.id === viewer && dea.surveillanceRound === g.round ? structuredClone(g.marketDraws) : null, contest: structuredClone(g.contest), protections: structuredClone(g.protections), challengeActor: challengeActor(g),
    players: g.players.map(p => ({
      id: p.id, name: p.name, bot: p.bot, online: p.online, coins: p.coins, ready: p.ready,
      character: p.character, abilityUsed: p.abilityUsed, abilityUses: p.abilityUses, abilityRemaining: abilityRemaining(p), bonusCards: p.id === viewer && p.character === 'wendy' ? [...p.bonusDraws] : null, surveillanceDecided: p.hankDecisionRound === g.round, surveillanceActive: p.surveillanceRound === g.round, crowbarCollection: p.id === viewer && p.character === 'benny' ? p.stall.filter(c => c === 'crowbar').length : null, carlStole: !!p.carlStole, carlFramed: !!p.carlFramed, mikeWaived: !!p.mikeWaived, bribeOffer: p.bag?.bribe ?? p.bribeOffer ?? 0, peteUsed: !!p.peteUsed, badgerUsed: !!p.badgerUsed, raughnInspection: dea.character === 'raughn', legalGoods: legalGoodsFor(p, g), crowbarsUnlocked: !!p.crowbarsUnlocked, collectionComplete: p.collectionComplete, collection: p.id === viewer && p.character === 'katagiri' ? collectionProgress(p) : null,
      hand: p.id === viewer ? [...p.hand] : null, handCount: p.hand.length,
      stall: p.stall.filter(c => final || p.id === viewer || isLegalFor(p, c)),
      contrabandCount: p.stall.filter(c => !isLegalFor(p, c)).length,
      bag: p.bag ? { declaration: p.bag.declaration, count: p.bag.count, bribe: p.bag.bribe, deaRequest: structuredClone(p.bag.deaRequest || null), resolved: p.bag.resolved, abilityClaim: p.bag.abilityClaim || null, guess: p.bag.guess || null, cards: p.id === viewer ? p.bag.cards.filter((_, i) => !(g.pendingInspection?.stage === 'dahlia-choice' && g.pendingInspection.target === p.id && g.pendingInspection.removedIndices.includes(i))) : null } : null
    }))
  };
}
export function botAction(g, id) {
  const p = g.players.find(p => p.id === id);
  if (!p?.bot) return null;
  const opportunity = g.piperOffers?.find(offer => offer.piper === id);
  if (opportunity) return { type: 'piper-use', offer: opportunity.id };
  if (p.bag?.deaRequest && !p.bag.resolved && (!g.pendingInspection || (g.pendingInspection.target === id && NEGOTIABLE_STAGES.includes(g.pendingInspection.stage)))) return { type: p.coins >= p.bag.deaRequest.amount ? 'accept-request' : 'decline-request', request: p.bag.deaRequest.id };
  if (g.pendingInspection) {
    const pending = g.pendingInspection;
    if (pending.stage === 'dahlia-response' && pending.target === id) { const indices = p.bag.cards.map((c, i) => c !== p.bag.declaration ? i : -1).filter(i => i >= 0).slice(0, Math.min(4, p.bag.cards.length - 1)); return indices.length ? { type: 'dahlia-remove', indices } : { type: 'dahlia-skip' }; }
    if (pending.stage === 'dahlia-choice' && pending.inspector === id) return { type: Math.random() < .5 ? 'dahlia-inspect' : 'dahlia-pass' };
    if (pending.stage === 'mike-response' && pending.inspector === id) return { type: 'mike-use' };
    if (pending.stage === 'carl-response' && pending.inspector === id) { const target = g.players.find(other => other.id === pending.target); return pending.canSteal ? { type: 'carl-steal', index: target.bag.cards.findIndex(key => !isLegalFor(target, key, g)) } : { type: 'carl-frame', index: p.hand.findIndex(key => !isLegalFor(p, key, g)) }; }
    if (pending.stage === 'trump-response' && pending.target === id) return { type: 'trump-use' };
    if (pending.stage === 'pete-response' && pending.target === id) return { type: 'pete-swap', index: 0, handIndex: p.hand.reduce((best, key, i) => cardValueFor(p, key) > cardValueFor(p, p.hand[best]) ? i : best, 0) };
    if (pending.stage === 'badger-response' && pending.target === id) return { type: p.coins >= pending.amount + 10 ? 'badger-use' : 'badger-skip' };
    if (pending.stage === 'selena-fine' && pending.payer === id) return { type: 'selena-bank' };
    if (pending.stage === 'heisenberg-response' && pending.target === id) return { type: 'heisenberg-use' };
    if (pending.stage === 'heisenberg-choice' && pending.inspector === id) return { type: Math.random() < .35 ? 'heisenberg-backdown' : 'heisenberg-inspect' };
    if (pending.stage === 'jimmy-offer' && pending.inspector === id) return { type: Math.random() < .5 ? 'jimmy-accept' : 'jimmy-refuse' };
    if (pending.stage === 'kim-offer' && pending.inspector === id) return { type: Math.random() < .5 ? 'kim-accept' : 'kim-refuse' };
    if (pending.stage === 'dana-response' && pending.target === id) {
      const indices = p.bag.cards.map((key, index) => ({ key, index })).filter(c => !isLegalFor(p, c.key, g)).sort((a, b) => GOODS[b.key].penalty - GOODS[a.key].penalty).slice(0, 2).map(c => c.index);
      return { type: 'dana-split', indices };
    }
    if (pending.stage === 'dana-choice' && pending.inspector === id) {
      const target = g.players.find(other => other.id === pending.target);
      const index = [...pending.pair].sort((a, b) => GOODS[target.bag.cards[b]].value - GOODS[target.bag.cards[a]].value)[0];
      return { type: 'dana-choose', index };
    }
    if (pending.stage === 'l-review' && pending.inspector === id) {
      const target = g.players.find(other => other.id === pending.target);
      if (!target.bag.guess && !isLegalFor(target, pending.sampledCard, g)) return { type: 'l-guess', target: target.id, good: pending.sampledCard };
      return { type: !isLegalFor(target, pending.sampledCard, g) || Math.random() < .25 ? 'l-inspect' : 'l-pass' };
    }
    return null;
  }
  if (g.phase === 'market' && g.players[g.dea].id === id && p.character === 'hank' && p.hankDecisionRound !== g.round) return { type: 'surveil' };
  const challenger = challengeActor(g);
  if (challenger) {
    if (challenger !== id) return null;
    const target = merchants(g).find(other => other !== p);
    return target && Math.random() < .65 ? { type: 'challenge', target: target.id } : { type: 'skip-challenge' };
  }
  if (g.phase === 'inspect' && g.players[g.dea].id !== id && !p.abilityUsed) {
    if (p.character === 'timothy' && abilityRemaining(p)) { const target = merchants(g).find(other => other !== p && !other.bag.resolved && !other.bag.abilityClaim && !inspectionBlocked(g, g.players[g.dea].id, other.id)); if (target) return { type: 'timothy', target: target.id }; }
    if (p.character === 'kim' && !p.bag.resolved && p.coins >= 15 && p.bag.cards.some(c => !isLegalFor(p, c, g))) return { type: 'kim' };
    if (p.character === 'jimmy' && !p.bag.resolved) {
      const cost = p.bag.cards.filter(c => !GOODS[c].legal).length * 3;
      if (cost && p.coins >= cost) return { type: 'jimmy' };
    }
    if (p.character === 'fring') {
      const target = merchants(g).find(other => other !== p && !other.bag.resolved);
      if (target) return { type: 'fring', target: target.id };
    }
  }
  if (g.players[g.dea].id === id) {
    if (g.phase !== 'inspect') return null;
    const target = merchants(g).find(p => p.bag && !p.bag.resolved);
    if (!target) return null;
    if (p.character === 'l' && !inspectionBlocked(g, id, target.id)) {
      if (!target.bag.guess) {
        const illegal = PLAYABLE.filter(key => !isLegalFor(target, key, g));
        return { type: 'l-guess', target: target.id, good: illegal[Math.floor(Math.random() * illegal.length)] };
      }
      if (abilityRemaining(p) && !target.bag.abilityClaim) return { type: 'l-peek', target: target.id };
    }
    if (p.character === 'hector' && abilityRemaining(p) && !target.bag.abilityClaim) return { type: 'hector', target: target.id };
    if (!inspectionBlocked(g, id, target.id) && ['zach', 'junior'].includes(p.character) && abilityRemaining(p)) return { type: p.character, target: target.id };
    const type = inspectionBlocked(g, id, target.id) ? 'pass' : p.character === 'light' && !p.abilityUsed ? 'kira' : Math.random() < (target.bag.bribe >= 4 ? .22 : .55) ? 'inspect' : 'pass';
    return { type, target: target.id };
  }
  if (p.ready) return null;
  if (g.phase === 'declare') {
    const declaration = legalGoodsFor(p, g).map(key => [key, p.bag.cards.filter(c => c === key).length]).sort((a, b) => b[1] - a[1])[0][0];
    return { type: 'declare', declaration, bribe: Math.min(p.coins, p.bag.cards.some(c => c !== declaration) ? 3 + Math.floor(Math.random() * 4) : 0) };
  }
  const counts = legalGoodsFor(p, g).map(key => [key, p.hand.filter(c => c === key).length]).sort((a, b) => b[1] - a[1]);
  const declaration = counts[0][0];
  if (g.phase === 'market') {
    if (p.character === 'rick' && !p.abilityUsed && g.discard.length >= 3 && p.hand.length >= 3) return { type: 'rick', indices: [0, 1, 2], discardIndices: [0, 1, 2], revision: g.revision };
    const indices = p.hand.map((c, i) => c !== declaration && !GOODS[c].special ? i : -1).filter(i => i >= 0).slice(0, 5);
    const discardCrowbars = p.character === 'benny' ? Math.min(indices.length, g.discard.filter(c => c === 'crowbar').length + indices.filter(i => p.hand[i] === 'crowbar').length) : 0;
    return { type: 'exchange', indices, discardCrowbars };
  }
  if (g.phase === 'pack') {
    let indices = p.hand.map((c, i) => c === declaration ? i : -1).filter(i => i >= 0).slice(0, 5);
    const special = p.hand.findIndex(key => GOODS[key].special); if (special >= 0 && indices.length < 5) indices.push(special);
    if ((Math.random() < .5 || !indices.length) && indices.length < 5) {
      const extra = p.hand.findIndex((c, i) => c !== declaration && !indices.includes(i) && !GOODS[c].special); if (extra >= 0) indices.push(extra);
    }
    return { type: 'pack', indices };
  }
  return null;
}
