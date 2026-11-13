import { GOODS, LEGAL, createGame, addPlayer, removePlayer, act, viewFor, botAction, majorityCount, CATALOG_SIZE, CHARACTERS, inspectionBlocked, deaTurnsPerPlayer, isLegalFor, legalGoodsFor, penaltyFor, cardValueFor, expireAbilities } from './engine.js';
import { TableNetwork } from './network.js';
import { archiveCompletedGame, anonymousPlayerId } from './analytics-store.js';
const localAnalyticsId = anonymousPlayerId();
const analyticsNotice = 'Completed games save gameplay statistics on the host’s device using random player IDs. No IP addresses or chat messages are recorded.';
function archiveIfFinished(game) { archiveCompletedGame(game).then(saved => { if (saved) toast('Game statistics saved to this browser’s private casebook.'); }).catch(error => toast(error.message)); }

const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => crypto.randomUUID();
function saved(key, fallback = '') { try { return sessionStorage.getItem(key) || fallback; } catch { return fallback; } }
function save(key, value) { try { sessionStorage.setItem(key, value); } catch { /* Private browsing may disable storage. */ } }
let selfId = saved('better-smug-drug-token') || uid(); save('better-smug-drug-token', selfId);
const guestSecret = saved('better-smug-drug-secret') || uid(); save('better-smug-drug-secret', guestSecret);
let name = saved('better-smug-drug-name'), code = new URL(location.href).searchParams.get('room')?.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6) || '';
let state = null, network = null, demo = null, status = '', screen = 'home', selected = new Set(), selectionKey = '', busy = false, botTimer = null;
let chatDraft = '', declaration = 'bread', bribeDraft = 0, toastTimer, lastError = '';
let danaSelected = new Set(), pendingKey = '', discardCrowbarsDraft = 0;
let rickSelected = new Set(), rickPileKey = '', petePacket = 0, peteHand = 0;
let dahliaSelected = new Set();
const guessDrafts = new Map();
const requestDrafts = new Map();
let inspectionQueue = [], activeInspectionResult = null, inspectionMode = null, inspectionMarkup = '';
const seenInspectionResults = new Set(), dismissedInspectionWindows = new Set();
let publicLogExpanded = false, publicLogRound = '', publicLogSearch = '';
const botNames = ['The Baker', 'Fishy Business', 'Rare Medium', 'Corky'];
const phaseNames = { lobby: 'The gathering', market: 'Market', pack: 'Load envelope', declare: 'Declaration', inspect: 'Inspection', results: 'End of round', finished: 'Final standings' };
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4500); }
function crest() { return '<img src="./assets/crest.svg" alt="" width="34" height="38">'; }
function header() {
  return `<header class="topbar"><a class="brand" href="./" data-action="home">${crest()}<span>BETTER SMUG DRUG<span class="brand-sub">THE HANDMADE HEIST</span></span></a><nav><span class="nav-note">A game of bluff & bribery</span><button class="quiet-button" data-action="cards">Cards</button><button class="quiet-button" data-action="rules"><span aria-hidden="true">▤</span> Rules</button>${state ? '<button class="quiet-button" data-action="leave">Leave table</button>' : ''}</nav></header>`;
}
function home() {
  return `${header()}<main class="home"><div class="hero"><section class="hero-copy"><div class="eyebrow"><span class="little-line"></span> NOTHING TO DECLARE. PROBABLY.</div><h1>Better Smug<br><em>Drug.</em></h1><p class="hero-description">Bread. Fish. A little contraband.<br>Absolutely nothing suspicious.</p><p class="hero-detail">Load your envelope. Bluff the D.E.A. Turn an innocent delivery into a very questionable fortune.</p><div class="hero-meta"><span><i>♙</i> 3–5 players</span><span><i>◷</i> 20–40 minutes</span><span><i>⌁</i> Play in browser</span></div><div class="hero-art-caption"><span>222 CARDS. ONE VERY NOSY AGENT.</span><span>YOUR HOMEMADE GAME, ONLINE.</span></div></section><section class="entry-panel" aria-labelledby="entry-title"><div class="panel-flourish">✦</div><span class="eyebrow">A SEAT AT THE TABLE</span><h2 id="entry-title">The market awaits.</h2><p>Bring your friends. Leave your honesty at home.</p><form id="room-form"><label for="merchant-name">YOUR NAME AT THE TABLE</label><div class="input-wrap"><span aria-hidden="true">♙</span><input id="merchant-name" name="name" placeholder="e.g. Definitely Just Bread" maxlength="18" autocomplete="nickname" value="${escape(name)}" required></div><button class="primary-button wide" type="submit" data-intent="host" ${busy ? 'disabled' : ''}>${busy ? '<span class="spinner"></span> Connecting…' : 'Create a table <span>↗</span>'}</button><div class="or-divider"><span>OR JOIN YOUR FRIENDS</span></div><label for="room-code">ROOM CODE</label><div class="join-row"><input id="room-code" name="code" placeholder="ABC123" value="${escape(code)}" maxlength="6" autocomplete="off" spellcheck="false"><button class="secondary-button" type="submit" data-intent="join" ${busy ? 'disabled' : ''}>Join table <span>→</span></button></div></form><p class="analytics-notice">${analyticsNotice}</p>${lastError ? `<p class="connection-error" role="alert">${escape(lastError)}</p>` : ''}<p class="entry-note"><span class="status-dot"></span> No downloads. No accounts. Just a good bluff.</p><button class="practice-link" data-action="demo">Just looking? Try a practice game <span>→</span></button></section></div><section class="how-strip"><div class="strip-heading"><span class="eyebrow">THE ART OF GETTING AWAY WITH IT</span><h3>Everyone has a little to hide.</h3></div><div class="mini-step"><span class="step-number">01</span><div><h4>Pack your goods</h4><p>A little bread. A suspicious phone.</p></div></div><div class="mini-step"><span class="step-number">02</span><div><h4>Make your case</h4><p>A straight face goes a long way.</p></div></div><div class="mini-step"><span class="step-number">03</span><div><h4>Pay your price</h4><p>Every envelope has a story. Sell yours.</p></div></div></section></main><footer><span>${crest()} BETTER SMUG DRUG · THE ONLINE TABLE</span><span>Made for good company & questionable deals.</span><button data-action="rules">The rules of the road ↗</button></footer>`;
}
function portrait(key, extra = '', god = false) { return `<span class="character-portrait portrait-${key} ${extra}" role="img" aria-label="${god ? 'God Andrew' : CHARACTERS[key].name}" style="background-image:url('./assets/characters/${god ? 'andrewGod.png' : `${key}.jpg`}')"></span>`; }
function characterStatus(p) {
  if (p.character === 'andrew') return p.godAndrew ? 'GOD ANDREW' : 'MYSTERY';
  if (p.character === 'katagiri') return p.collectionComplete ? 'SET COMPLETE' : 'PASSIVE';
  if (['wendy', 'raughn', 'steve', 'pinkman', 'nile', 'tuco'].includes(p.character)) return 'PASSIVE';
  if (p.character === 'carl') return `STEAL ${p.carlStole ? 'USED' : 'READY'} · FRAME ${p.carlFramed ? 'USED' : 'READY'}`;
  if (p.character === 'peteBadger') return `PETE ${p.peteUsed ? 'USED' : 'READY'} · BADGER ${p.badgerUsed ? 'USED' : 'READY'}`;
  if (p.character === 'benny') return p.crowbarsUnlocked ? 'CROWBARS LEGAL' : 'PASSIVE';
  if (p.character === 'hank') return 'D.E.A. MARKET';
  if (p.character === 'selena') return `${p.abilityRemaining ?? 3} VAULT USES LEFT`;
  if (p.character === 'l') return `${p.abilityRemaining ?? 3} SAMPLES LEFT`;
  if (p.abilityUsed) return 'ABILITY USED';
  const remaining = p.abilityRemaining ?? 1;
  return `${remaining} USE${remaining === 1 ? '' : 'S'} LEFT`;
}
function characterSeat(p) {
  const character = CHARACTERS[p.character];
  if (state.phase !== 'lobby') return character ? `<div class="character-strip"><span>${p.godAndrew ? 'God Andrew' : character.name}</span><b>${characterStatus(p)}</b></div>` : '';
  const editable = p.id === selfId || (isHost() && p.bot);
  return `<div class="character-choice">${editable ? `<label for="character-${p.id}">CHARACTER</label><select id="character-${p.id}" data-character-player="${p.id}"><option value="">Random at start</option>${Object.entries(CHARACTERS).map(([key, c]) => { const owner = state.players.find(other => other.id !== p.id && other.character === key); return `<option value="${key}" ${p.character === key ? 'selected' : ''} ${owner ? 'disabled' : ''}>${c.name}${owner ? ` · Taken by ${escape(owner.name)}` : ''}</option>`; }).join('')}</select>` : `<span class="eyebrow">${character?.name || 'RANDOM AT START'}</span>`}${character ? `<p>${character.ability} · ${character.timing}</p>` : ''}</div>`;
}
function abilityPanel() {
  const p = me(), character = CHARACTERS[p.character]; if (!character) return '';
  let controls = '';
  if (state.phase === 'declare' && state.challengeActor === p.id) controls = `<div class="ability-controls"><span class="eyebrow">CHOOSE BEFORE DECLARATIONS</span><div class="response-actions">${state.players.filter((other, i) => i !== state.dea && other.id !== p.id).map(other => `<button class="ability-button" data-action="challenge" data-id="${other.id}">Challenge ${escape(other.name)}</button>`).join('')}<button class="secondary-button" data-action="skip-challenge">Save for another round</button></div></div>`;
  if (state.phase === 'inspect' && p.character === 'jimmy' && !p.abilityUsed && p.bag && !p.bag.resolved && !state.pendingInspection) {
    const fee = p.bag.cards.filter(c => !GOODS[c].legal).length * 3;
    controls = `<div class="ability-controls"><button class="ability-button" data-action="jimmy" ${!fee || p.coins < fee ? 'disabled' : ''}>Better Call Saul · Offer €${fee}</button><span class="action-hint">${!fee ? 'Requires an illegal card in your envelope.' : p.coins < fee ? 'Not enough euros to cover the offer.' : 'Click before the D.E.A. chooses to inspect, or Fring takes over.'}</span></div>`;
  }
  if (state.phase === 'inspect' && p.character === 'kim' && !p.abilityUsed && p.bag && !p.bag.resolved && !p.bag.abilityClaim && !state.pendingInspection) {
    const eligible = p.coins >= 15 && p.bag.cards.some(c => !isLegalFor(p, c));
    controls = `<div class="ability-controls"><button class="ability-button" data-action="kim" ${eligible ? '' : 'disabled'}>Legal Loophole · Offer €15</button><span class="action-hint">Requires €15 and at least one illegal card. Activate before inspection is chosen.</span></div>`;
  }
  if (state.phase === 'market' && p.character === 'hank' && state.players[state.dea].id === p.id && !p.surveillanceDecided) controls = `<div class="ability-controls"><div class="response-actions"><button class="ability-button" data-action="surveil">Activate surveillance</button><button class="secondary-button" data-action="skip-surveillance">Skip surveillance this round</button></div><span class="action-hint">See the first two replacement draws per smuggler privately. Market waits for this choice.</span></div>`;
  if (state.phase === 'market' && p.character === 'rick' && !p.abilityUsed) controls = `<div class="ability-controls"><span class="eyebrow">DUMPSTER DIVE · PRIVATE DISCARD CHOICES</span><p>Select exactly three hand cards below and three discard cards here. This is separate from your ordinary exchange; use it while the market is still open.</p>${state.players[state.dea].id === p.id || p.ready ? `<div class="evidence-grid">${p.hand.map((key, i) => evidenceCard(key, i, 'rick-hand', selected.has(i))).join('')}</div>` : ''}<div class="evidence-grid discard-picker">${(state.rickDiscard || []).map((key, i) => evidenceCard(key, i, 'rick-card', rickSelected.has(i))).join('') || '<p>The discard pile is empty.</p>'}</div><button class="ability-button" data-action="rick" ${selected.size === 3 && rickSelected.size === 3 ? '' : 'disabled'}>Dumpster Dive · Swap 3 hand / 3 discard</button><p>${selected.size}/3 hand cards · ${rickSelected.size}/3 discard cards selected. Other players cannot see your choices.</p></div>`;
  if (state.players[state.dea].character === 'raughn') controls += '<p class="ability-footnote">Room Inspection: Wine is illegal this round and cannot be declared. Illegal-card fines increase by €2; Wendy’s ordinary Meth exemption still applies.</p>';
  if (p.godAndrew && state.godIntel) controls += `<div class="private-intel"><span class="eyebrow">PRIVATE · GOD ANDREW</span>${state.godIntel.map(intel => `<details><summary>See ${escape(state.players.find(other => other.id === intel.id)?.name)}’s cards</summary>${['hand', 'packet', 'stall'].map(area => `<h4>${area === 'packet' ? 'Sealed packet' : area === 'stall' ? 'Stash' : 'Hand'}</h4><div class="evidence-grid">${intel[area].map((key, i) => evidenceCard(key, i)).join('') || '<p>No cards.</p>'}</div>`).join('')}</details>`).join('')}</div>`;
  const bennyProgress = p.character === 'benny' ? `<div class="collection-progress"><span class="${p.crowbarsUnlocked ? 'collected' : ''}">${symbol('crowbar')} ${p.crowbarCollection} crowbars in stash · ${p.crowbarsUnlocked ? 'LEGAL CROWBARS UNLOCKED' : 'Need 3 to unlock'}</span></div>` : '';
  const intel = p.character === 'hank' && state.marketIntel ? `<div class="private-intel"><span class="eyebrow">PRIVATE SURVEILLANCE · THIS ROUND ONLY</span>${Object.keys(state.marketIntel).length ? Object.entries(state.marketIntel).map(([id, cards]) => `<div><b>${escape(state.players.find(other => other.id === id)?.name)}</b><span>${cards.length ? cards.map(key => `${symbol(key)} ${GOODS[key].name}`).join(' · ') : 'Kept their hand; no cards drawn.'}</span></div>`).join('') : '<p>Waiting for smugglers to exchange cards…</p>'}</div>` : '';
  const wendyBonus = p.character === 'wendy' && p.bonusCards?.length ? `<div class="private-intel"><span class="eyebrow">YOUR PRIVATE BONUS DRAWS · THIS ROUND</span><div>${p.bonusCards.map(key => `<span>${symbol(key)} ${GOODS[key].name}</span>`).join('')}</div><p>These cards are already in your stash. They do not create further bonus draws.</p></div>` : '';
  const specialNote = p.character === 'tuco' ? '<p class="ability-footnote">Tuco’s multiplier is applied once to the combined illegal value or fine, not to each card. Card faces retain printed values.</p>' : p.character === 'nile' ? '<p class="ability-footnote">Select at most one needle while loading. It occupies one of the five slots and can be your only card. Unused needles do not reduce your six ordinary hand slots.</p>' : '';
  const mikePassive = p.character === 'mike' ? `<p class="ability-footnote">First honest-inspection waiver: ${p.mikeWaived ? 'already used this game' : 'still available'}.</p>` : '';
  const heisenbergPassive = p.character === 'heisenberg' ? '<p class="ability-footnote">Passive remains active: Meth scores €10; Blue Sky scores €13 while in your stash. Printed card values still apply to contests.</p>' : '';
  const collection = p.character === 'katagiri' ? `<div class="collection-progress">${[...LEGAL, 'illegal'].map(key => `<span class="${p.collection?.includes(key) ? 'collected' : ''}">${p.collection?.includes(key) ? '✓' : '○'} ${key === 'illegal' ? 'Any illegal' : GOODS[key].name}</span>`).join('')}</div><p class="ability-footnote">${p.collectionComplete ? 'Set completed. Illegal fines stay normal and your end-game reward is unlocked.' : 'Complete all five categories to stop doubled illegal fines and unlock the end-game reward.'}</p>` : '';
  return `<section class="personal-ability">${portrait(p.character, '', p.godAndrew)}<div class="ability-copy"><div class="ability-heading"><span class="eyebrow">${p.godAndrew ? 'God Andrew' : character.name}</span><span class="ability-status">${characterStatus(p)}</span></div><h2>${character.ability}</h2><p>${character.description}</p>${collection}${bennyProgress}${intel}${wendyBonus}${specialNote}${mikePassive}${heisenbergPassive}${controls}<button class="small-text-button" data-action="characters">All characters & interactions ↗</button></div></section>`;
}
function contestSummary() {
  const c = state.contest; if (!c) return '';
  const a = state.players.find(p => p.id === c.challenger), b = state.players.find(p => p.id === c.target);
  return `<div class="contest-summary"><span class="eyebrow">BECAUSE I’M A GENIUS</span><p>${escape(a.name)} vs ${escape(b.name)}${c.resolved ? ` · €${c.totals[0]} vs €${c.totals[1]} · ${c.winner ? `${escape(state.players.find(p => p.id === c.winner).name)} wins both deliveries.` : 'Tie. Both keep their cards.'}` : ' · Higher delivered envelope value wins both deliveries at round end.'}</p></div>`;
}
function playerTile(p, i) {
  const dea = i === state.dea && state.phase !== 'lobby';
  const mine = p.id === selfId;
  const goods = LEGAL.map(k => `<span title="${GOODS[k].name}">${symbol(k)} <b>${majorityCount(p.stall, k)}</b></span>`).join('');
  return `<article class="player-tile ${mine ? 'is-you' : ''} ${dea ? 'is-dea' : ''}"><div class="player-heading"><span class="avatar color-${i}">${dea ? '<img class="agent-badge" src="./assets/crest.svg" alt="D.E.A. agent badge">' : p.character ? portrait(p.character, '', p.godAndrew) : escape(p.name.charAt(0).toUpperCase())}</span><div><h3>${escape(p.name)} ${mine ? '<small>YOU</small>' : ''}</h3><span class="player-role">${dea ? 'D.E.A. AGENT' : p.bot ? 'PRACTICE BOT' : p.online ? 'SMUGGLER' : 'DISCONNECTED'}</span></div><span class="coin-count"><span>€</span> ${p.coins}</span></div>${characterSeat(p)}${state.phase !== 'lobby' ? `<div class="stall-goods">${goods}${p.crowbarsUnlocked ? `<span title="Benny’s legal crowbars">${symbol('crowbar')} <b>${p.stall.filter(c => c === 'crowbar').length}</b></span>` : ''}<span title="Contraband delivered">🏴 <b>${p.contrabandCount}</b></span></div><div class="player-bottom"><span>${p.handCount} cards in hand</span><span>${dea ? '⚖ Keeping the peace' : p.bag?.resolved ? '✓ Envelope resolved' : p.bag ? '▣ Envelope sealed' : p.ready ? '✓ Ready' : 'Preparing…'}</span></div>` : `<div class="player-bottom"><span>${p.online ? '<span class="status-dot"></span> Ready at the table' : 'Waiting to reconnect'}</span>${isHost() && !mine ? `<button class="small-text-button" data-action="remove" data-id="${escape(p.id)}">Remove</button>` : ''}</div>`}</article>`;
}
function isHost() { return state?.hostId === selfId; }
function me() { return state.players.find(p => p.id === selfId); }
function waiting(title, description, symbol = '⌛') { return `<div class="waiting"><span class="waiting-icon">${symbol}</span><h2>${title}</h2><p>${description}</p></div>`; }
function lobby() {
  const count = state.players.length;
  return `<section class="lobby-intro"><div><span class="eyebrow">GOOD COMPANY. QUESTIONABLE INTENTIONS.</span><h1>Your table is set.</h1><p>Share the invitation. Then decide who deserves your trust.</p></div><div class="invite-card"><span class="eyebrow">ROOM CODE</span><strong>${escape(currentCode())}</strong><button class="secondary-button" data-action="copy">Copy invite link <span>↗</span></button></div></section><div class="table-columns"><section><div class="section-heading"><h2>The smugglers <span class="muted">${count}/5</span></h2>${isHost() ? `<button class="quiet-button" data-action="add-bot" ${count >= 5 ? 'disabled' : ''}>+ Add practice bot</button>` : ''}</div><div class="character-lobby-note"><span>Pick your character: first come, first served. Claimed characters are reserved immediately. Unchosen seats draw from those left at the start.</span><button class="small-text-button" data-action="characters">Meet the characters ↗</button></div><div class="lobby-players">${state.players.map(playerTile).join('')}${count < 5 ? `<div class="empty-seat"><span>+</span> An opportunity for another questionable smuggler.</div>` : ''}</div><div class="lobby-actions">${isHost() ? `<button class="primary-button" data-action="start" ${count < 3 || state.players.some(p => !p.online) ? 'disabled' : ''}>Start the operation <span>→</span></button><p>${count < 3 ? 'At least 3 players are needed. Invite friends or add bots.' : `Everyone will be the D.E.A. ${deaTurnsPerPlayer(count) === 3 ? 'three times' : 'twice'} (${count * deaTurnsPerPlayer(count)} rounds total).`}</p>` : '<p class="waiting-line"><span class="spinner"></span> Waiting for the host to start the operation…</p>'}</div><p class="analytics-notice">${analyticsNotice}</p><div class="notice"><b>Keep this table open.</b> ${demo ? 'Practice runs on your device. The other smugglers are bots.' : 'The host’s browser runs the game. Guests can rejoin from the same browser tab if disconnected. Use table chat or a voice call to negotiate.'}</div></section>${chatPanel()}</div>`;
}
function symbol(key, extra = '') { return `<svg class="card-symbol ${extra}" viewBox="0 0 100 100" aria-hidden="true"><use href="./assets/cards.svg#${key}"></use></svg>`; }
function card(key, index, selectable = true, owner = null) {
  const good = GOODS[key]; if (good.special && state?.phase === 'market') selectable = false;
  const active = selected.has(index), legal = owner ? isLegalFor(owner, key) : key === 'usedNeedle' || good.legal, penalty = owner ? penaltyFor(owner, key) : good.penalty, value = owner ? cardValueFor(owner, key) : good.value;
  return `<button class="goods-card ${legal ? 'legal' : 'contraband'} ${good.category || ''} ${active && selectable ? 'selected' : ''}" ${selectable ? `data-action="card" data-index="${index}" aria-pressed="${active}"` : 'disabled'} aria-label="${good.name}, value €${value}, penalty €${penalty}${good.majority ? `, counts as two ${GOODS[good.majority].name} for majority scoring` : ''}${selectable && active ? ', selected' : ''}"><span class="card-top"><span>${legal ? 'LEGAL' : good.category === 'mixed' ? 'MIXED · ILLEGAL' : 'ILLEGAL'}</span><span class="selection-mark">${active && selectable ? '✓' : '+'}</span></span><span class="goods-art">${symbol(key)}</span><strong>${good.name}</strong>${good.majority ? `<span class="majority-note">2× ${GOODS[good.majority].name.toUpperCase()} BONUS</span>` : ''}<span class="card-stats"><span class="value-box"><b>€${value}</b></span><span class="fine-box"><b>${penalty ? '−' : ''}€${penalty}</b></span></span></button>`;
}
function handPanel() {
  const p = me(), dea = state.players[state.dea].id === selfId;
  const choosing = ['market', 'pack'].includes(state.phase) && !p.ready && !dea;
  return `<section class="hand-panel"><div class="section-heading"><h2>Your hand <span class="muted">${p.hand.length} cards</span></h2><span class="private-label">◈ ONLY YOU CAN SEE THIS</span></div><div class="hand-cards">${p.hand.map((key, i) => card(key, i, choosing, p)).join('') || '<p class="muted">Your goods are in the envelope. Refill next round.</p>'}</div>${p.bag && !p.bag.resolved ? `<div class="your-bag">YOUR SEALED ENVELOPE <span>${p.bag.cards.map(c => `${symbol(c)} ${GOODS[c].name}`).join(' · ')}</span></div>` : ''}</section>`;
}
function marketPanel() {
  const p = me(), dea = state.players[state.dea].id === selfId;
  if (dea && p.character === 'hank' && !p.surveillanceDecided) return waiting('Time to watch the market.', 'Activate surveillance or skip it using your ability controls above. Smugglers may exchange while you decide.', '◈');
  if (dea) return waiting('A fresh badge. A watchful eye.', 'The smugglers are exchanging cards. You’ll inspect their envelopes soon.', '✦');
  if (p.ready) return waiting('Your market visit is complete.', 'Waiting for the other smugglers to finish their exchanges.', '✓');
  return `<div class="action-copy"><span class="eyebrow">01 / MARKET</span><h2>A better hand.<br>A better alibi.</h2><p>Select up to 5 cards below to trade for fresh goods, or keep your current hand.</p>${p.character === 'benny' ? `<div class="benny-market"><label for="discard-crowbars">DISCARD CROWBARS INSTEAD OF DECK DRAWS</label><input id="discard-crowbars" type="number" min="0" max="${Math.min(selected.size, (state.discardCrowbars || 0) + [...selected].filter(i => p.hand[i] === 'crowbar').length)}" value="${Math.min(discardCrowbarsDraft, selected.size, (state.discardCrowbars || 0) + [...selected].filter(i => p.hand[i] === 'crowbar').length)}"><p>${state.discardCrowbars || 0} currently in the discard pile. Each crowbar replaces one of your selected cards; discard crowbars are drawn first.</p></div>` : ''}<button class="primary-button" data-action="exchange">${selected.size ? `Exchange ${selected.size} card${selected.size === 1 ? '' : 's'}` : 'Keep my hand'} <span>→</span></button><span class="action-hint">${selected.size}/5 cards selected · One exchange this round</span></div>`;
}
function packPanel() {
  const p = me(), dea = state.players[state.dea].id === selfId;
  if (dea) return waiting('Something smells suspicious.', 'The smugglers are loading their envelopes. Prepare your best skeptical face.', '⚖');
  if (p.ready) return waiting('Sealed with a little confidence.', `Your envelope holds ${p.bag.count} cards. Wait for the other smugglers before declaring its contents.`, '▣');
  return `<div class="action-copy"><span class="eyebrow">02 / LOAD ENVELOPE</span><h2>What’s in the envelope?</h2><p>Choose 1–5 cards from your hand. Once sealed, the contents are locked.<br>You’ll make your declaration in the next step.</p><button class="primary-button" data-action="pack" ${!selected.size ? 'disabled' : ''}>Seal my envelope <span>▣</span></button><span class="action-hint">${selected.size}/5 cards packed · Your envelope stays private</span></div>`;
}
function declarationPanel() {
  const p = me(), dea = state.players[state.dea].id === selfId;
  if (state.challengeActor) return waiting('A genius is considering a challenge.', state.challengeActor === selfId ? 'Choose a rival or skip this round using your ability controls above.' : `${escape(state.players.find(p => p.id === state.challengeActor).name)} must choose a contest or skip before declarations begin.`, '✦');
  if (dea) return waiting('Let’s hear those alibis.', 'Each smuggler must declare one legal good. The card count is always truthful.', '✦');
  if (p.ready) return waiting('Your story is on the record.', `You declared ${p.bag.count} ${escape(GOODS[p.bag.declaration].name.toLowerCase())}. Waiting for the other declarations.`, '✓');
  return `<div class="action-copy"><span class="eyebrow">03 / DECLARATION</span><h2>Nothing to declare?</h2><p>Your sealed envelope contains ${p.bag.count} card${p.bag.count === 1 ? '' : 's'}. Claim they’re all one legal good.<br>Mixed cards are illegal, even when declared as the food they resemble.</p><div class="packing-options"><div><label for="declaration">${p.bag.count} CARD${p.bag.count === 1 ? '' : 'S'} OF</label><select id="declaration">${legalGoodsFor(p).map(k => `<option value="${k}" ${declaration === k ? 'selected' : ''}>${GOODS[k].icon} ${GOODS[k].name}</option>`).join('')}</select></div><div><label for="pack-bribe">OFFER FOR SAFE PASSAGE</label><div class="coin-input"><input id="pack-bribe" ${p.paidPassage ? 'disabled' : ''} type="number" min="0" max="${p.coins}" value="${bribeDraft}" inputmode="numeric"><span>€</span></div></div></div><button class="primary-button" data-action="declare">Make my declaration <span>→</span></button></div>`;
}
function inspectionPanel() {
  if (state.pendingInspection) return `<div class="inspection-awaiting"><span class="eyebrow">INSPECTION IN PROGRESS</span><h2>A decision is pending.</h2><p>Open the inspection window to see the available evidence and ability choices. Sealed cards remain private until opened.</p><button class="primary-button" data-action="open-inspection">View inspection & choices</button></div>`;
  const p = me(), dea = state.players[state.dea].id === selfId;
  const bags = state.players.filter((_, i) => i !== state.dea);
  return `<div class="inspection-intro"><span class="eyebrow">04 / INSPECTION</span><h2>${dea ? 'Trust your instincts.<br>Or take the euros.' : 'A good story goes a long way.'}</h2><p>${dea ? 'Choose any envelope to inspect, or accept its offer for safe passage.' : `${escape(state.players[state.dea].name)} holds the badge. Make your case in table chat.`}</p></div><div class="bag-grid">${bags.map(smuggler => {
    const blocked = inspectionBlocked(state, state.players[state.dea].id, smuggler.id);
    let controls = '<div class="resolved-label">Awaiting the D.E.A.</div>';
    if (smuggler.bag.resolved) controls = '<div class="resolved-label">✓ Decision made</div>';
    else if (dea) controls = `<div class="bag-actions"><button class="secondary-button" data-action="inspect" data-id="${smuggler.id}" ${blocked ? 'disabled' : ''}>Inspect envelope</button><button class="primary-button" data-action="accept-bribe" data-id="${smuggler.id}" data-amount="${smuggler.bag.bribe}">${smuggler.bag.bribe ? `Accept €${smuggler.bag.bribe} & pass` : 'Pass unopened'}</button></div>${p.character === 'light' && !p.abilityUsed ? `<button class="ability-button wide" data-action="kira" data-id="${smuggler.id}" ${blocked ? 'disabled' : ''}>I’m Kira · Inspect</button>` : ''}`;
    else if (smuggler.id === p.id) controls = '<div class="resolved-label">Your live bribe offer is above.</div>';
    if (!smuggler.bag.resolved && dea && p.character === 'l' && !blocked) controls += `${p.abilityRemaining && !smuggler.bag.abilityClaim ? `<button class="ability-button wide" data-action="l-peek" data-id="${smuggler.id}">Master Detective · Sample a card</button>` : ''}${guessForm(smuggler)}`;
    if (!smuggler.bag.resolved && dea && ['zach', 'junior'].includes(p.character) && p.abilityRemaining) controls += `<button class="ability-button wide" data-action="${p.character}" data-id="${smuggler.id}" ${blocked ? 'disabled' : ''}>${p.character === 'zach' ? 'What the fuck is this?' : 'This is Bullshit'} · Inspect</button>`;
    if (!smuggler.bag.resolved && dea && p.character === 'hector' && p.abilityRemaining && !smuggler.bag.abilityClaim) controls += `<button class="ability-button wide" data-action="hector" data-id="${smuggler.id}">This is personal! · Mark & return unopened</button>`;
    if (!smuggler.bag.resolved && !dea && p.character === 'timothy' && p.abilityRemaining && smuggler.id !== p.id && !smuggler.bag.abilityClaim && !blocked) controls += `<button class="ability-button wide" data-action="timothy" data-id="${smuggler.id}">Rat’s Gambit · Force inspection</button>`;
    if (!smuggler.bag.resolved && !dea && p.character === 'fring' && !p.abilityUsed && smuggler.id !== p.id) controls += `<button class="ability-button wide" data-action="fring" data-id="${smuggler.id}">The Boss Man · Take over</button>`;
    if (!smuggler.bag.resolved && dea) controls += requestBribeForm(smuggler);
    return `<article class="bag-card ${smuggler.bag.resolved ? 'resolved' : ''}"><div class="bag-icon">${smuggler.bag.resolved ? '✓' : '✉'}</div><h3>${escape(smuggler.name)} ${smuggler.id === selfId ? '<small>YOU</small>' : ''}</h3><p>“Just <b>${smuggler.bag.count} ${GOODS[smuggler.bag.declaration].name.toLowerCase()}</b>, Agent.”</p><span class="bribe-badge">€${smuggler.bag.bribe} for safe passage</span>${blocked ? '<span class="protection-tag">Kira’s Judgement · May only pass</span>' : ''}${controls}</article>`;
  }).join('')}</div>${state.results.length ? `<div class="latest-result">${state.results.map(r => `<p><b>${escape(r.name)}</b> ${escape(r.message)}</p>`).join('')}</div>` : ''}`;
}
function guessForm(target) {
  if (target.bag.guess) return `<div class="guess-status">Guess on record: ${GOODS[target.bag.guess].name}. Earn €1 per match if the envelope is opened.</div>`;
  const choices = Object.keys(GOODS).filter(key => !isLegalFor(target, key));
  const current = guessDrafts.get(target.id) || choices[0];
  return `<form class="guess-form" data-guess-target="${target.id}"><label for="guess-${target.id}">ONE ILLEGAL-TYPE GUESS · €1 PER MATCH</label><select id="guess-${target.id}" data-guess-for="${target.id}">${choices.map(key => `<option value="${key}" ${key === current ? 'selected' : ''}>${GOODS[key].name}</option>`).join('')}</select><button class="secondary-button" type="submit">Declare guess</button></form>`;
}
function evidenceCard(key, index, action = '', chosen = false) {
  const g = GOODS[key], tag = action ? 'button' : 'div';
  return `<${tag} class="evidence-card ${chosen ? 'selected' : ''}" ${action ? `data-action="${action}" data-index="${index}" aria-pressed="${chosen}"` : ''}>${symbol(key)}<b>${g.name}</b><span>€${g.value} value · €${g.penalty} fine</span>${action === 'dana-choose' ? '<small>TAKE THIS CARD</small>' : ''}</${tag}>`;
}
function inspectionWillShow() { return state?.pendingInspection ? !dismissedInspectionWindows.has(pendingInspectionKey()) : !!(activeInspectionResult || inspectionQueue.length); }
function pendingInspectionKey() { const pending = state?.pendingInspection; return pending ? `${state.round}:${pending.stage}:${pending.target}` : ''; }
function pendingInspectionMarkup() {
  const deadline = state.pendingInspection.expiresAt;
  return `<div ${deadline ? `class="trigger-window" data-trigger-deadline="${deadline}"` : ''}>${deadline ? countdown(deadline) : ''}${pendingInterventions()}${pendingInspectionPanel()}</div>`;
}
function inspectionPlayer(id) { return id === null ? 'Bank' : id === selfId ? 'You' : state.players.find(p => p.id === id)?.name || 'Player'; }
function inspectionResultMarkup(result) {
  const info = result.inspection, payments = info.payments.filter(p => p.amount > 0 || p.settled > 0);
  const net = payments.reduce((total, p) => total + (p.payee === selfId ? p.settled : 0) - (p.payer === selfId && !p.bank ? p.settled : 0), 0);
  const involved = payments.some(p => p.payer === selfId || p.payee === selfId);
  const valueSuffix = payments.some(p => (p.payer === selfId || p.payee === selfId) && p.coins !== p.settled) ? ' in value' : '';
  const headline = net > 0 ? `You receive €${net}${valueSuffix}` : net < 0 ? `You pay €${-net}${valueSuffix}` : !payments.length ? 'No inspection payment' : involved ? 'No net payment for you' : 'Payments settled';
  const name = state.players.find(p => p.id === info.merchant)?.name || result.name;
  return `<div class="inspection-verdict ${info.honest ? 'is-honest' : 'is-bluff'}"><span class="verdict-icon">${info.honest ? '✓' : '⚑'}</span><span class="eyebrow">ROUND ${info.round} · ${escape(name)}’S PACKET</span><h2>${info.honest ? 'Honest declaration.' : 'False declaration.'}</h2><p>Declared ${escape(GOODS[info.declaration]?.name || info.declaration)} · ${result.cards.length} revealed card${result.cards.length === 1 ? '' : 's'}</p><strong class="inspection-payment-headline">${headline}</strong></div><div class="inspection-revealed-grid">${result.cards.map((key, i) => `<div class="inspection-revealed-card ${info.cardMatches[i] ? 'matches' : 'mismatch'}">${evidenceCard(key, i)}<span>${info.cardMatches[i] ? '✓ Matches declaration' : '⚑ Outside declaration'}</span></div>`).join('')}</div><div class="inspection-payment-list">${payments.map(p => `<article><div><b>${escape(p.bank ? 'Bank' : inspectionPlayer(p.payer))} → ${escape(inspectionPlayer(p.payee))}</b><small>${escape(p.kind)}${p.bank && p.payer ? ` · on ${p.payer === selfId ? 'your' : `${escape(inspectionPlayer(p.payer))}’s`} behalf` : ''}</small></div><strong>€${p.amount}</strong>${p.settled !== p.amount || p.coins !== p.settled ? `<p>Settled value: €${p.settled}${p.coins !== p.settled ? `, including €${p.settled - p.coins} in goods` : ''}.${p.settled < p.amount ? ' Unpaid remainder waived.' : ''}</p>` : ''}</article>`).join('') || '<p>No fine or compensation was charged.</p>'}</div><p class="inspection-resolution-note">${escape(result.message)}</p><p class="fine-print">Payments above are already settled automatically. No extra payment is needed.</p>`;
}
function renderInspectionDialog() {
  const dialog = $('#inspection-dialog'); if (!dialog) return;
  let markup = '', mode = null;
  if (state?.pendingInspection) {
    const key = pendingInspectionKey();
    if (!dismissedInspectionWindows.has(key)) { markup = piperPanel(true) + pendingInspectionMarkup(); mode = { type: 'pending', key }; }
  } else {
    if (!activeInspectionResult && inspectionQueue.length) activeInspectionResult = inspectionQueue.shift();
    if (activeInspectionResult && state) { markup = piperPanel(true) + inspectionResultMarkup(activeInspectionResult); mode = { type: 'result', key: activeInspectionResult.inspection.id }; }
  }
  if (!mode) { if (dialog.open) dialog.close(); $('#inspection-dialog-body').innerHTML = ''; inspectionMode = null; inspectionMarkup = ''; return; }
  if (markup !== inspectionMarkup) {
    const same = inspectionMode?.key === mode.key, scroll = $('#inspection-dialog-body').scrollTop;
    $('#inspection-dialog-body').innerHTML = markup; $('#inspection-dialog-body').scrollTop = same ? scroll : 0; inspectionMarkup = markup;
  }
  inspectionMode = mode; $('#inspection-dialog-title').textContent = mode.type === 'result' ? 'INSPECTION RESULT · CARDS & PAYMENTS' : 'INSPECTION · DECISION IN PROGRESS';
  $('#inspection-dialog-done').textContent = mode.type === 'result' && inspectionQueue.length ? 'Next result →' : 'Back to table';
  if (!dialog.open) dialog.showModal();
  updateCountdowns();
}
function closeInspectionDialog() {
  if (inspectionMode?.type === 'pending') dismissedInspectionWindows.add(inspectionMode.key);
  else activeInspectionResult = null;
  $('#inspection-dialog').close(); inspectionMode = null; inspectionMarkup = ''; render();
}
function reviewInspectionButton() { return state.results.some(result => result.inspection) ? '<button class="small-text-button review-inspection-button" data-action="review-inspection">Review latest inspection · Cards & payment ↗</button>' : ''; }

function countdown(deadline) { return `<span class="ability-countdown" data-ability-deadline="${deadline}" role="timer">20s remaining</span>`; }
function piperPanel(inDialog = false) {
  if (!inDialog && inspectionWillShow()) return '';
  return (state.piperOffers || []).map(offer => {
    const payer = state.players.find(p => p.id === offer.from), recipient = state.players.find(p => p.id === offer.to);
    return `<section class="piper-opportunity trigger-window" data-trigger-deadline="${offer.expiresAt}"><span class="eyebrow">THIEF IN THE NIGHT · ACCEPTED BRIBE</span>${countdown(offer.expiresAt)}<p>${escape(payer.name)} paid ${escape(recipient.name)} €${offer.amount}. Piper may claim €${offer.share}; that share is held until she decides or time expires.</p>${selfId === offer.piper ? `<div class="response-actions"><button class="ability-button" data-action="piper-use" data-offer="${offer.id}">Steal €${offer.share}</button><button class="secondary-button" data-action="piper-skip" data-offer="${offer.id}">Skip · Save ability</button></div>` : '<p class="waiting-line">Waiting for Piper’s triggered choice.</p>'}</section>`;
  }).join('');
}
let serverClockOffset = 0;
function updateCountdowns() {
  const now = Date.now() + serverClockOffset;
  document.querySelectorAll('[data-ability-deadline]').forEach(node => { const remaining = Math.max(0, Math.ceil((Number(node.dataset.abilityDeadline) - now) / 1000)); node.textContent = remaining ? `${remaining}s remaining` : 'Time expired · Ability saved'; });
  document.querySelectorAll('[data-trigger-deadline]').forEach(node => { if (Number(node.dataset.triggerDeadline) <= now) node.querySelectorAll('button').forEach(button => button.disabled = true); });
}
setInterval(() => {
  const full = demo || (network?.isHost && network.game);
  if (full && expireAbilities(full)) { if (demo) publishDemo(); else network.publish(); }
  updateCountdowns();
}, 250);
function requestBribeForm(target) {
  const request = target.deaRequest || target.bag?.deaRequest;
  const amount = requestDrafts.get(target.id) ?? request?.amount ?? Math.min(5, target.coins);
  return `<form class="dea-request-form" data-bribe-request-target="${target.id}"><label for="request-${target.id}">REQUEST A BRIBE FOR SAFE PASSAGE</label><div class="join-row"><input id="request-${target.id}" data-request-for="${target.id}" type="number" min="0" step="1" value="${amount}" required inputmode="numeric"><button class="secondary-button" type="submit">${request ? 'Update request' : 'Request bribe'}</button></div><p>${request ? `Current request: €${request.amount}. ` : ''}If ${escape(target.name)} agrees, payment is immediate and their declared packet passes automatically.</p>${request ? `<button class="quiet-button" type="button" data-action="withdraw-request" data-id="${target.id}">Withdraw request</button>` : ''}</form>`;
}
function requestedBribe(p) {
  const request = p.deaRequest || p.bag?.deaRequest; if (!request) return '';
  const waiting = state.pendingInspection && state.pendingInspection.target !== p.id;
  return `<div class="requested-bribe"><span class="eyebrow">D.E.A. REQUESTS €${request.amount}</span><p>Accept to pay €${request.amount} now and guarantee passage once your packet is loaded and declared.</p><div class="response-actions"><button class="primary-button" data-action="accept-request" data-request="${request.id}" ${p.coins < request.amount || waiting ? 'disabled' : ''}>Agree · Pay €${request.amount} & pass</button><button class="secondary-button" data-action="decline-request" data-request="${request.id}">Decline request</button></div>${p.coins < request.amount ? '<p>You do not have enough coins for this request.</p>' : waiting ? '<p>Waiting for the current packet’s decision before you can accept.</p>' : ''}</div>`;
}
function negotiationPanel() {
  const p = me();
  if (!['market', 'pack', 'declare', 'inspect'].includes(state.phase)) return '';
  if (state.players[state.dea].id === p.id) {
    if (state.phase === 'inspect') return '';
    return `<section class="live-negotiation"><span class="eyebrow">EARLY DEALS · D.E.A. NEGOTIATIONS</span><p>Agree on a price before packets are handed over. Accepted deals are paid now and guarantee passage after loading and declarations.</p><div class="early-deal-grid">${state.players.filter((_,i) => i !== state.dea).map(merchant => `<article class="early-deal-card"><h3>${escape(merchant.name)}</h3>${merchant.paidPassage ? `<p class="paid-passage">✓ €${merchant.paidPassage.amount} paid · Passage guaranteed</p>` : `<p>Smuggler’s current offer: €${merchant.bribeOffer}</p><button class="primary-button" data-action="accept-bribe" data-id="${merchant.id}" data-amount="${merchant.bribeOffer}" ${merchant.bribeOffer > merchant.coins ? 'disabled' : ''}>${merchant.bribeOffer ? `Accept €${merchant.bribeOffer} offer` : 'Agree to free passage'}</button>${requestBribeForm(merchant)}`}</article>`).join('')}</div></section>`;
  }
  if (p.bag?.resolved) return '';
  if (p.paidPassage) return `<section class="live-negotiation paid-passage"><span class="eyebrow">PASSAGE ALREADY PAID · €${p.paidPassage.amount}</span><p>Your deal is binding. Load and declare your packet normally; it will pass automatically without a second bribe payment.</p></section>`;
  return `<section class="live-negotiation">${requestedBribe(p)}<span class="eyebrow">LIVE BRIBE OFFER · €${p.bribeOffer}</span><p>Make, change, or revoke your offer until it is accepted. Accepted early deals are paid now and guarantee passage after loading and declarations.</p><form id="bribe-form"><label for="new-bribe">YOUR OFFER TO THE D.E.A.</label><div class="join-row"><input id="new-bribe" type="number" min="0" max="${p.coins}" value="${p.bribeOffer}" required inputmode="numeric"><button class="secondary-button" type="submit">Publish offer</button><button class="quiet-button" data-action="revoke-bribe" type="button">Revoke</button></div></form></section>`;
}
function publicLogPanel() {
  const all = state.publicActions || [];
  const rounds = [...new Set(all.map(entry => entry.round))].sort((a,b) => a-b);
  const matches = all.filter(entry => (publicLogRound === '' || entry.round === Number(publicLogRound)) && entry.text.toLowerCase().includes(publicLogSearch.toLowerCase()));
  const shown = (publicLogExpanded ? matches : matches.slice(-20)).slice().reverse();
  return `<section class="ledger public-action-log"><div class="section-heading"><h2>Public action log</h2><span class="eyebrow">${all.length} PUBLIC EVENTS</span></div><p class="public-log-note">Discards are public. Private draws, hands, unshared samples, and unopened packet contents stay hidden.</p><div class="public-log-filters"><label for="public-log-round">ROUND<select id="public-log-round"><option value="">All rounds</option>${rounds.map(round => `<option value="${round}" ${String(round) === publicLogRound ? 'selected' : ''}>${round ? `Round ${round}` : 'Setup'}</option>`).join('')}</select></label><label for="public-log-search">SEARCH<input type="search" id="public-log-search" placeholder="Player, action, or card…" value="${escape(publicLogSearch)}"></label></div><div class="public-log-entries">${shown.map(entry => `<article><span class="public-log-meta">${entry.round ? `R${entry.round}` : 'SETUP'} · ${escape(new Date(entry.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}))}</span><p>${escape(entry.text)}</p></article>`).join('') || '<p>No matching public actions.</p>'}</div>${matches.length > 20 ? `<button class="small-text-button" data-action="toggle-public-log">${publicLogExpanded ? 'Show latest 20' : `Show all ${matches.length} matching actions`}</button>` : ''}</section>`;
}
function inspectorResponses(target) {
  const p = me(); if (state.players[state.dea].id !== selfId || target.bag.abilityClaim) return '';
  const cards = state.pendingInspection.cards || [];
  if (p.character === 'mike' && p.abilityRemaining && cards.some(key => !isLegalFor(target, key))) return '<button class="ability-button" data-action="mike-use">No Half Measures · Double fine</button>';
  if (p.character === 'carl' && !p.carlStole && cards.some(key => !isLegalFor(target, key))) return `<div class="evidence-grid">${cards.map((key, i) => !isLegalFor(target, key) ? evidenceCard(key, i, 'carl-steal') : '').join('')}</div><p>Click an illegal card to steal it. Its fine still applies.</p>`;
  if (p.character === 'carl' && !p.carlFramed && cards.every(key => key === target.bag.declaration && isLegalFor(target, key))) return `<div class="evidence-grid">${p.hand.map((key, i) => !isLegalFor(p, key) ? evidenceCard(key, i, 'carl-frame') : '').join('')}</div><p>Click one illegal hand card to discard it and frame this honest packet. No compensation or added fine.</p>`;
  return '';
}
function pendingInterventions() {
  const pending = state.pendingInspection, target = state.players.find(p => p.id === pending.target), p = me(); let controls = '';
  if (selfId === pending.inspector && ['dahlia-response', 'dahlia-choice', 'heisenberg-response', 'l-review'].includes(pending.stage)) controls += `<button class="secondary-button" data-action="accept-bribe" data-id="${target.id}" data-amount="${target.bag.bribe}">${target.bag.bribe ? `Accept current €${target.bag.bribe} offer & pass` : 'Cancel inspection · Pass unopened'}</button>`;
  if (['dahlia-response', 'heisenberg-response'].includes(pending.stage) && p.character === 'timothy' && p.abilityRemaining && selfId !== pending.inspector && selfId !== target.id) controls += `<button class="ability-button" data-action="timothy" data-id="${target.id}">Rat’s Gambit · Activate first</button>`;
  if (selfId === pending.inspector && ['dahlia-response', 'dahlia-choice', 'heisenberg-response', 'l-review'].includes(pending.stage)) controls += requestBribeForm(target);
  if (['dana-response', 'pete-response', 'badger-response'].includes(pending.stage)) controls += inspectorResponses(target);
  return controls ? `<div class="response-actions">${controls}</div>` : '';
}
function pendingInspectionPanel() {
  const pending = state.pendingInspection, target = state.players.find(p => p.id === pending.target), inspector = state.players.find(p => p.id === pending.inspector);
  const ownInspector = selfId === inspector.id, ownTarget = selfId === target.id;
  if (['andrew-before', 'andrew-after'].includes(pending.stage)) {
    const before = pending.stage === 'andrew-before';
    if (!ownTarget) return '<div class="inspection-response"><span class="eyebrow">A MYSTERY</span><h2>A mysterious interruption.</h2><p class="waiting-line">Waiting for Andrew. The packet’s contents remain private.</p></div>';
    const cards = before ? target.bag.cards : pending.returnCards;
    const draft = andrewDrafts.get(pendingInspectionKey()) || cards;
    return `<div class="inspection-response"><span class="eyebrow">PRIVATE · GOD ANDREW</span><h2>${before ? 'Inspection committed.' : 'Your cards are returning.'}</h2><p>${before ? 'Choose the cards the inspector will find. These cards determine fines and stolen goods.' : 'Choose what your returned cards become in your stash. The inspection payment is already determined.'} Keep ${cards.length} cards. The deck is unchanged.</p><form id="andrew-change-form"><div class="response-actions"><button class="ability-button" type="button" data-action="andrew-all-burners">All burners</button><button class="secondary-button" type="button" data-action="andrew-all-legal">All legal</button></div><div class="andrew-picker">${cards.map((key, i) => `<label for="andrew-card-${i}">Card ${i + 1}<select id="andrew-card-${i}" data-andrew-index="${i}">${Object.entries(GOODS).map(([value, good]) => `<option value="${value}" ${draft[i] === value ? 'selected' : ''}>${good.name}</option>`).join('')}</select></label>`).join('')}</div><div class="response-actions"><button class="ability-button" type="submit">Apply cards</button><button class="secondary-button" type="button" data-action="andrew-skip">Keep current cards</button></div></form></div>`;
  }
  if (pending.stage === 'dahlia-response') {
    const cards = ownTarget ? target.bag.cards.map((key, i) => evidenceCard(key, i, 'dahlia-card', dahliaSelected.has(i))).join('') : '<p>The packet remains sealed. Only Dahlia can see its cards.</p>';
    const extra = me().character === 'fring' && !me().abilityUsed && !ownInspector && !ownTarget ? `<button class="ability-button" data-action="fring" data-id="${target.id}">The Boss Man · Activate first</button>` : '';
    return `<div class="inspection-response"><span class="eyebrow">SMOKE AND MIRRORS · INSPECTION CHOSEN</span><h2>A little misdirection.</h2><p>Dahlia may secretly remove 1–4 cards, leaving at least one in the packet. The agent then chooses whether to continue; removed cards stay hidden until that choice.</p><div class="evidence-grid">${cards}</div>${ownTarget ? `<div class="response-actions"><button class="ability-button" data-action="dahlia-remove" ${dahliaSelected.size ? '' : 'disabled'}>Hide selected cards (${dahliaSelected.size})</button><button class="secondary-button" data-action="dahlia-skip">Save ability · Continue inspection</button></div>` : '<p class="waiting-line">Waiting for Dahlia to remove cards or continue.</p>'}${extra}</div>`;
  }
  if (pending.stage === 'dahlia-choice') return `<div class="inspection-response"><span class="eyebrow">SMOKE AND MIRRORS · CARDS STILL HIDDEN</span><h2>Continue, or make a deal?</h2><p>Dahlia removed ${pending.removedCount} card(s); ${target.bag.count} remain. Continue to judge only the remaining cards against her declaration, or use the current offer above to cancel and pass. Removed cards are revealed after the decision.</p>${ownTarget ? `<span class="eyebrow">YOUR HIDDEN REMOVALS · PRIVATE TO YOU</span><div class="evidence-grid">${pending.removedCards.map((key, i) => evidenceCard(key, i)).join('')}</div>` : ''}${ownInspector ? '<button class="primary-button" data-action="dahlia-inspect">Continue inspection</button>' : '<p class="waiting-line">Waiting for the D.E.A.’s decision. Bribes can still be changed or revoked.</p>'}</div>`;
  if (pending.stage === 'mike-response' || pending.stage === 'carl-response') return `<div class="inspection-response"><span class="eyebrow">${pending.stage === 'mike-response' ? 'NO HALF MEASURES' : 'CORRUPT COP CARL'} · PACKET OPENED</span><h2>${pending.stage === 'mike-response' ? 'No half measures.' : 'An opportunity for corruption.'}</h2><p>The ordinary inspection payment is €${pending.amount}. The inspector may activate an available ability or continue normally.</p><div class="evidence-grid">${pending.cards.map((key, i) => evidenceCard(key, i)).join('')}</div>${ownInspector ? `${inspectorResponses(target)}<button class="secondary-button" data-action="${pending.stage === 'mike-response' ? 'mike-skip' : 'carl-skip'}">Continue normally · Save ability</button>` : `<p class="waiting-line">Waiting for ${escape(inspector.name)} to choose.</p>`}</div>`;
  if (pending.stage === 'trump-response') {
    const fee = pending.count * (state.players.length >= 5 ? 1 : 2);
    return `<div class="inspection-response"><span class="eyebrow">EXECUTIVE ORDER · QUALIFYING DELIVERY</span><h2>Time to collect the tariff.</h2><p>${escape(target.name)} delivered ${pending.count} illegal cards in one packet. Executive Order makes each other player pay €${fee}. No packet contents are revealed.</p>${ownTarget ? '<div class="response-actions"><button class="ability-button" data-action="trump-use">Executive Order · Collect tariff</button><button class="secondary-button" data-action="trump-skip">Save ability for later</button></div>' : `<p class="waiting-line">Waiting for ${escape(target.name)} to activate or save Executive Order.</p>`}</div>`;
  }
  if (pending.stage === 'pete-response') {
    const controls = ownTarget ? `<div class="packing-options"><div><label for="pete-packet">DELIVERED CARD TO RETURN TO HAND</label><select id="pete-packet">${pending.cards.map((key, i) => `<option value="${i}" ${petePacket === i ? 'selected' : ''}>${GOODS[key].name}</option>`).join('')}</select></div><div><label for="pete-hand">HAND CARD TO DELIVER</label><select id="pete-hand">${target.hand.map((key, i) => `<option value="${i}" ${peteHand === i ? 'selected' : ''}>${GOODS[key].name}</option>`).join('')}</select></div></div><div class="response-actions"><button class="ability-button" data-action="pete-swap">Pete’s Swap · Exchange these cards</button><button class="secondary-button" data-action="pete-skip">Keep packet · Save Pete’s ability</button></div>` : `<p class="waiting-line">Waiting for ${escape(target.name)} to swap or keep the packet.</p>`;
    return `<div class="inspection-response"><span class="eyebrow">PETE’S SWAP · HONEST INSPECTION</span><h2>One quick switch.</h2><p>The inspection was honest. Pete may exchange one packet card for any hand card, including an illegal card. The original €${pending.amount} compensation stays unchanged; the new card has no fine.</p><div class="evidence-grid">${pending.cards.map((key, i) => evidenceCard(key, i)).join('')}</div>${controls}</div>`;
  }
  if (pending.stage === 'badger-response') {
    return `<div class="inspection-response"><span class="eyebrow">BADGER’S BAILOUT · ILLEGAL GOODS FOUND</span><h2>A small fee for your freedom.</h2><p>The normal inspection fine is €${pending.amount}. Badger can pay that fine plus €10 to the bank and keep every packet card. You need €${pending.amount + 10} in coins to use the bailout.</p><div class="evidence-grid">${pending.cards.map((key, i) => evidenceCard(key, i)).join('')}</div>${ownTarget ? `<div class="response-actions"><button class="ability-button" data-action="badger-use" ${target.coins >= pending.amount + 10 ? '' : 'disabled'}>Badger’s Bailout · Pay €${pending.amount + 10} total</button><button class="secondary-button" data-action="badger-skip">Accept confiscation · Save ability</button></div>` : `<p class="waiting-line">Waiting for ${escape(target.name)} to use or save Badger’s Bailout.</p>`}</div>`;
  }
  if (pending.stage === 'heisenberg-response') {
    let controls = ownTarget ? '<div class="response-actions"><button class="ability-button" data-action="heisenberg-use">Say My Name · Challenge inspection</button><button class="secondary-button" data-action="heisenberg-decline">Continue normal inspection</button></div>' : `<p class="waiting-line">Waiting for ${escape(target.name)} to challenge or continue with the inspection.</p>`;
    const p = me();
    if (p.character === 'fring' && !p.abilityUsed && !ownInspector && !ownTarget) controls += `<button class="ability-button" data-action="fring" data-id="${target.id}">The Boss Man · Activate first</button>`;
    if (ownInspector && ['zach', 'junior'].includes(p.character) && p.abilityRemaining) controls += `<button class="ability-button" data-action="${p.character}" data-id="${target.id}">Use my special inspection first</button>`;
    return `<div class="inspection-response"><span class="eyebrow">SAY MY NAME · INSPECTION CHOSEN, ENVELOPE STILL SEALED</span><h2>A chance to raise the stakes.</h2><p>${escape(inspector.name)} chose to inspect ${escape(target.name)}. Heisenberg may now activate his challenge, or save it and continue normally. No cards have been revealed.</p>${controls}</div>`;
  }
  if (pending.stage === 'heisenberg-choice') {
    const controls = ownInspector ? '<div class="response-actions"><button class="primary-button" data-action="heisenberg-inspect">Inspect · Double fines / compensation</button><button class="secondary-button" data-action="heisenberg-backdown">Back down · Heisenberg earns €5</button></div>' : `<p class="waiting-line">Waiting for ${escape(inspector.name)} to accept the doubled inspection or back down.</p>`;
    return `<div class="inspection-response"><span class="eyebrow">SAY MY NAME · CHALLENGE ACTIVE</span><h2>Say my name.</h2><p>Inspect: a false declaration pays double the ordinary fine; an honest envelope receives double compensation. Back down: Heisenberg keeps every card unopened and takes €5 from the bank. The earlier bribe is not paid.</p>${controls}</div>`;
  }
  if (pending.stage === 'selena-fine') {
    const payer = state.players.find(p => p.id === pending.payer), payee = state.players.find(p => p.id === pending.payee);
    const controls = selfId === pending.payer ? `<div class="response-actions"><button class="ability-button" data-action="selena-bank">Vault Venture · Bank pays €${pending.amount}</button><button class="secondary-button" data-action="selena-pay">Pay €${pending.amount} myself · Save ability</button></div>` : `<p class="waiting-line">Waiting for ${escape(payer.name)} to choose a payment source.</p>`;
    return `<div class="inspection-response"><span class="eyebrow">VAULT VENTURE · FINE AMOUNT KNOWN</span><h2>Let the bank pick up the bill.</h2><p><b>${escape(payer.name)}</b> owes <b>€${pending.amount}</b> to <b>${escape(payee.name)}</b>. Selena may spend one Vault Venture use to have the bank pay the whole amount directly, or pay it normally. No payment has been made yet.</p><div class="evidence-grid">${pending.cards.map((key, i) => evidenceCard(key, i)).join('')}</div>${controls}</div>`;
  }
  if (pending.stage === 'l-review') {
    const sample = pending.samples.map((item, i) => item.card ? evidenceCard(item.card, i) : '<div class="private-sample">◈<p>This sample is private to L.</p></div>').join('');
    const canSample = inspector.abilityRemaining && pending.samples.length < target.bag.count;
    return `<div class="inspection-response"><span class="eyebrow">MASTER DETECTIVE · WITHOUT REPLACEMENT</span><h2>A closer look.</h2><p>L has sampled ${pending.samples.length} of ${target.bag.count} cards from ${escape(target.name)}’s packet. Each new sample comes from the unseen cards. All cards still count in the final inspection or delivery.</p><div class="evidence-grid">${sample}</div>${ownInspector ? `<div class="response-actions">${canSample ? `<button class="ability-button" data-action="l-peek" data-id="${target.id}">Sample another unseen card · ${inspector.abilityRemaining} uses left</button>` : ''}${pending.samples.some(item => !item.revealed) ? '<button class="ability-button" data-action="l-share">Reveal sampled cards to everyone</button>' : ''}<button class="primary-button" data-action="l-inspect">Inspect the envelope</button><button class="secondary-button" data-action="l-pass">Let it pass</button></div>${guessForm(target)}` : `<p class="waiting-line">Waiting for ${escape(inspector.name)} to inspect or pass. Nobody else can force it open.</p>`}</div>`;
  }
  if (pending.stage === 'dana-response') {
    return `<div class="inspection-response"><span class="eyebrow">SPLIT DECISION · INSPECTION HAS REVEALED THESE CARDS</span><h2>Two cards. A difficult choice.</h2><p>Dana may select exactly two illegal cards to split with the D.E.A. Only that pair avoids fines; all other mismatches are handled normally.</p><div class="evidence-grid">${pending.cards.map((key, i) => evidenceCard(key, i, ownTarget && !isLegalFor(target, key) ? 'dana-card' : '', danaSelected.has(i))).join('')}</div>${ownTarget ? `<div class="response-actions"><button class="ability-button" data-action="dana-split" ${danaSelected.size === 2 ? '' : 'disabled'}>Split selected pair (${danaSelected.size}/2)</button><button class="secondary-button" data-action="dana-decline">Take the normal inspection</button></div>` : `<p class="waiting-line">Waiting for ${escape(target.name)} to choose a pair or keep the normal inspection.</p>`}</div>`;
  }
  if (pending.stage === 'dana-choice') {
    return `<div class="inspection-response"><span class="eyebrow">SPLIT DECISION · D.E.A. CHOOSES</span><h2>One for you. One for Dana.</h2><p>${escape(inspector.name)} keeps one of these cards; Dana keeps the other. If the inspector takes the higher-value card, Dana receives €4 from the bank.</p><div class="evidence-grid">${pending.pair.map(i => evidenceCard(pending.cards[i], i, ownInspector ? 'dana-choose' : '')).join('')}</div>${!ownInspector ? `<p class="waiting-line">Waiting for ${escape(inspector.name)} to choose.</p>` : ''}</div>`;
  }
  const kim = pending.stage === 'kim-offer', ability = kim ? 'Legal Loophole' : 'Better Call Saul';
  const controls = ownInspector ? `<div class="response-actions"><button class="primary-button" data-action="${kim ? 'kim' : 'jimmy'}-accept">Let it pass · Receive ${kim ? '€15' : '€3 / illegal'}</button><button class="secondary-button" data-action="${kim ? 'kim' : 'jimmy'}-refuse">Open it · Pay €${kim ? '4' : '3'} / legal</button></div>` : `<p class="waiting-line">Waiting for ${escape(inspector.name)} to decide…</p>`;
  return `<div class="inspection-response"><span class="eyebrow">${ability.toUpperCase()} · ACTIVATED BEFORE INSPECTION</span><h2>A very negotiable inspection.</h2><p><b>${escape(target.name)}</b> activated ${ability} before <b>${escape(inspector.name)}</b> chose to inspect. The envelope remains sealed until this offer is settled.</p><p>Open it: all legal goods are delivered, illegal goods are confiscated, and the inspector pays €${kim ? '4' : '3'} per legal card. Let it pass: all goods are delivered and ${kim ? 'Kim pays €15' : 'Jimmy pays €3 per illegal card'}. Normal fines and the original bribe do not apply.</p>${controls}</div>`;
}
function resultsPanel() {
  return `<div class="round-results"><span class="eyebrow">END OF ROUND · PASS THE D.E.A. BADGE</span><h2>Some stories checked out.</h2><div class="result-list">${state.results.map(r => `<article class="result-row"><span class="result-symbol ${r.kind}">${r.kind === 'honest' ? '✓' : r.kind === 'caught' ? '⚑' : '↗'}</span><div><h3>${escape(r.name)}</h3><p>${escape(r.message)}</p>${r.cards ? `<div class="revealed-goods">${r.cards.map(k => `<span title="${GOODS[k].name}">${symbol(k)}</span>`).join('')}</div>` : '<span class="private-label">Contents remain a smuggler’s secret.</span>'}</div></article>`).join('')}</div>${isHost() ? `<button class="primary-button" data-action="next" ${state.piperOffers?.length ? 'disabled' : ''}>${state.round >= state.totalRounds ? 'Count our fortunes' : 'Next round'} <span>→</span></button>` : '<p class="waiting-line">Waiting for the host to continue…</p>'}</div>`;
}
function finishedPanel() {
  const best = state.scores[0].total, winners = state.scores.filter(r => r.total === best);
  return `<section class="final-panel"><span class="victory-icon">♛</span><span class="eyebrow">THE MARKET HAS SPOKEN</span><h1>${winners.map(p => escape(p.name)).join(' & ')}<br><em>${winners.length > 1 ? 'share the crown.' : 'takes the crown.'}</em></h1><p>A fortune of ${best} points. A reputation we won’t discuss.</p><div class="score-table"><table><thead><tr><th>Smuggler</th><th>Euros</th><th>Goods</th><th>Bonuses</th><th>Total</th></tr></thead><tbody>${state.scores.map((r, i) => `<tr class="${r.total === best ? 'winner' : ''}"><th><span class="rank">${i + 1}</span>${escape(r.name)}${r.id === selfId ? ' <small>YOU</small>' : ''}<span class="award-detail">${r.awards.map(escape).join(' · ') || 'An independent smuggler'}</span></th><td>${r.coins}</td><td>${r.goods}</td><td>${r.bonus}</td><td><b>${r.total}</b></td></tr>`).join('')}</tbody></table></div><button class="primary-button" data-action="leave">Back to the table <span>→</span></button></section>`;
}
function chatPanel() {
  return `<aside class="table-chat"><div class="chat-heading"><h2>Table talk <span>◌</span></h2><p>Good deals start with a conversation.</p></div><div class="chat-messages" id="chat-messages" role="log" aria-label="Table chat" aria-live="polite">${state.chat.length ? state.chat.map(m => `<div class="chat-message"><b>${escape(m.name)}</b><p>${escape(m.text)}</p></div>`).join('') : '<div class="chat-empty"><span>“</span><p>A suspiciously quiet table.<br>Someone should say something.</p></div>'}</div><form id="chat-form"><label class="sr-only" for="chat-text">Message to the table</label><div class="chat-input"><input id="chat-text" maxlength="240" placeholder="Make your case…" value="${escape(chatDraft)}" autocomplete="off" required><button type="submit" aria-label="Send message">↑</button></div></form><div class="chat-footnote"><span class="status-dot"></span> ${demo ? 'Practice table · bots don’t chat' : 'Live table chat · visible to everyone'}</div></aside>`;
}
function game() {
  const steps = ['market', 'pack', 'declare', 'inspect', 'results'], index = steps.indexOf(state.phase);
  const dea = state.players[state.dea];
  return `${header()}<main class="table-main">${status === 'disconnected' || status === 'error' ? `<div class="disconnect-banner" role="alert">Connection lost. Keep this tab open and rejoin to recover your seat. <button class="secondary-button" data-action="rejoin">Rejoin table</button></div>` : status && status !== 'connected' ? `<div class="notice">${escape(status)}</div>` : ''}${state.phase === 'lobby' ? lobby() : state.phase === 'finished' ? finishedPanel() + publicLogPanel() : `<div class="game-topline"><div><span class="eyebrow">${demo ? 'PRACTICE TABLE' : `ROOM ${escape(currentCode())}`}</span><h1>Let the games begin.</h1></div><div class="round-counter"><span>ROUND</span><strong>${state.round}<small> / ${state.totalRounds}</small></strong></div></div><div class="players-row">${state.players.map(playerTile).join('')}</div><div class="table-columns"><div class="play-column"><div class="phase-bar">${steps.map((s, i) => `<span class="${index === i ? 'active' : index > i ? 'complete' : ''}"><b>${index > i ? '✓' : `0${i + 1}`}</b> ${phaseNames[s]}</span>`).join('')}</div>${abilityPanel()}${contestSummary()}${piperPanel()}${negotiationPanel()}<section class="action-panel">${state.phase === 'market' ? marketPanel() : state.phase === 'pack' ? packPanel() : state.phase === 'declare' ? declarationPanel() : state.phase === 'inspect' ? inspectionPanel() : resultsPanel()}</section>${reviewInspectionButton()}${handPanel()}${publicLogPanel()}</div>${chatPanel()}</div>`}</main><footer class="table-footer"><span>BETTER SMUG DRUG · THE ONLINE TABLE</span><button data-action="rules">Need a little guidance? ↗</button><span>${demo ? 'PRACTICE MODE' : 'HOST KEEPS THE TABLE OPEN'}</span></footer>`;
}
function render() {
  const active = document.activeElement, focusId = active?.id;
  const offerDraft = focusId === 'new-bribe' ? active.value : null;
  const focusedCard = ['card', 'dana-card', 'dahlia-card', 'carl-steal', 'carl-frame', 'rick-card', 'rick-hand'].includes(active?.dataset?.action) ? { action: active.dataset.action, index: active.dataset.index } : null;
  const start = active?.selectionStart, end = active?.selectionEnd;
  const chatBox = $('#chat-messages'), atBottom = !chatBox || chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < 45;
  const scroll = chatBox?.scrollTop || 0;
  $('#app').innerHTML = screen === 'home' ? home() : game();
  renderInspectionDialog();
  if (focusId) {
    const next = document.getElementById(focusId);
    if (next) { if (offerDraft !== null) next.value = offerDraft; next.focus({ preventScroll: true }); if (start != null && ['text', 'search'].includes(next.type)) next.setSelectionRange(start, end); }
  }
  if (focusedCard !== null) document.querySelector(`[data-action="${focusedCard.action}"][data-index="${focusedCard.index}"]`)?.focus({ preventScroll: true });
  const box = $('#chat-messages'); if (box) box.scrollTop = atBottom ? box.scrollHeight : scroll;
}
function currentCode() { return demo ? 'PRACTICE' : network?.code || code; }
function receive(next) {
  for (const result of next.results) {
    const id = result.inspection?.id; if (!id || !Array.isArray(result.cards) || seenInspectionResults.has(id)) continue;
    seenInspectionResults.add(id); if (state) inspectionQueue.push(result);
  }
  if (state?.round !== next.round) requestDrafts.clear();
  const enteringDeclaration = next.phase === 'declare' && (state?.phase !== 'declare' || state.round !== next.round);
  const nextPendingKey = `${next.round}:${next.pendingInspection?.stage}:${next.pendingInspection?.target}`;
  if (nextPendingKey !== pendingKey) { danaSelected.clear(); dahliaSelected.clear(); petePacket = 0; peteHand = 0; pendingKey = nextPendingKey; }
  const nextRickKey = JSON.stringify(next.rickDiscard);
  if (nextRickKey !== rickPileKey) { rickSelected.clear(); rickPileKey = nextRickKey; }
  if (state?.players.find(p => p.id === selfId)?.character === 'rick' && !state.players.find(p => p.id === selfId)?.abilityUsed && next.players.find(p => p.id === selfId)?.abilityUsed) selected.clear();
  const previousOffer = state?.players.find(p => p.id === selfId)?.bribeOffer;
  state = next; screen = 'table'; busy = false; serverClockOffset = (next.serverNow || Date.now()) - Date.now();
  if (previousOffer !== me()?.bribeOffer) bribeDraft = me()?.bribeOffer || 0;
  if (enteringDeclaration && me()?.bag?.cards) {
    const cards = me().bag.cards;
    declaration = legalGoodsFor(me()).reduce((best, key) => cards.filter(c => c === key).length > cards.filter(c => c === best).length ? key : best, LEGAL[0]);
  }
  const key = `${next.round}:${next.phase}:${me()?.ready}`;
  if (key !== selectionKey) { selectionKey = key; selected.clear(); bribeDraft = me()?.bribeOffer || 0; discardCrowbarsDraft = 0; }
  render(); updateCountdowns(); scheduleBots();
}
function publishDemo() { archiveIfFinished(demo); demo.revision++; receive(viewFor(demo, selfId)); }
function send(action) {
  try { if (demo) { act(demo, selfId, action); publishDemo(); } else network.send(action); }
  catch (error) { toast(error.message); }
}
function scheduleBots() {
  clearTimeout(botTimer);
  const full = demo || (network?.isHost && network.game);
  if (!full || ['lobby', 'finished'].includes(full.phase) || (full.phase === 'results' && !full.piperOffers?.length)) return;
  botTimer = setTimeout(() => {
    for (const p of full.players.filter(p => p.bot)) {
      const action = botAction(full, p.id); if (!action) continue;
      try { act(full, p.id, action); if (demo) publishDemo(); else network.publish(); } catch (error) { toast(error.message); }
      return;
    }
  }, 1100 + Math.random() * 600);
}
function destroySession() { andrewDrafts.clear(); cheatKeys.clear(); inspectionQueue = []; activeInspectionResult = null; seenInspectionResults.clear(); dismissedInspectionWindows.clear(); inspectionMode = null; inspectionMarkup = ''; $('#inspection-dialog')?.close(); clearTimeout(botTimer); network?.destroy(); network = null; demo = null; }
function startConnection(mode, smugglerName, room) {
  destroySession(); busy = true; status = ''; lastError = ''; render();
  network = new TableNetwork({ token: guestSecret, analyticsId: localAnalyticsId, onHostState: archiveIfFinished, onState: receive, onStatus: next => { status = next; if (next === 'error') busy = false; render(); }, onError: message => { lastError = message; busy = false; toast(message); render(); } });
  try {
    if (mode === 'host') network.host(smugglerName, selfId); else network.join(room, smugglerName, selfId);
  } catch (error) { busy = false; lastError = error.message; toast(error.message); render(); }
}
function leave() {
  if (state && state.phase !== 'finished' && !confirm(isHost() && !demo ? 'Close this table for everyone? The game cannot be restored.' : 'Leave this table?')) return;
  destroySession(); state = null; screen = 'home'; status = ''; busy = false; lastError = ''; selected.clear(); code = ''; history.replaceState(null, '', location.pathname); render();
}
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === 'andrew-all-burners' || action === 'andrew-all-legal') {
    const pending = state?.pendingInspection, owner = me();
    if (!pending || pending.target !== selfId || !['andrew-before', 'andrew-after'].includes(pending.stage)) return;
    const cards = pending.stage === 'andrew-before' ? owner.bag.cards : pending.returnCards;
    const good = action === 'andrew-all-burners' ? 'burnerPhone' : owner.bag.declaration;
    return send({ type: 'andrew-change', cards: cards.map(() => good) });
  }
  if (action === 'andrew-skip') return send({ type: action });
  if (action === 'close-inspection') return closeInspectionDialog();
  if (action === 'open-inspection') { dismissedInspectionWindows.delete(pendingInspectionKey()); render(); return; }
  if (action === 'review-inspection') { const result = [...state.results].reverse().find(r => r.inspection); if (result) { activeInspectionResult = result; render(); } return; }
  if (action === 'home') { event.preventDefault(); if (state) leave(); return; }
  if (action === 'characters') { $('#characters').showModal(); return; }
  if (action === 'close-characters') { $('#characters').close(); return; }
  if (['challenge', 'fring', 'kira', 'l-peek', 'zach', 'junior', 'hector', 'timothy'].includes(action)) return send({ type: action, target: button.dataset.id });
  if (['skip-challenge', 'jimmy', 'jimmy-accept', 'jimmy-refuse', 'kim', 'kim-accept', 'kim-refuse', 'surveil', 'skip-surveillance', 'dana-decline', 'l-share', 'l-inspect', 'l-pass', 'heisenberg-use', 'heisenberg-decline', 'heisenberg-backdown', 'heisenberg-inspect', 'selena-bank', 'selena-pay', 'pete-skip', 'badger-use', 'badger-skip', 'trump-use', 'trump-skip', 'dahlia-skip', 'dahlia-inspect', 'mike-use', 'mike-skip', 'carl-skip'].includes(action)) return send({ type: action });
  if (action === 'cards') { $('#cards').showModal(); return; }
  if (action === 'close-cards') { $('#cards').close(); return; }
  if (action === 'rules') { $('#rules').showModal(); return; }
  if (action === 'close-rules') { $('#rules').close(); return; }
  if (action === 'leave') return leave();
  if (action === 'rejoin') { startConnection('join', name, currentCode()); return; }
  if (action === 'demo') {
    destroySession(); name = $('#merchant-name')?.value.trim() || name || 'Just Bread'; save('better-smug-drug-name', name);
    demo = createGame(selfId, name); demo.players[0].analyticsId = localAnalyticsId; addPlayer(demo, 'bot-baker', 'The Baker', true); addPlayer(demo, 'bot-fishy', 'Fishy Business', true);
    status = 'connected'; publishDemo(); return;
  }
  if (action === 'copy') {
    const url = new URL(location.href); url.search = ''; url.searchParams.set('room', currentCode());
    try { await navigator.clipboard.writeText(url.href); toast('Invite link copied. Your co-conspirators await.'); }
    catch { prompt('Copy this invitation link:', url.href); } return;
  }
  if (action === 'add-bot' || action === 'remove') {
    if (!isHost()) return;
    const full = demo || network.game;
    try {
      if (action === 'remove') { const conn = network?.connections.get(button.dataset.id); if (conn) { conn.send({ type: 'rejected', message: 'The host removed your seat from the table.' }); network.connections.delete(button.dataset.id); setTimeout(() => conn.close(), 250); } removePlayer(full, button.dataset.id); }
      else { const botName = botNames.find(n => !full.players.some(p => p.name === n)) || 'The Courier'; addPlayer(full, uid(), botName, true); }
      if (demo) publishDemo(); else network.publish();
    } catch (error) { toast(error.message); } return;
  }
  if (action === 'piper-use' || action === 'piper-skip') return send({ type: action, offer: button.dataset.offer });
  if (action === 'toggle-public-log') { publicLogExpanded = !publicLogExpanded; render(); return; }
  if (action === 'withdraw-request') return send({ type: 'request-bribe', target: button.dataset.id, amount: null });
  if (action === 'accept-request' || action === 'decline-request') return send({ type: action, request: button.dataset.request });
  if (action === 'revoke-bribe') { if ($('#new-bribe')) $('#new-bribe').value = 0; return send({ type: 'bribe', amount: 0 }); }
  if (action === 'accept-bribe') return send({ type: action, target: button.dataset.id, expectedAmount: Number(button.dataset.amount) });
  if (action === 'carl-steal' || action === 'carl-frame') return send({ type: action, index: Number(button.dataset.index) });
  if (action === 'dahlia-card') { const i = Number(button.dataset.index); if (dahliaSelected.has(i)) dahliaSelected.delete(i); else if (dahliaSelected.size < Math.min(4, me().bag.cards.length - 1)) dahliaSelected.add(i); else return toast('Leave at least one card, and remove no more than four.'); render(); return; }
  if (action === 'dahlia-remove') return send({ type: action, indices: [...dahliaSelected] });
  if (action === 'pete-swap') return send({ type: action, index: petePacket, handIndex: peteHand });
  if (action === 'rick') return send({ type: action, indices: [...selected], discardIndices: [...rickSelected], revision: state.revision });
  if (action === 'rick-card' || action === 'rick-hand') {
    const set = action === 'rick-card' ? rickSelected : selected, index = Number(button.dataset.index);
    if (set.has(index)) set.delete(index); else if (set.size < 3) set.add(index); else return toast('Select exactly three cards for Dumpster Dive.');
    render(); return;
  }
  if (action === 'dana-card') {
    const index = Number(button.dataset.index);
    if (danaSelected.has(index)) danaSelected.delete(index); else if (danaSelected.size < 2) danaSelected.add(index); else return toast('Choose only two illegal cards for Split Decision.');
    render(); return;
  }
  if (action === 'dana-split') return send({ type: action, indices: [...danaSelected] });
  if (action === 'dana-choose') return send({ type: action, index: Number(button.dataset.index) });
  if (action === 'card') {
    const index = Number(button.dataset.index);
    if (state.phase === 'pack' && me().hand[index] === 'usedNeedle' && !selected.has(index) && [...selected].some(i => me().hand[i] === 'usedNeedle')) return toast('Only one Used Needle may go in each packet.');
    if (selected.has(index)) selected.delete(index); else if (selected.size < 5) selected.add(index); else { toast('Your envelope can hold at most 5 cards.'); return; }
    render(); return;
  }
  if (action === 'exchange') return send({ type: 'exchange', indices: [...selected], discardCrowbars: Number($('#discard-crowbars')?.value || 0) });
  if (action === 'pack') return send({ type: 'pack', indices: [...selected] });
  if (action === 'declare') return send({ type: 'declare', declaration, bribe: Number($('#pack-bribe').value) });
  if (action === 'start' || action === 'next') return send({ type: action });
  if (action === 'pass' || action === 'inspect') return send({ type: action, target: button.dataset.id });
});
document.addEventListener('change', event => {
  if (event.target.id === 'public-log-round') { publicLogRound = event.target.value; render(); return; }
  if (event.target.id === 'pete-packet') petePacket = Number(event.target.value);
  if (event.target.id === 'pete-hand') peteHand = Number(event.target.value);
  if (event.target.dataset.characterPlayer) send({ type: 'choose-character', target: event.target.dataset.characterPlayer, character: event.target.value || null });
});
document.addEventListener('input', event => {
  if (event.target.id === 'public-log-search') { publicLogSearch = event.target.value; render(); return; }
  if (event.target.dataset.requestFor) requestDrafts.set(event.target.dataset.requestFor, event.target.value);
  if (event.target.dataset.guessFor) guessDrafts.set(event.target.dataset.guessFor, event.target.value);
  if (event.target.id === 'discard-crowbars') discardCrowbarsDraft = Number(event.target.value);
  if (event.target.id === 'chat-text') chatDraft = event.target.value;
  if (event.target.id === 'declaration') declaration = event.target.value;
  if (event.target.id === 'pack-bribe') bribeDraft = event.target.value;
  if (event.target.id === 'merchant-name') name = event.target.value;
  if (event.target.id === 'room-code') { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''); code = event.target.value; }
});
document.addEventListener('submit', event => {
  if (event.target.id === 'andrew-change-form') { event.preventDefault(); return send({ type: 'andrew-change', cards: [...event.target.querySelectorAll('[data-andrew-index]')].map(select => select.value) }); }
  if (event.target.dataset.bribeRequestTarget) { event.preventDefault(); return send({ type: 'request-bribe', target: event.target.dataset.bribeRequestTarget, amount: Number(event.target.querySelector('input').value) }); }
  if (event.target.dataset.guessTarget) { event.preventDefault(); return send({ type: 'l-guess', target: event.target.dataset.guessTarget, good: event.target.querySelector('select').value }); }
  if (!['room-form', 'chat-form', 'bribe-form'].includes(event.target.id)) return;
  event.preventDefault();
  if (event.target.id === 'room-form') {
    name = $('#merchant-name').value.trim(); code = $('#room-code').value.trim().toUpperCase();
    if (!name) return toast('Every smuggler needs a name.');
    const mode = event.submitter?.dataset.intent || (code ? 'join' : 'host');
    if (mode === 'join' && !/^[A-Z2-9]{6}$/.test(code)) return toast('Enter a six-character room code.');
    save('better-smug-drug-name', name); startConnection(mode, name, code);
  } else if (event.target.id === 'chat-form') {
    const text = $('#chat-text').value.trim(); if (!text) return;
    chatDraft = ''; $('#chat-text').value = ''; send({ type: 'chat', text });
  } else send({ type: 'bribe', amount: Number($('#new-bribe').value) });
});
$('#goods-guide').innerHTML = LEGAL.map(key => { const g = GOODS[key]; return `<div><span>${symbol(key)} ${g.name}</span><span>Kingpin €${g.king} · Queenpin €${g.queen}</span></div>`; }).join('');
$('#card-catalog').innerHTML = [
  ['Legal goods', 'Blue border. Declare these honestly, or use them as your cover story.', key => GOODS[key].legal],
  ['Illegal goods', 'Red border. Keep these out of the D.E.A.’s hands.', key => !GOODS[key].legal && !GOODS[key].category],
  ['Mixed goods', 'Illegal during inspection. Each delivered card counts as 2 of its matching legal good for Kingpin / Queenpin bonuses.', key => GOODS[key].category === 'mixed'],
  ['Blue Sky & Burner Phone', 'Illegal goods, with no special effects. Included in the deck.', key => GOODS[key].category === 'extra'],
  ['Character special cards', 'Added only for Pinkman or Nile. Chili Powder is illegal with no fine; Used Needles count as honest goods. Used needles and caught Chili Powder leave the game permanently.', key => GOODS[key].special]
].map(([title, description, filter]) => `<section class="catalog-section"><h3>${title}</h3><p>${description}</p><div class="catalog-grid">${Object.keys(GOODS).filter(filter).map(key => `<figure>${card(key, 0, false)}<figcaption>${GOODS[key].special ? key === 'usedNeedle' ? '2 starting cards for Nile' : '1 starting card for Pinkman' : `${GOODS[key].count} copies`}${GOODS[key].majority ? ` · 2× ${GOODS[GOODS[key].majority].name}` : ''}</figcaption></figure>`).join('')}</div></section>`).join('');
$('#catalog-count').textContent = `${CATALOG_SIZE} BASE CARDS · 17 TYPES + 2 SPECIALS`;
$('#character-guide').innerHTML = Object.entries(CHARACTERS).map(([key, c]) => `<article class="character-guide-card">${portrait(key)}<div><span class="eyebrow">${c.timing}</span><h3>${c.name}</h3><h4>${c.ability}</h4><p>${c.description}</p></div></article>`).join('');
for (const id of ['rules', 'cards', 'characters']) document.getElementById(id).addEventListener('click', event => { const d = event.currentTarget; if (event.target === d) { const r = d.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) d.close(); } });
addEventListener('beforeunload', event => { if (state && !demo && state.phase !== 'finished') { event.preventDefault(); event.returnValue = ''; } });
render();

addEventListener('keydown', event => { if (event.altKey && event.shiftKey && event.code === 'KeyA') { event.preventDefault(); window.open(new URL('./analytics.html', location.href), '_blank', 'noopener'); } });

$('#inspection-dialog').addEventListener('cancel', event => { event.preventDefault(); closeInspectionDialog(); });
$('#inspection-dialog').addEventListener('click', event => { if (event.target !== event.currentTarget) return; const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeInspectionDialog(); });

// The chord is deliberately absent from the character guide.
const andrewDrafts = new Map(), cheatKeys = new Set();
addEventListener('change', event => {
  if (event.target.matches('[data-andrew-index]')) andrewDrafts.set(pendingInspectionKey(), [...document.querySelectorAll('[data-andrew-index]')].map(select => select.value));
});
addEventListener('keydown', event => {
  if (!['KeyC', 'KeyH', 'KeyE', 'KeyA', 'KeyT'].includes(event.code) || event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
  cheatKeys.add(event.code);
  if (cheatKeys.size === 5 && state && !['lobby', 'finished'].includes(state.phase) && me()?.character === 'andrew' && !me().godAndrew) {
    event.preventDefault(); cheatKeys.clear(); send({ type: 'andrew-awaken' });
  }
});
addEventListener('keyup', event => cheatKeys.delete(event.code));
addEventListener('blur', () => cheatKeys.clear());
