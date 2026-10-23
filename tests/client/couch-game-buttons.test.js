import fs from 'fs';
import vm from 'vm';

// Run the real browser code against a lightweight VTT widget collection.
const source = fs.readFileSync(new URL('../../client/js/couch/couch-hand.js', import.meta.url), 'utf8');

function makeButton(id, { label, foreign = false, routine = [], clickable = true, fail = false } = {}) {
  const events = [];
  const values = {type:'button', display:true, clickable, clickRoutine:routine, text:label};
  return {
    id, events,
    get(key) { return values[key] === undefined ? null : values[key]; },
    domElement: { classList: {contains(name) {return name === 'foreign' && foreign;} } },
    async click() {events.push('click'); if(fail) throw new Error('game rejected action');}
  };
}

function setup() {
  const draw = makeButton('draw',{label:'Piocher'});
  const hidden = makeButton('hidden',{label:'Action privée',foreign:true});
  const disabled = makeButton('disabled',{label:'Non disponible',clickable:false});
  const nonRoutine = makeButton('ordinary',{label:'Sans routine',routine:null});
  const fails = makeButton('fails',{label:'Erreur',fail:true});
  const widgets = [draw,hidden,disabled,nonRoutine,fails];
  const order = [], notices = [];
  const context = {
    couchMode:'phone',
    couchMyHand:()=>({id:'myhand'}),
    playerName:'Joueur',
    widgetFilter:predicate=>widgets.filter(predicate),
    couchActionMessage:text=>notices.push(text),
    batchStart:()=>order.push('start'),
    batchEnd:()=>order.push('end'),
    setDeltaCause:()=>{},
    requestAnimationFrame:()=>{},
    onLoad:()=>{},
    onMessage:()=>{},
    console:{error:()=>{}}
  };
  vm.runInNewContext(source + '\nglobalThis.api = {buttons:couchGameButtons,run:couchRunGameButton};',context);
  return {api:context.api,draw,hidden,disabled,nonRoutine,fails,order,notices};
}

describe('Tablet-Hop native game shortcuts',()=>{
  test('offers only accessible buttons backed by a game routine',()=>{
    const testCase=setup();
    expect(testCase.api.buttons().map(b=>b.id)).toEqual(['draw','fails']);
  });
  test('uses the actual game button click and batches updates',async()=>{
    const testCase=setup();
    await testCase.api.run('draw');
    expect(testCase.draw.events).toEqual(['click']);
    expect(testCase.order).toEqual(['start','end']);
    expect(testCase.notices.join(' ')).toContain('Piocher');
  });
  test('refuses hidden buttons and unknown actions',async()=>{
    const testCase=setup();
    await testCase.api.run('hidden');
    await testCase.api.run('missing');
    expect(testCase.hidden.events).toEqual([]);
    expect(testCase.order).toEqual([]);
  });
  test('always closes the batch when the game routine rejects',async()=>{
    const testCase=setup();
    await testCase.api.run('fails');
    expect(testCase.order).toEqual(['start','end']);
    expect(testCase.notices.join(' ')).toContain('ne fonctionne pas');
  });
});
