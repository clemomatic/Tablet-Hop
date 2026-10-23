// Tablet-Hop: opt-in mobile action tray. Uses existing Card/Holder widgets and
// the native delta/routine system rather than inventing a second game engine.
// Actions here are free-table shortcuts; they do not enforce a game's rules.
let couchSelectedCardID = null;
let couchSelectedTargetID = '__table__';
let couchActionPending = false;
let couchActionsRenderQueued = false;
let couchActionNotice = '';

function couchHandCards() {
  const hand = couchMyHand();
  if(!hand) return [];
  return widgetFilter(card => {
    if(card.get('type') !== 'card' || card.get('movable') === false || card.get('fixedParent'))
      return false;
    const owner = card.get('owner');
    if(owner && owner !== playerName && !(Array.isArray(owner) && owner.includes(playerName)))
      return false;
    return card.get('parent') === hand.id || card.isDescendantOf(hand);
  }).sort((a, b) => {
    const dx = Number(a.get('x') || 0) - Number(b.get('x') || 0);
    const dy = Number(a.get('y') || 0) - Number(b.get('y') || 0);
    return Math.abs(dx) > 1 ? dx : Math.abs(dy) > 1 ? dy : Number(a.get('z') || 0) - Number(b.get('z') || 0);
  });
}

function couchCardTitle(card, index) {
  const candidate = card.get('text') || card.get('label') || card.get('cardType');
  return typeof candidate === 'string' && candidate.trim()
    ? candidate.trim().slice(0, 28)
    : 'Carte ' + (index + 1);
}

function couchCardThumbnail(card) {
  const wrapper = document.createElement('span');
  wrapper.className = 'couch-card-thumbnail';
  const face = card.domElement && card.domElement.querySelector('.active.cardFace');
  if(face) {
    const width = Math.max(1, Number(card.get('width')) || 103);
    const height = Math.max(1, Number(card.get('height')) || 160);
    const scale = Math.min(70 / width, 94 / height);
    const shell = document.createElement('span');
    shell.className = 'card couch-card-snapshot';
    shell.style.width = width + 'px';
    shell.style.height = height + 'px';
    shell.style.transform = 'scale(' + scale + ')';
    shell.style.transformOrigin = 'top left';
    shell.appendChild(face.cloneNode(true));
    for(const element of shell.querySelectorAll('[id]')) element.removeAttribute('id');
    for(const element of shell.querySelectorAll('[contenteditable]')) element.removeAttribute('contenteditable');
    wrapper.style.width = width * scale + 'px';
    wrapper.style.height = height * scale + 'px';
    wrapper.appendChild(shell);
  } else {
    wrapper.textContent = '🃏';
  }
  return wrapper;
}

function couchAvailableTargets(card) {
  const seatHands = new Set(widgetFilter(w => w.get('type') === 'seat')
    .map(w => w.get('hand')).filter(Boolean));
  return widgetFilter(w =>
    w.get('type') === 'holder' &&
    !seatHands.has(w.id) &&
    !w.get('onlyVisibleForSeat') &&
    !w.get('linkedToSeat') &&
    w.get('display') !== false &&
    compareDropTarget(card, w, true) &&
    !exceedsDropLimit(w, 1)
  );
}

function couchTargetLabel(target, index) {
  const name = target.get('text') || target.get('name') || target.get('label');
  return typeof name === 'string' && name.trim()
    ? name.trim().slice(0, 48)
    : 'Zone ' + (index + 1) + ' (' + target.id + ')';
}

function couchActionMessage(text) {
  couchActionNotice = text;
  const el = document.getElementById('couch-action-message');
  if(el) el.textContent = text;
}

function couchRenderActions() {
  couchActionsRenderQueued = false;
  if(couchMode !== 'phone') return;
  const tray = document.getElementById('couch-action-tray');
  if(!tray) return;
  tray.hidden = couchView !== 'actions';
  if(tray.hidden) return;

  const list = document.getElementById('couch-action-cards');
  const select = document.getElementById('couch-action-target');
  const play = document.getElementById('couch-action-play');
  const cards = couchHandCards();

  if(!cards.length) {
    couchSelectedCardID = null;
    list.replaceChildren();
    select.replaceChildren(new Option('Aucune carte disponible', ''));
    play.disabled = true;
    couchActionMessage(couchMyHand()
      ? 'Ta main ne contient pas de carte déplaçable.'
      : 'Commence par choisir une place sur le plateau.');
    return;
  }

  if(!cards.some(card => card.id === couchSelectedCardID))
    couchSelectedCardID = cards[0].id;
  const focus = cards.find(card => card.id === couchSelectedCardID);
  const scroll = list.scrollLeft;
  const fragment = document.createDocumentFragment();
  cards.forEach((card, index) => {
    const button = document.createElement('button');
    const active = card.id === couchSelectedCardID;
    button.type = 'button';
    button.className = 'couch-card-option' + (active ? ' selected' : '');
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', 'Sélectionner ' + couchCardTitle(card, index));
    button.appendChild(couchCardThumbnail(card));
    const label = document.createElement('span');
    label.className = 'couch-card-caption';
    label.textContent = couchCardTitle(card, index);
    button.appendChild(label);
    button.addEventListener('click', () => {
      couchActionNotice = '';
      couchSelectedCardID = card.id;
      couchScheduleActionsRender();
    });
    fragment.appendChild(button);
  });
  list.replaceChildren(fragment);
  list.scrollLeft = scroll;

  const targets = couchAvailableTargets(focus);
  if(couchSelectedTargetID !== '__table__' &&
      !targets.some(target => target.id === couchSelectedTargetID))
    couchSelectedTargetID = '__table__';
  select.replaceChildren(new Option('Au centre du plateau', '__table__'));
  targets.forEach((target, index) =>
    select.add(new Option(couchTargetLabel(target, index), target.id)));
  select.value = couchSelectedTargetID;
  select.disabled = couchActionPending;
  play.disabled = couchActionPending;
  play.textContent = couchActionPending ? 'Déplacement…' : 'Poser la carte';
  couchActionMessage(couchActionNotice || (cards.length + (cards.length > 1 ? ' cartes disponibles' : ' carte disponible')));
}

function couchScheduleActionsRender() {
  if(couchMode !== 'phone' || couchActionsRenderQueued) return;
  couchActionsRenderQueued = true;
  requestAnimationFrame(couchRenderActions);
}

async function couchPlaySelectedCard() {
  if(couchActionPending) return;
  const card = couchHandCards().find(c => c.id === couchSelectedCardID);
  if(!card) {
    couchActionMessage('Cette carte n’est plus dans ta main.');
    couchScheduleActionsRender();
    return;
  }
  const target = couchSelectedTargetID === '__table__'
    ? null : couchAvailableTargets(card).find(w => w.id === couchSelectedTargetID);
  if(couchSelectedTargetID !== '__table__' && !target) {
    couchActionMessage('Cette destination n’est plus disponible.');
    couchSelectedTargetID = '__table__';
    couchScheduleActionsRender();
    return;
  }
  couchActionPending = true;
  couchScheduleActionsRender();
  batchStart();
  try {
    setDeltaCause(playerName + ' placed a card via Tablet-Hop');
    await card.bringToFront();
    if(target) {
      card.movedByButton = true;
      await card.moveToHolder(target);
    } else {
      await card.set('owner', null);
      await card.set('parent', null);
      const width = Number(card.get('width')) || 103;
      const height = Number(card.get('height')) || 160;
      await card.setPosition(
        Math.round((viewportConfig.targetWidth - width) / 2),
        Math.round((viewportConfig.targetHeight - height) / 2),
        card.get('z')
      );
    }
    couchSelectedCardID = null;
    couchActionMessage('Carte posée sur le plateau.');
  } catch(error) {
    console.error('Tablet-Hop card action failed:', error);
    couchActionMessage('Impossible de déplacer cette carte. Utilise la vue Plateau.');
  } finally {
    delete card.movedByButton;
    batchEnd();
    couchActionPending = false;
    couchScheduleActionsRender();
  }
}

function couchInstallActions() {
  if(couchMode !== 'phone') return;
  const nav = document.querySelector('#couch-ui .couch-nav');
  if(!nav) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.couchView = 'actions';
  button.setAttribute('aria-pressed', 'false');
  button.textContent = '✦ Actions';
  button.addEventListener('click', () => {
    couchView = 'actions';
    couchUpdateUI();
    couchScheduleActionsRender();
  });
  nav.appendChild(button);
  nav.addEventListener('click', () => couchScheduleActionsRender());

  const tray = document.createElement('section');
  tray.id = 'couch-action-tray';
  tray.className = 'couch-action-tray';
  tray.hidden = true;
  tray.innerHTML =
    '<h3>Jouer depuis ma main</h3>' +
    '<p class="couch-action-description">Sélectionne une carte, puis sa destination.</p>' +
    '<div id="couch-action-cards" class="couch-action-cards" aria-label="Cartes de ma main"></div>' +
    '<label class="couch-action-label" for="couch-action-target">Destination</label>' +
    '<div class="couch-action-row"><select id="couch-action-target"></select>' +
    '<button id="couch-action-play" type="button">Poser la carte</button></div>' +
    '<p class="couch-action-feedback" id="couch-action-message" role="status" aria-live="polite"></p>';
  nav.parentElement.insertBefore(tray, nav);
  tray.querySelector('#couch-action-target').addEventListener('change', event => {
    couchActionNotice = '';
    couchSelectedTargetID = event.target.value;
  });
  tray.querySelector('#couch-action-play').addEventListener('click', couchPlaySelectedCard);
  couchScheduleActionsRender();
}

if(couchMode === 'phone') {
  onLoad(couchInstallActions);
  onMessage('state', couchScheduleActionsRender);
  onMessage('delta', couchScheduleActionsRender);
  onMessage('meta', couchScheduleActionsRender);
}
