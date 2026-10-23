import fs from 'fs';
import vm from 'vm';

// These focused tests run the same browser module against lightweight VTT widget
// doubles, without depending on the appearance of any particular imported game.
const source = fs.readFileSync(new URL('../../client/js/couch/couch-actions.js', import.meta.url), 'utf8');

function card(id, parent, owner) {
  const values = {type:'card', parent, owner, movable:true, fixedParent:false, width:103, height:160, z:1, x:0, y:0};
  const events = [];
  return {
    id, events,
    get(name) { return values[name] ?? null; },
    isDescendantOf(hand) { return values.parent === hand.id; },
    async bringToFront() { events.push('front'); },
    async moveToHolder(holder) { events.push('holder:' + holder.id); values.parent = holder.id; values.owner = null; },
    async set(name, value) { events.push(name + ':' + value); values[name] = value; },
    async setPosition(x,y,z) { events.push('position:' + x + ',' + y + ',' + z); values.x=x; values.y=y; },
  };
}

function seat(player, hand) {
  const props = { type:'seat',player,hand};
  return {id:'seat-'+player, get:key=>props[key]??null};
}

function holder(id, extras={}) {
  const props = {type:'holder', dropTarget:{type:'card'}, display:true, ...extras};
  return {id,get:key=>props[key]??null};
}

function setup() {
  const ownHand = holder('hand-one');
  const otherHand = holder('hand-two');
  const ownSeat = seat('Alice',ownHand.id);
  const otherSeat = seat('Bob',otherHand.id);
  const a = card('alice-card',ownHand.id,'Alice');
  const b = card('bob-card',otherHand.id,'Bob');
  const publicHolder = holder('public-play');
  const restrictedHolder = holder('hidden-zone',{onlyVisibleForSeat:['seat-Bob']});
  const all=[ownSeat,otherSeat,ownHand,otherHand,a,b,publicHolder,restrictedHolder];
  const events=[];
  const context={
    couchMode:'phone', playerName:'Alice',
    couchMyHand:()=>ownHand,
    widgets: new Map(all.map(w=>[w.id,w])),
    widgetFilter: fn=>all.filter(fn),
    compareDropTarget:()=>true,
    exceedsDropLimit:()=>false,
    document:{ getElementById:()=>null },
    requestAnimationFrame:()=>{},
    viewportConfig:{targetWidth:1280,targetHeight:720},
    batchStart:()=>events.push('batch-start'),
    batchEnd:()=>events.push('batch-end'),
    setDeltaCause:()=>{},
    onLoad:()=>{}, onMessage:()=>{},
    console,
  };
  vm.runInNewContext(source+'\nglobalThis.actions = { handCards:couchHandCards, targets:couchAvailableTargets, play:couchPlaySelectedCard, selectCard(id){couchSelectedCardID=id;}, selectTarget(id){couchSelectedTargetID=id;} };',context);
  return { context,actions:context.actions,a,b,ownHand,otherHand,publicHolder,restrictedHolder,events };
}

describe('Tablet-Hop mobile card actions',()=>{
  test('only shows cards owned by the seated player',()=>{
    const fixture=setup();
    expect(fixture.actions.handCards().map(w=>w.id)).toEqual(['alice-card']);
  });

  test('does not suggest private hands or seat-restricted zones as destinations',()=>{
    const fixture=setup();
    expect(fixture.actions.targets(fixture.a).map(w=>w.id)).toEqual(['public-play']);
  });

  test('plays a selected card into a public holder using native moveToHolder',async()=>{
    const fixture=setup();
    fixture.actions.selectCard('alice-card');
    fixture.actions.selectTarget('public-play');
    await fixture.actions.play();
    expect(fixture.a.events).toContain('holder:public-play');
    expect(fixture.events).toEqual(['batch-start','batch-end']);
  });

  test('plays a selected card onto the middle of the global board',async()=>{
    const fixture=setup();
    fixture.actions.selectCard('alice-card');
    fixture.actions.selectTarget('__table__');
    await fixture.actions.play();
    expect(fixture.a.events).toContain('owner:null');
    expect(fixture.a.events).toContain('parent:null');
    expect(fixture.a.events).toContain('position:589,280,1');
    expect(fixture.events).toEqual(['batch-start','batch-end']);
  });

  test('refuses to play a card that is not in the current player hand',async()=>{
    const fixture=setup();
    fixture.actions.selectCard('bob-card');
    await fixture.actions.play();
    expect(fixture.b.events).toEqual([]);
    expect(fixture.events).toEqual([]);
  });
});
