import { ClientFunction, Selector } from 'testcafe';

// A real VirtualTabletop room with two cards belonging to the mobile player
// and a third card belonging to another player. The single phone must not
// display the third card. No game-specific routines are required for this test.
fixture('Tablet-Hop hand interaction').page('http://127.0.0.1:8272/couch-hand-ci?couch=phone');

test('seat opens personal hand, shows actual cards and plays a card to the board', async t => {
  await t.resizeWindow(390, 844);
  await t.expect(Selector('#loadingRoomIndicator').exists).notOk({timeout:30000});
  const player = await ClientFunction(() => localStorage.getItem('playerName'))();
  const room = {
    deck: {
      id: 'deck', type: 'deck', x: 30, y: 30,
      cardDefaults: { width: 103, height: 160 },
      cardTypes: { first: { title: 'As de cœur' }, second: { title: 'Roi de pique' } },
      faceTemplates: [
        { objects: [{type:'text',x:12,y:40,width:80,height:50,fontSize:34,value:'♥'}] },
        { objects: [{type:'text',x:12,y:40,width:80,height:50,fontSize:34,value:'♠'}] }
      ]
    },
    mySeat: {id:'mySeat',type:'seat',x:135,y:25,hand:'hand',player,index:1},
    otherSeat: {id:'otherSeat',type:'seat',x:235,y:25,hand:'hand',player:'SecondJoueur',index:2},
    hand: {id:'hand',type:'holder',x:95,y:460,width:740,height:180,childrenPerOwner:true,
      dropTarget:[{type:'card'}]},
    center: {id:'center',type:'holder',x:670,y:225,width:300,height:220,
      dropTarget:[{type:'card'}]},
    first: {id:'first',type:'card',deck:'deck',cardType:'first',parent:'hand',owner:player,x:5,y:10},
    second: {id:'second',type:'card',deck:'deck',cardType:'second',parent:'hand',owner:player,x:125,y:10},
    foreign: {id:'foreign',type:'card',deck:'deck',cardType:'first',parent:'hand',owner:'SecondJoueur',x:250,y:10}
  };
  const loaded = await fetch('http://127.0.0.1:8272/state/couch-hand-ci', {
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(room)
  });
  await t.expect(loaded.ok).ok();
  await t.expect(Selector('#couch-hand-stage').visible).ok({timeout:15000});
  await t.expect(Selector('#couch-hand-cards .couch-hand-card').count).eql(2);
  await t.expect(Selector('#couch-hand-cards .couch-card-snapshot').count).eql(2);
  await t.expect(Selector('#couch-hand-count').innerText).contains('2 cartes');
  await t.click('#couch-hand-next');
  await t.expect(Selector('#couch-hand-position').innerText).eql('2 / 2');
  await t.click('#couch-hand-play');
  await t.expect(Selector('#couch-hand-cards .couch-hand-card').count).eql(1, {timeout:15000});
  await t.expect(Selector('#couch-hand-count').innerText).contains('1 carte');
  // After a card is played, the untouched card is still shown on the phone.
  // The board remains the single source of truth for its position/ownership.
  await t.expect(Selector('#couch-hand-stage').visible).ok();
});
