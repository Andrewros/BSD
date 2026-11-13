import { completedGame, validateGame } from './analytics-core.js';
const DB_NAME = 'better-smug-drug-analytics', DB_VERSION = 1;
let database;
function openDB() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore('games', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = null; reject(Error('Browser analytics storage is unavailable.')); };
  });
  return database;
}
async function transaction(mode, operation) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('games', mode), store = tx.objectStore('games');
    const result = operation(store);
    tx.oncomplete = () => resolve(result?.result); tx.onerror = tx.onabort = () => reject(Error('Could not save analytics; browser storage may be full.'));
  });
}
export async function allGames() { return transaction('readonly', store => store.getAll()); }
export async function saveGames(games) {
  const valid = games.map(validateGame); // Validate everything before opening a write transaction.
  await transaction('readwrite', store => { for (const game of valid) store.put(game); });
}
export async function deleteAllGames() { await transaction('readwrite', store => store.clear()); }
const archived = new Set();
export async function archiveCompletedGame(g) {
  if (g.phase !== 'finished' || !g.analytics || archived.has(g.analytics.id)) return false;
  const archive = completedGame(g); archived.add(archive.id);
  try { await saveGames([archive]); return true; } catch (error) { archived.delete(archive.id); throw error; }
}
export function anonymousPlayerId() {
  try { let id = localStorage.getItem('bsd-analytics-player-id'); if (!/^[a-f0-9-]{36}$/.test(id || '')) { id = crypto.randomUUID(); localStorage.setItem('bsd-analytics-player-id', id); } return id; }
  catch { return crypto.randomUUID(); }
}
