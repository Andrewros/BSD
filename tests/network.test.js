import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { TableNetwork } from '../network.js';

class FakePeer extends EventEmitter {
  constructor(id) { super(); this.id = id; this.destroyed = false; }
  connect() { return new Connection(); }
  destroy() { this.destroyed = true; }
  reconnect() {}
}
class Connection extends EventEmitter {
  constructor(id, token, name = 'Guest') { super(); this.metadata = { id, token, name, version: 15 }; this.messages = []; this.open = false; }
  send(message) { this.messages.push(structuredClone(message)); }
  close() { this.open = false; this.emit('close'); }
  connect() { this.open = true; this.emit('open'); }
}
const hostId = 'host-identity-0000000000', guestId = 'guest-identity-000000000', secret = 'secret-credential-0000000';
function host() {
  const views = [], errors = [];
  const net = new TableNetwork({ PeerClass: FakePeer, onState: s => views.push(s), onStatus() {}, onError: e => errors.push(e) });
  net.host('Host', hostId); net.peer.emit('open');
  return { net, views, errors };
}
function connect(net, id = guestId, token = secret) {
  const conn = new Connection(id, token); net.peer.emit('connection', conn); conn.connect(); return conn;
}
test('host sends individualized state and never exposes reconnect secrets', () => {
  const { net } = host();
  try {
    const a = connect(net), b = connect(net, 'other-identity-000000000', 'other-secret-00000000000');
    net.game.players.forEach((p, i) => p.character = ['benny', 'wendy', 'steve'][i]);
    net.send({ type: 'start' });
    const aView = a.messages.at(-1).state, bView = b.messages.at(-1).state;
    assert.equal(aView.players[2].hand, null); assert.equal(bView.players[1].hand, null);
    assert.equal(aView.players[1].hand.length, 6); assert.equal(bView.players[2].hand.length, 6);
    assert.ok(!JSON.stringify(aView).includes(secret)); assert.ok(!JSON.stringify(bView).includes(secret));
  } finally { net.destroy(); }
});
test('reconnect requires secret credential, replaces old connection, and preserves seat', () => {
  const { net } = host();
  try {
    const first = connect(net); first.close(); assert.equal(net.game.players[1].online, false);
    const impostor = connect(net, guestId, 'wrong-secret-00000000000');
    assert.equal(impostor.messages.at(-1).type, 'rejected'); assert.equal(net.game.players[1].online, false);
    const resumed = connect(net); assert.equal(net.game.players[1].online, true); assert.equal(net.game.players.length, 2);
    const replaced = connect(net); assert.equal(resumed.open, false); assert.equal(net.game.players[1].online, true);
    resumed.emit('data', { type: 'action', action: { type: 'chat', text: 'stale' } }); assert.equal(net.game.chat.length, 0);
    replaced.emit('data', { type: 'action', action: { type: 'chat', text: 'hello' } }); assert.equal(net.game.chat[0].text, 'hello');
  } finally { net.destroy(); }
});
test('guest cannot start game, impersonate host, or inspect another bag', () => {
  const { net } = host();
  try {
    const conn = connect(net);
    conn.emit('data', { type: 'action', action: { type: 'start' } });
    assert.equal(conn.messages.at(-1).type, 'error'); assert.equal(net.game.phase, 'lobby');
    const impostor = connect(net, hostId); assert.equal(impostor.messages.at(-1).type, 'rejected');
    conn.emit('data', { type: 'action', action: { type: 'inspect', target: hostId } });
    assert.equal(conn.messages.at(-1).type, 'error');
  } finally { net.destroy(); }
});
test('the first character claim received wins, and another player can claim it only after release', () => {
  const { net } = host();
  try {
    const a = connect(net), bId = 'other-identity-000000000';
    const b = connect(net, bId, 'other-secret-00000000000');
    const claim = { type: 'action', action: { type: 'choose-character', character: 'jimmy' } };
    a.emit('data', claim); b.emit('data', claim);
    assert.equal(net.game.players.find(p => p.id === guestId).character, 'jimmy');
    assert.equal(net.game.players.find(p => p.id === bId).character, null);
    assert.equal(b.messages.at(-1).type, 'error');
    a.emit('data', { type: 'action', action: { type: 'choose-character', character: null } });
    b.emit('data', claim);
    assert.equal(net.game.players.find(p => p.id === bId).character, 'jimmy');
    assert.equal(a.messages.at(-1).state.players.find(p => p.id === bId).character, 'jimmy');
  } finally { net.destroy(); }
});
test('guest can retry when the connection closes before the first game state', () => {
  const statuses = [], errors = [];
  const net = new TableNetwork({ PeerClass: FakePeer, onState() {}, onStatus: s => statuses.push(s), onError: e => errors.push(e) });
  try {
    net.join('ABC234', 'Guest', guestId);
    net.peer.emit('open');
    net.conn.close();
    assert.deepEqual(statuses, ['error']);
    assert.match(errors[0], /WebRTC connection/);
  } finally { net.destroy(); }
});
test('guest sees the reason the host rejected their seat after the connection closes', () => {
  const statuses = [], errors = [];
  const net = new TableNetwork({ PeerClass: FakePeer, onState() {}, onStatus: s => statuses.push(s), onError: e => errors.push(e) });
  try {
    net.join('ABC234', 'Guest', guestId);
    net.peer.emit('open');
    net.conn.emit('data', { type: 'rejected', message: 'The table is full.' });
    net.conn.close();
    assert.deepEqual(statuses, ['error']);
    assert.deepEqual(errors, ['The table is full.']);
  } finally { net.destroy(); }
});
