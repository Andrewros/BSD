import test from 'node:test';
import assert from 'node:assert/strict';
import { act, addPlayer, createGame, startGame, viewFor, expireAbilities, CHARACTERS } from '../engine.js';
function table(roles = ['benny', 'andrew', 'fring']) {
 const g = createGame('p0', 'Agent'); addPlayer(g, 'p1', 'Andrew'); addPlayer(g, 'p2', 'Other');
 roles.forEach((c, i) => g.players[i].character = c); startGame(g, 'p0'); g.phase = 'inspect';
 g.players.forEach((p, i) => {p.coins = 50; p.stall = []; if(i)p.bag = {cards:['meth','fish'], count:2, declaration:'bread', bribe:0, resolved:false};}); return g;
}
function awaken(g) {act(g, 'p1', {type:'andrew-awaken'});}
function change(g, cards) {act(g, 'p1', {type:'andrew-change', cards});}
test('Andrew is selectable and his public rules say only mystery; base character has no power', () => {
 assert.equal(CHARACTERS.andrew.description, 'His abilities are a mystery.');
 const g=table(); act(g,'p0',{type:'inspect',target:'p1'}); assert.equal(g.pendingInspection,null); assert.equal(g.players[1].coins,44);
 assert.throws(()=>act(g,'p0',{type:'andrew-awaken'}));
});
test('awakening persists, is visible in reconnect snapshots, and cannot be used by another role', () => {
 const g=table(); awaken(g); assert.equal(viewFor(g,'p1').players[1].godAndrew,true); assert.equal(viewFor(g,'p2').players[1].godAndrew,true);
 act(g,'p1',{type:'andrew-awaken'}); assert.equal(g.players[1].godAndrew,true); assert.throws(()=>act(g,'p2',{type:'andrew-awaken'}));
});
test('God intelligence is private, unlimited, and available only while Andrew is DEA', () => {
 const g=table(); awaken(g); assert.equal(viewFor(g,'p1').godIntel,null); g.dea=1;
 const v=viewFor(g,'p1'); assert.deepEqual(v.godIntel.find(p=>p.id==='p2').packet,['meth','fish']); assert.deepEqual(v.godIntel[0].hand,g.players[0].hand);
 assert.deepEqual(viewFor(g,'p1').godIntel,v.godIntel); assert.equal(viewFor(g,'p2').godIntel,null); assert.equal(viewFor(g,'p0').players[2].hand,null);
});
test('committed inspection pauses before revealing or paying; transformations keep count and deck', () => {
 const g=table(); awaken(g); const deck=[...g.deck]; act(g,'p0',{type:'inspect',target:'p1'});
 assert.equal(g.pendingInspection.stage,'andrew-before'); assert.equal(g.players[1].coins,50); assert.equal(g.results.length,0);
 const other=viewFor(g,'p2'); assert.equal(other.players[1].bag.cards,null); assert.equal(other.pendingInspection.continuation,undefined);
 assert.throws(()=>change(g,['bread'])); assert.throws(()=>change(g,['bread','invalid'])); assert.throws(()=>act(g,'p2',{type:'andrew-change',cards:['bread','bread']}));
 change(g,['bread','bread']); assert.equal(g.pendingInspection.stage,'andrew-after'); assert.equal(g.players[1].coins,54); assert.equal(g.players[0].coins,46);
 assert.equal(viewFor(g,'p2').pendingInspection.returnCards,undefined); assert.equal(viewFor(g,'p2').pendingInspection.outcome,undefined);
 change(g,['meth','meth']); assert.deepEqual(g.players[1].stall,['meth','meth']); assert.deepEqual(g.deck,deck); assert.deepEqual(g.results[0].cards,['bread','bread']); assert.equal(g.results[0].inspection.honest,true); assert.deepEqual(g.players[1].bag.delivered,['meth','meth']);
});
test('Fring commits before Andrew changes goods and cannot bypass the return transformation', () => {
 const g=table(); awaken(g); act(g,'p2',{type:'fring',target:'p1'}); assert.equal(g.pendingInspection.stage,'andrew-before');
 change(g,['bread','bread']); assert.equal(g.pendingInspection.stage,'andrew-after'); assert.equal(g.players[2].abilityUsed,true); assert.deepEqual(g.players[2].stall,[]); assert.equal(g.players[1].coins,53);
 change(g,['blueSky','blueSky']); assert.deepEqual(g.players[1].stall,['blueSky','blueSky']);
});
test('Fring steals exactly the goods Andrew chooses before theft', () => {
 const g=table(); awaken(g); act(g,'p2',{type:'fring',target:'p1'}); change(g,['heroin','heroin']); assert.deepEqual(g.players[2].stall,['heroin','heroin']); assert.equal(g.pendingInspection,null); assert.deepEqual(g.players[1].stall,[]);
});
test('unopened passage returns all five cards for transformation while contents stay secret', () => {
 const g=table(); awaken(g); g.players[1].bag.cards=Array(5).fill('bread');g.players[1].bag.count=5;
 act(g,'p0',{type:'pass',target:'p1'}); assert.equal(g.pendingInspection.stage,'andrew-after'); change(g,Array(5).fill('meth'));
 assert.deepEqual(g.players[1].stall,Array(5).fill('meth')); assert.equal(g.results[0].cards,null); assert.equal(viewFor(g,'p0').players[1].stall.length,0); assert.equal(viewFor(g,'p0').players[1].contrabandCount,5);
});
test('invalid or competing inspections cannot start a transformation window', () => {
 const g=table(); awaken(g); assert.throws(()=>act(g,'p2',{type:'inspect',target:'p1'})); assert.equal(g.pendingInspection,null);
 act(g,'p0',{type:'inspect',target:'p1'}); assert.throws(()=>act(g,'p2',{type:'fring',target:'p1'})); assert.equal(g.pendingInspection.stage,'andrew-before');
});
test('both optional transformation windows expire at twenty seconds, preserving current cards', () => {
 const g=table(); awaken(g); g.players[1].bag.cards=['bread','bread']; act(g,'p0',{type:'inspect',target:'p1'});
 assert.ok(g.pendingInspection.expiresAt>Date.now()+19000); expireAbilities(g,g.pendingInspection.expiresAt+1); assert.equal(g.pendingInspection.stage,'andrew-after');
 expireAbilities(g,g.pendingInspection.expiresAt+1); assert.equal(g.pendingInspection,null); assert.deepEqual(g.players[1].stall,['bread','bread']);
});
test('special DEA inspections also allow the committed-inspection change', () => {
 for(const role of ['zach','junior','light']) {const g=table([role,'andrew','benny']);awaken(g);act(g,'p0',{type:role==='light'?'kira':role,target:'p1'});assert.equal(g.pendingInspection.stage,'andrew-before');change(g,['bread','bread']);if(g.pendingInspection)act(g,'p1',{type:'andrew-skip'});assert.deepEqual(g.results[0].cards,['bread','bread']);}
});
test('L inspection resumes its existing review after Andrew changes the unseen packet', () => {
 const g=table(['l','andrew','benny']);awaken(g);act(g,'p0',{type:'l-peek',target:'p1'});act(g,'p0',{type:'l-inspect'});assert.equal(g.pendingInspection.stage,'andrew-before');change(g,['bread','bread']);assert.equal(g.pendingInspection.stage,'andrew-after');act(g,'p1',{type:'andrew-skip'});assert.equal(g.results[0].inspection.honest,true);
});
test('return transformation accepts special card types without changing the deck or card count', () => {
 const g=table();awaken(g);const deck=[...g.deck];act(g,'p0',{type:'pass',target:'p1'});change(g,['usedNeedle','chiliPowder']);assert.deepEqual(g.players[1].stall,['usedNeedle','chiliPowder']);assert.deepEqual(g.deck,deck);
 // Later special use must not remove the older special cards from the stash.
 g.players[1].bag={cards:['usedNeedle','usedNeedle'],count:2,declaration:'bread',bribe:0,resolved:false};g.pendingInspection=null;
 act(g,'p0',{type:'inspect',target:'p1'});act(g,'p1',{type:'andrew-skip'});assert.equal(g.retired.filter(c=>c==='usedNeedle').length,2);assert.deepEqual(g.players[1].stall,['usedNeedle','chiliPowder']);
});
