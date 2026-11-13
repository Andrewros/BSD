import { createGame, addPlayer, act, viewFor } from './engine.js';

const PREFIX = 'better-smug-drug-v15-';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function roomCode() {
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), n => ALPHABET[n % ALPHABET.length]).join('');
}
export class TableNetwork {
  constructor({ onState, onStatus, onError, token = crypto.randomUUID(), PeerClass = globalThis.Peer, analyticsId = null, onHostState = () => {} }) {
    this.onState = onState; this.onStatus = onStatus; this.onError = onError; this.PeerClass = PeerClass;
    this.connections = new Map(); this.secrets = new Map(); this.token = token; this.analyticsId = analyticsId; this.onHostState = onHostState; this.closed = false; this.isHost = false;
  }
  setup(peer) {
    this.peer = peer;
    peer.on('error', error => {
      const messages = { 'peer-unavailable': 'Room not found. Check the code and make sure the host is still online.', 'unavailable-id': 'That room code is already in use. Please create another table.', 'network': 'Could not reach the room service. Check your internet connection.', 'webrtc': 'A direct connection failed. Try another network or browser.' };
      this.fail(messages[error.type] || `Connection error: ${error.message || error.type}`);
    });
    peer.on('disconnected', () => {
      if (this.closed) return;
      this.onStatus('Reconnecting to the room service…');
      if (!peer.destroyed) peer.reconnect();
    });
  }
  requirePeer() { if (!this.PeerClass) throw Error('The multiplayer library did not load. Reload the page and try again.'); }
  host(name, id) {
    this.requirePeer(); this.isHost = true; this.selfId = id; this.code = roomCode(); this.game = createGame(id, name); this.game.players[0].analyticsId = this.analyticsId;
    const peer = new this.PeerClass(PREFIX + this.code, { debug: 0 }); this.setup(peer);
    this.timeout = setTimeout(() => this.fail('The room service is taking too long. Please try again.'), 20000);
    peer.on('open', () => { clearTimeout(this.timeout); if (this.closed) return; this.onStatus('connected'); this.publish(); });
    peer.on('connection', conn => this.accept(conn));
  }
  accept(conn) {
    let playerId;
    const readyTimeout = setTimeout(() => conn.close(), 15000);
    conn.on('open', () => {
      clearTimeout(readyTimeout);
      try {
        const m = conn.metadata;
        if (!m || m.version !== 15 || typeof m.id !== 'string' || !/^[a-zA-Z0-9-]{20,60}$/.test(m.id) || typeof m.token !== 'string' || !/^[a-zA-Z0-9-]{20,60}$/.test(m.token) || m.id === this.game.hostId) throw Error('Invalid guest identity.');
        const existing = this.game.players.find(p => p.id === m.id);
        if (existing && this.secrets.get(m.id) !== m.token) throw Error('This seat belongs to another merchant. Rejoin from your original browser tab.');
        if (existing?.bot) throw Error('That seat is unavailable.');
        addPlayer(this.game, m.id, m.name);
        if (typeof m.analyticsId === 'string' && /^[a-zA-Z0-9-]{20,60}$/.test(m.analyticsId)) this.game.players.find(p => p.id === m.id).analyticsId = m.analyticsId;
        this.secrets.set(m.id, m.token);
        playerId = m.id;
        const old = this.connections.get(playerId);
        this.connections.set(playerId, conn);
        if (old && old !== conn) old.close();
        this.game.players.find(p => p.id === playerId).online = true;
        this.publish();
      } catch (error) { conn.send({ type: 'rejected', message: error.message }); setTimeout(() => conn.close(), 250); }
    });
    let lastChat = 0;
    conn.on('data', message => {
      if (!playerId || this.connections.get(playerId) !== conn || !message || message.type !== 'action') return;
      try {
        if (message.action?.type === 'chat') { if (Date.now() - lastChat < 700) throw Error('Give the table a moment between messages.'); lastChat = Date.now(); }
        act(this.game, playerId, message.action); this.publish();
      } catch (error) { conn.send({ type: 'error', message: error.message }); }
    });
    const disconnected = () => {
      clearTimeout(readyTimeout);
      if (this.closed || this.connections.get(playerId) !== conn) return;
      this.connections.delete(playerId);
      const p = this.game.players.find(p => p.id === playerId); if (p) p.online = false;
      this.publish();
    };
    conn.on('close', disconnected); conn.on('error', disconnected);
  }
  join(code, name, id) {
    this.requirePeer(); this.code = code; this.selfId = id;
    const peer = new this.PeerClass({ debug: 0 }); this.setup(peer);
    this.timeout = setTimeout(() => this.fail('Connection timed out. Ask the host to keep their table open, or try another network.'), 20000);
    peer.on('open', () => {
      if (this.closed || this.conn?.open) return;
      const conn = peer.connect(PREFIX + code, { reliable: true, metadata: { name, id, token: this.token, analyticsId: this.analyticsId, version: 15 } });
      this.conn = conn;
      conn.on('data', message => {
        if (this.closed) return;
        if (message?.type === 'state') { clearTimeout(this.timeout); this.onStatus('connected'); this.onState(message.state); }
        else if (message?.type === 'rejected') this.fail(message.message);
        else if (message?.type === 'error') this.onError(message.message);
      });
      conn.on('close', () => { if (!this.closed) { clearTimeout(this.timeout); this.onStatus('disconnected'); } });
      conn.on('error', () => { if (!this.closed) this.fail('The connection to the host was interrupted. Rejoin with the same room code.'); });
    });
  }
  send(action) {
    if (this.closed) return;
    if (this.isHost) { act(this.game, this.selfId, action); this.publish(); }
    else if (this.conn?.open) this.conn.send({ type: 'action', action });
    else throw Error('You are disconnected. Rejoin the table to continue.');
  }
  publish() {
    if (this.closed) return;
    this.game.revision++;
    this.onHostState(this.game);
    this.onState(viewFor(this.game, this.selfId));
    for (const [id, conn] of this.connections) if (conn.open) conn.send({ type: 'state', state: viewFor(this.game, id) });
  }
  fail(message) { if (this.closed) return; clearTimeout(this.timeout); this.onStatus('error'); this.onError(message); }
  destroy() {
    this.closed = true; clearTimeout(this.timeout);
    for (const conn of this.connections.values()) conn.close();
    this.conn?.close(); this.peer?.destroy();
  }
}
