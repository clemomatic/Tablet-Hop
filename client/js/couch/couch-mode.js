// Tablet-Hop Couch Mode: optional TV / phone views over the original VTT engine.
const couchMode = new URLSearchParams(location.search).get('couch');
const couchEnabled = couchMode === 'tv' || couchMode === 'phone';
let couchView = couchMode === 'phone' ? 'hand' : 'board';
let couchRefreshQueued = false;
let couchHasChosenView = couchMode === 'phone';

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
  const hands = new Set(widgetFilter(w => w.get('type') === 'seat')
    .map(w => w.get('hand')).filter(Boolean));
  // In older games a hand holder may not be linked to a seat at all.
  // A holder that arranges cards per owner is private to the players.
  for(const holder of widgetFilter(w => w.get('type') === 'holder' &&
    (w.get('childrenPerOwner') === true || !!w.get('showInactiveFaceToSeat'))))
    hands.add(holder.id);
  for(const w of widgetFilter(() => true)) {
    // Do not leak personal cards on the shared TV even when a game does not
    // put them inside a Seat.hand holder (many older games do not).
    const owner = w.get('owner');
    const ownedCard = w.get('type') === 'card' &&
      owner !== null && owner !== undefined && owner !== '' &&
      (!Array.isArray(owner) || owner.length > 0);
    let privateWidget = ownedCard || hands.has(w.id) ||
      !!w.get('onlyVisibleForSeat') || !!w.get('linkedToSeat');
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

function couchUpdateUI() {
  if(couchMode !== 'phone') return;
  const hand = couchMyHand();
  const title = document.getElementById('couch-hand-title');
  const status = document.getElementById('couch-hand-status');
  const cards = couchHandCards();
  if(title) title.textContent = 'Ma main';
  if(status) status.textContent = cards.length
    ? cards.length + (cards.length > 1 ? ' cartes' : ' carte')
    : hand ? 'En attente de cartes' : 'Choisis ta place';
  if(typeof couchScheduleHandRender === 'function') couchScheduleHandRender();
  for(const button of document.querySelectorAll('[data-couch-view]')) {
    const active = button.dataset.couchView === couchView;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
}

function couchShowBoard() {
  couchHasChosenView = true;
  couchView = 'board';
  setZoomLevel(1);
  setPan(0, 0);
  couchUpdateUI();
}

function couchShowHand() {
  couchHasChosenView = true;
  couchView = 'hand';
  // The new hand screen displays replicas of rendered faces, not a zoomed board.
  setZoomLevel(1);
  setPan(0, 0);
  couchUpdateUI();
  couchScheduleHandRender();
}

function couchRefresh() {
  couchRefreshQueued = false;
  if(couchMode === 'tv') couchMaskTVHands();
  if(couchMode === 'phone') {
    couchUpdateUI();
    couchScheduleHandRender();
  }
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
      '<p class="couch-message" id="couch-message" role="status">Plateau partagé · Main privée sur téléphone</p>' +
      '<nav class="couch-nav" aria-label="Vue de jeu">' +
      '<button type="button" data-couch-view="hand" aria-pressed="true">🃏 Ma main</button>' +
      '<button type="button" data-couch-view="board" aria-pressed="false">▦ Plateau</button></nav>';
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
