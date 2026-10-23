// Tablet-Hop Couch Mode: optional TV / phone views over the original VTT engine.
const couchMode = new URLSearchParams(location.search).get('couch');
const couchEnabled = couchMode === 'tv' || couchMode === 'phone';
let couchView = 'board';
let couchRefreshQueued = false;

function couchMyHand() {
  for(const seat of widgetFilter(w => w.get('type') === 'seat' && w.get('player') === playerName)) {
    const id = seat.get('hand');
    if(id && widgets.has(id)) return widgets.get(id);
  }
  return null;
}

function couchCountCards(hand) {
  if(!hand) return 0;
  return widgetFilter(w => w.get('type') === 'card' &&
    (!w.get('owner') || w.get('owner') === playerName ||
      (Array.isArray(w.get('owner')) && w.get('owner').includes(playerName))) &&
    (w.get('parent') === hand.id || w.isDescendantOf(hand))).length;
}

function couchMaskTVHands() {
  const hands = new Set(widgetFilter(w => w.get('type') === 'seat').map(w => w.get('hand')).filter(Boolean));
  for(const w of widgetFilter(() => true)) {
    let privateWidget = hands.has(w.id) || !!w.get('onlyVisibleForSeat') || !!w.get('linkedToSeat');
    let ancestor = w.get('parent');
    const seen = new Set();
    while(!privateWidget && ancestor && widgets.has(ancestor) && !seen.has(ancestor)) {
      if(hands.has(ancestor)) privateWidget = true;
      seen.add(ancestor);
      ancestor = widgets.get(ancestor).get('parent');
    }
    w.domElement.classList.toggle('couch-private', privateWidget);
  }
}

function couchFocusOnHand(hand) {
  // Keep the original card elements and event handlers. A shared hand can be
  // much wider than the player's own cards, so frame the cards where possible.
  const myCards = widgetFilter(w => {
    if(w.get('type') !== 'card') return false;
    const owner = w.get('owner');
    if(owner && owner !== playerName && !(Array.isArray(owner) && owner.includes(playerName))) return false;
    return w.get('parent') === hand.id || w.isDescendantOf(hand);
  });

  function contentBounds() {
    const elements = myCards.length ? myCards.map(card => card.domElement) : [hand.domElement];
    const rects = elements.filter(el => el && el.isConnected)
      .map(el => el.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0);
    if(!rects.length) return null;
    const left = Math.min(...rects.map(r => r.left));
    const top = Math.min(...rects.map(r => r.top));
    const right = Math.max(...rects.map(r => r.right));
    const bottom = Math.max(...rects.map(r => r.bottom));
    return {left, top, width:right-left, height:bottom-top};
  }

  setZoomLevel(1);
  setPan(0, 0);
  const area = document.getElementById('roomArea').getBoundingClientRect();
  const before = contentBounds();
  if(!before) return;
  const zoom = Math.max(1, Math.min(8, Math.min(
    area.width * .86 / before.width,
    Math.max(120, area.height - 120) * .72 / before.height
  )));
  setZoomLevel(zoom);
  const framed = contentBounds();
  if(!framed) return;
  setPan(area.left + area.width / 2 - framed.left - framed.width / 2,
    area.top + Math.max(20, area.height - 115) / 2 - framed.top - framed.height / 2);
}

function couchUpdateUI() {
  if(couchMode !== 'phone') return;
  const hand = couchMyHand();
  const title = document.getElementById('couch-hand-title');
  const status = document.getElementById('couch-hand-status');
  if(title) title.textContent = hand ? 'Ma main' : 'Aucune place sélectionnée';
  if(status) status.textContent = hand ? couchCountCards(hand) + ' cartes' : 'Choisis une place sur le plateau';
  for(const button of document.querySelectorAll('[data-couch-view]')) {
    const active = button.dataset.couchView === couchView;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
}

function couchShowBoard() {
  couchView = 'board';
  setZoomLevel(1);
  setPan(0, 0);
  couchUpdateUI();
}

function couchShowHand() {
  const hand = couchMyHand();
  if(!hand) {
    const message = document.getElementById('couch-message');
    if(message) message.textContent = 'Choisis une place pour voir ta main.';
    couchShowBoard();
    return;
  }
  couchView = 'hand';
  couchFocusOnHand(hand);
  couchUpdateUI();
}

function couchRefresh() {
  couchRefreshQueued = false;
  if(couchMode === 'tv') couchMaskTVHands();
  if(couchMode === 'phone') couchUpdateUI();
}

function couchScheduleRefresh() {
  if(!couchEnabled || couchRefreshQueued) return;
  couchRefreshQueued = true;
  requestAnimationFrame(couchRefresh);
}

function couchInstall() {
  if(!couchEnabled) return;
  document.body.dataset.couchMode = couchMode;
  document.documentElement.style.setProperty('--toolbarSize', '0px');
  // Recompute the board viewport after removing the original toolbar.
  setScale();

  const bar = document.createElement('aside');
  bar.id = 'couch-ui';
  if(couchMode === 'tv') {
    bar.setAttribute('aria-label', 'Tablet-Hop table partagée');
    bar.innerHTML = '<strong class="couch-brand">TABLET<span>HOP</span></strong><span class="couch-tv-tag">TABLE PARTAGÉE</span>';
  } else {
    bar.setAttribute('aria-label', 'Tablet-Hop commandes joueur');
    bar.innerHTML =
      '<header class="couch-header"><strong class="couch-brand">TABLET<span>HOP</span></strong>' +
      '<div class="couch-status"><b id="couch-hand-title">Ma main</b><small id="couch-hand-status">Connexion…</small></div></header>' +
      '<p class="couch-message" id="couch-message" role="status">Choisis une place puis touche « Ma main ».</p>' +
      '<nav class="couch-nav" aria-label="Vue de jeu">' +
      '<button type="button" data-couch-view="hand" aria-pressed="false">🃏 Ma main</button>' +
      '<button type="button" data-couch-view="board" aria-pressed="true">▦ Plateau</button></nav>';
    bar.querySelector('[data-couch-view="hand"]').addEventListener('click', couchShowHand);
    bar.querySelector('[data-couch-view="board"]').addEventListener('click', couchShowBoard);
  }
  document.body.appendChild(bar);
  couchScheduleRefresh();
}

if(couchEnabled) {
  onLoad(couchInstall);
  onMessage('state', couchScheduleRefresh);
  onMessage('delta', couchScheduleRefresh);
  onMessage('meta', couchScheduleRefresh);
}
