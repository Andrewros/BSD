import { GOODS, CHARACTERS } from './engine.js';
import { summarize, playerLabel, exportArchive, readImport, packetsCSV } from './analytics-core.js';
import { allGames, saveGames, deleteAllGames } from './analytics-store.js';
const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = value => `${(value * 100).toFixed(1)}%`, decimal = value => value.toFixed(1);
let games = [];
function filters() {
  const from = $('#filter-from').value, to = $('#filter-to').value;
  return { player: $('#filter-player').value, character: $('#filter-character').value, includePractice: $('#include-practice').checked, playerCount: Number($('#filter-size').value) || null,
    from: from ? new Date(`${from}T00:00:00`).getTime() : null, to: to ? new Date(`${to}T23:59:59.999`).getTime() : null };
}
function status(message) { $('#analytics-status').textContent = message; }
function table(headers, rows, empty = 'No matching observations yet.') {
  if (!rows.length) return `<p>${empty}</p>`;
  return `<div class="analytics-scroll"><table><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function bar(rate) { return `${pct(rate)}<span class="mini-bar"><i style="width:${Math.max(0, Math.min(100, rate * 100))}%"></i></span>`; }
function symbol(key) { return `<svg class="card-symbol" viewBox="0 0 100 100" aria-hidden="true"><use href="./assets/cards.svg#${key}"></use></svg>`; }
function render() {
  const f = filters(), stats = summarize(games, f), selected = games.filter(g => (f.includePractice || !g.practice) && (!f.playerCount || g.players.length === f.playerCount) && (!f.from || g.finishedAt >= f.from) && (!f.to || g.finishedAt <= f.to));
  const filtered = selected.filter(g => g.players.some(p => (!f.player || p.anonymousId === f.player) && (!f.character || p.character === f.character)));
  const metrics = [
    ['Completed games', stats.games, `${stats.observations} player outcomes · ${stats.packets} packets`],
    ['Bluff frequency', pct(stats.bluffRate), `${stats.bluffs} original false declarations`],
    ['Bluffs passed unopened', pct(stats.bluffPassRate), 'Out of original bluff packets'],
    ['Inspection hit rate', pct(stats.hitRate), 'False remaining packets / opened packets'],
    ['Average final score', decimal(stats.averageScore), 'Coins + goods + majority bonuses'],
    ['Inspection frequency', pct(stats.inspectionRate), 'Full openings, excluding samples alone'],
    ['Paid bribes', stats.paidBribes, 'Only positive payments, not offers'],
    ['Bribe coins paid', `€${stats.bribeCoins}`, 'Before Piper’s share is taken']
  ];
  let html = `<div class="analytics-metrics">${metrics.map(([label, value, note]) => `<article class="metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join('')}</div>`;
  if (!stats.games) {
    html += `<div class="analytics-empty"><span class="eyebrow">NO STORIES ON FILE</span><h2>A clean record. For now.</h2><p>${games.length ? 'No games match these filters. Turn on “Include games with bots” to see practice data.' : 'Finish a game hosted in this browser, or import a game archive. Records are saved after final scoring, so live hidden cards never appear here.'}</p></div>`;
  } else {
    const best = stats.bestCard;
    html += `<section class="best-card">${best ? symbol(best.key) : '<span aria-hidden="true">◇</span>'}<div><span class="eyebrow">OBSERVED CARD PERFORMANCE</span><h2>${best ? `${best.name} leads this sample.` : 'More games before a verdict.'}</h2><p>${best ? `${pct(best.holderWinRate)} win rate across ${best.holders} final-stash holdings. Ranked by a conservative 95% Wilson lower bound, among cards with at least 10 holder outcomes.` : 'A card needs at least 10 final-stash holder outcomes to enter the ranking.'} These are associations, not proof of card strength. Player skill, character, and table size also affect results.</p></div></section>`;
    html += `<section class="analytics-section"><h2>Character fortunes</h2><p>Wins include shared victories. A character with only a few games can have a misleading win rate.</p>${table(['Character', 'Games', 'Wins', 'Win rate', 'Average score', 'Bluff rate'], stats.characters.map(r => [escape(r.name), r.games, r.wins, bar(r.winRate), decimal(r.averageScore), pct(r.bluffRate)]))}</section>`;
    html += `<section class="analytics-section"><h2>Player tells</h2><p>Random browser IDs identify repeat players. A bluff means the original declaration was false under that round’s rules, including mixed goods and character exceptions. Ability changes are tracked separately in packet exports.</p>${table(['Player', 'Games', 'Wins', 'Win rate', 'Average score', 'Packets', 'Bluff rate', 'Bluffs passed', 'Inspected'], stats.players.map(r => [escape(r.name), r.games, r.wins, pct(r.winRate), decimal(r.averageScore), r.packets, bar(r.bluffRate), pct(r.bluffPassRate), pct(r.inspectionRate)]))}</section>`;
    html += `<section class="analytics-section"><h2>What gets through?</h2><p>Delivery rate is cards delivered to their owner / cards loaded (including cards added by a swap). Final-stash win rates include all ways of obtaining goods. Values below use printed values, before character bonuses or majority scoring.</p>${table(['Card', 'Loaded', 'Delivered', 'Delivery rate', 'Value per loaded card', 'Final holders', 'Winning holders', 'Holder win rate'], stats.cards.map(r => [escape(r.name), r.loaded, r.delivered, bar(r.deliveryRate), `€${decimal(r.expectedDeliveredValue)}`, r.holders, r.holderWins, pct(r.holderWinRate)]))}</section>`;
    html += `<section class="analytics-section"><h2>The game ledger</h2>${table(['Finished', 'Game', 'Players', 'Type', 'Rounds', 'Packets', 'Actions'], filtered.sort((a,b) => b.finishedAt-a.finishedAt).map(g => [escape(new Date(g.finishedAt).toLocaleString()), escape(g.id.slice(0,8)), g.players.length, g.practice ? 'Practice / mixed' : 'Human', g.rounds, g.packets.length, g.events.length]))}<details class="game-details"><summary>Recent action history · last 100 matching actions</summary><div class="event-list">${table(['Time', 'Round', 'Player', 'Action', 'Coin changes'], filtered.flatMap(g => g.events.filter(e => e.actor >= 0 && (!f.player || g.players[e.actor].anonymousId === f.player) && (!f.character || g.players[e.actor].character === f.character)).map(e => ({ g, e }))).sort((a,b) => b.e.at-a.e.at).slice(0,100).map(({g,e}) => [escape(new Date(e.at).toLocaleTimeString()), e.round, escape(playerLabel(g.players[e.actor])), escape(e.type), escape(e.coinDeltas.map((v,i) => v ? `${playerLabel(g.players[i])}: ${v > 0 ? '+' : ''}${v}` : '').filter(Boolean).join(' · ') || '—')]))}</div></details></section>`;
  }
  $('#analytics-content').innerHTML = html;
  $('#export-json').disabled = !games.length; $('#export-csv').disabled = !games.length; $('#clear-data').disabled = !games.length;
}
async function load() {
  games = await allGames();
  const player = $('#filter-player').value, character = $('#filter-character').value;
  const people = new Map(); for (const game of games) for (const p of game.players) if (!p.bot) people.set(p.anonymousId, playerLabel(p));
  $('#filter-player').innerHTML = '<option value="">All players</option>' + [...people].map(([id, label]) => `<option value="${escape(id)}">${escape(label)}</option>`).join('');
  $('#filter-character').innerHTML = '<option value="">All characters</option>' + Object.entries(CHARACTERS).map(([key, c]) => `<option value="${key}">${c.name}</option>`).join('');
  $('#filter-player').value = people.has(player) ? player : ''; $('#filter-character').value = character;
  render();
}
function download(filename, data, type) { const url = URL.createObjectURL(new Blob([data], { type })), a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
$('#export-json').onclick = () => download(`better-smug-drug-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(exportArchive(games), null, 2), 'application/json');
$('#export-csv').onclick = () => download('better-smug-drug-packets.csv', packetsCSV(games), 'text/csv');
$('#import-file').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  try { if (file.size > 50 * 1024 * 1024) throw Error('Import files must be under 50 MB.'); const imported = readImport(JSON.parse(await file.text())); const existing = new Set(games.map(g => g.id)); await saveGames(imported); await load(); status(`Imported ${imported.filter(g => !existing.has(g.id)).length} new game(s); ${imported.filter(g => existing.has(g.id)).length} existing game(s) updated. Duplicate games are not counted twice.`); }
  catch (error) { status(error.message); }
  event.target.value = '';
};
$('.analytics-filters').onchange = render;
$('#reset-filters').onclick = () => { for (const field of $('.analytics-filters').querySelectorAll('select,input')) { if (field.type === 'checkbox') field.checked = false; else field.value = ''; } render(); };
$('#clear-data').onclick = () => $('#delete-dialog').showModal();
$('#cancel-delete').onclick = () => $('#delete-dialog').close();
$('#confirm-delete').onclick = async () => { try { await deleteAllGames(); $('#delete-dialog').close(); await load(); status('Local game records deleted.'); } catch (error) { status(error.message); } };
addEventListener('focus', () => load().catch(error => status(error.message)));
load().catch(error => { status(error.message); $('#analytics-content').innerHTML = '<div class="analytics-empty"><h2>Storage is unavailable.</h2><p>Open this page from the game’s normal website in a browser that allows local storage.</p></div>'; });
