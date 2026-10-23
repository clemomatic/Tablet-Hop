// Tablet-Hop hand screen v1: visual duplicates of real card faces + native VTT moves.
// The widgets always stay on the board; this screen never re-parents real DOM nodes.
let couchHandRenderScheduled = false;

function couchScheduleHandRender() {
  if(couchMode !== 'phone' || couchHandRenderScheduled) return;
  couchHandRenderScheduled = true;
  requestAnimationFrame(couchRenderHand);
}

function couchChooseCard(id, center = false) {
  couchSelectedCardID = id;
  couchActionNotice = '';
  couchScheduleHandRender();
  couchScheduleActionsRender();
  if(center)
    requestAnimationFrame(() => {
      const buttons = document.querySelectorAll('#couch-hand-cards [data-couch-card]');
      const choice = [...buttons].find(b => b.dataset.couchCard === id);
      if(choice) choice.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'nearest', inline:'center'});
    });
}

function couchRenderHand() {
  couchHandRenderScheduled = false;
  if(couchMode !== 'phone') return;
  const stage = document.getElementById('couch-hand-stage');
  if(!stage) return;

  stage.hidden = couchView !== 'hand';
  document.body.classList.toggle('couch-hand-open', couchView === 'hand');
  if(stage.hidden) return;

  const cards = couchHandCards();
  const ownedHand = couchMyHand();
  const empty = stage.querySelector('#couch-hand-empty');
  const content = stage.querySelector('#couch-hand-content');
  const rail = stage.querySelector('#couch-hand-cards');
  const count = stage.querySelector('#couch-hand-count');
  const headline = stage.querySelector('#couch-hand-headline');
  const prev = stage.querySelector('#couch-hand-prev');
  const next = stage.querySelector('#couch-hand-next');
  const targetSelect = stage.querySelector('#couch-hand-target');
  const play = stage.querySelector('#couch-hand-play');
  const feedback = stage.querySelector('#couch-hand-feedback');

  const hasCards = cards.length > 0;
  empty.hidden = hasCards;
  content.hidden = !hasCards;
  headline.textContent = hasCards ? 'Vos cartes, à portée de main.' : 'Votre main vous attend';
  count.textContent = hasCards
    ? cards.length + (cards.length > 1 ? ' cartes en main' : ' carte en main')
    : ownedHand ? 'Aucune carte pour le moment' : 'Choisissez votre place sur le plateau';

  if(!hasCards) {
    const message = empty.querySelector('p');
    message.textContent = ownedHand
      ? 'Les cartes que vous recevrez apparaîtront ici automatiquement.'
      : 'Rejoignez une place dans le jeu pour retrouver vos cartes.';
    rail.replaceChildren();
    return;
  }

  if(!cards.some(c => c.id === couchSelectedCardID))
    couchSelectedCardID = cards[0].id;
  const selected = cards.find(c => c.id === couchSelectedCardID);
  const focusIndex = cards.indexOf(selected);
  const existingSelected = rail.querySelector('.couch-hand-card.selected');
  const oldFocusX = existingSelected ? existingSelected.offsetLeft - rail.scrollLeft : null;
  const oldSelectedID = existingSelected && existingSelected.dataset.couchCard;
  const oldScrollLeft = rail.scrollLeft;

  const fragment = document.createDocumentFragment();
  cards.forEach((card, index) => {
    const selectedCard = card.id === couchSelectedCardID;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.couchCard = card.id;
    button.className = 'couch-hand-card' + (selectedCard ? ' selected' : '');
    button.setAttribute('aria-pressed', String(selectedCard));
    button.setAttribute('aria-label', couchCardTitle(card, index) +
      (selectedCard ? ' — sélectionnée' : ' — toucher pour sélectionner'));
    button.appendChild(couchCardThumbnail(card, {large:true}));
    const label = document.createElement('span');
    label.className = 'couch-hand-card-label';
    label.textContent = couchCardTitle(card, index);
    button.appendChild(label);
    button.addEventListener('click', () => couchChooseCard(card.id));
    fragment.appendChild(button);
  });
  rail.replaceChildren(fragment);

  if(oldSelectedID === couchSelectedCardID && oldFocusX !== null) {
    const newFocus = [...rail.children].find(el => el.dataset.couchCard === couchSelectedCardID);
    rail.scrollLeft = newFocus ? newFocus.offsetLeft - oldFocusX : oldScrollLeft;
  } else {
    const focus = [...rail.children].find(el => el.dataset.couchCard === couchSelectedCardID);
    if(focus) rail.scrollLeft = focus.offsetLeft - Math.max(0, (rail.clientWidth - focus.clientWidth) / 2);
  }

  prev.disabled = focusIndex === 0;
  next.disabled = focusIndex >= cards.length - 1;
  stage.querySelector('#couch-hand-position').textContent = (focusIndex + 1) + ' / ' + cards.length;

  const targets = couchAvailableTargets(selected);
  if(couchSelectedTargetID !== '__table__' && !targets.some(t => t.id === couchSelectedTargetID))
    couchSelectedTargetID = '__table__';
  targetSelect.replaceChildren(new Option('Au centre du plateau', '__table__'));
  targets.forEach((target, index) => targetSelect.add(new Option(couchTargetLabel(target, index), target.id)));
  targetSelect.value = couchSelectedTargetID;
  targetSelect.disabled = couchActionPending;
  play.disabled = couchActionPending || selected.get('movable') === false || !!selected.get('fixedParent');
  play.textContent = couchActionPending ? 'Déplacement…' : 'Jouer cette carte';
  feedback.textContent = couchActionNotice ||
    (play.disabled && !couchActionPending
      ? 'Cette carte est verrouillée dans le jeu. Utilisez les commandes du plateau.'
      : 'Action libre : certains jeux utilisent leurs propres règles et boutons.');
}

function couchInstallHand() {
  if(couchMode !== 'phone') return;
  const stage = document.createElement('main');
  stage.id = 'couch-hand-stage';
  stage.className = 'couch-hand-stage';
  stage.hidden = true;
  stage.setAttribute('aria-label', 'Ma main de cartes');
  stage.innerHTML =
    '<div class="couch-hand-ambient" aria-hidden="true"></div>' +
    '<div class="couch-hand-inner">' +
      '<div class="couch-hand-intro">' +
        '<span class="couch-hand-kicker">TABLET-HOP · ESPACE JOUEUR</span>' +
        '<h1 id="couch-hand-headline">Vos cartes, à portée de main.</h1>' +
        '<p id="couch-hand-count" aria-live="polite">Connexion à la partie…</p>' +
      '</div>' +
      '<div class="couch-hand-empty" id="couch-hand-empty" hidden>' +
        '<div class="couch-hand-empty-glyph" aria-hidden="true">♠</div>' +
        '<p>Choisissez votre place sur le plateau pour retrouver vos cartes.</p>' +
        '<button type="button" id="couch-hand-go-board">Choisir ma place ↗</button>' +
      '</div>' +
      '<div id="couch-hand-content" class="couch-hand-content" hidden>' +
        '<div class="couch-hand-rail-head"><span>MA MAIN</span>' +
          '<div class="couch-hand-stepper">' +
            '<button type="button" id="couch-hand-prev" aria-label="Carte précédente">←</button>' +
            '<span id="couch-hand-position" aria-live="polite">1 / 1</span>' +
            '<button type="button" id="couch-hand-next" aria-label="Carte suivante">→</button>' +
          '</div>' +
        '</div>' +
        '<div id="couch-hand-cards" class="couch-hand-cards" aria-label="Cartes de ma main"></div>' +
        '<div class="couch-hand-action-panel">' +
          '<label for="couch-hand-target">JOUER VERS</label>' +
          '<div class="couch-hand-action-row">' +
            '<select id="couch-hand-target" aria-label="Destination de la carte"></select>' +
            '<button type="button" id="couch-hand-play">Jouer cette carte</button>' +
          '</div>' +
          '<p id="couch-hand-feedback" class="couch-hand-feedback" role="status" aria-live="polite"></p>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(stage);

  stage.querySelector('#couch-hand-go-board').addEventListener('click', couchShowBoard);
  stage.querySelector('#couch-hand-play').addEventListener('click', couchPlaySelectedCard);

  // Swiping the rail selects the card nearest its visual center once scrolling settles.
  // No actual VTT object is dragged when swiping through the hand.
  const rail = stage.querySelector('#couch-hand-cards');
  let scrollTimer = null;
  rail.addEventListener('scroll', () => {
    if(scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if(couchView !== 'hand') return;
      const box = rail.getBoundingClientRect();
      const center = box.left + box.width / 2;
      let closest = null, distance = Infinity;
      for(const button of rail.querySelectorAll('[data-couch-card]')) {
        const rect = button.getBoundingClientRect();
        const d = Math.abs(rect.left + rect.width / 2 - center);
        if(d < distance) { closest = button; distance = d; }
      }
      if(closest && closest.dataset.couchCard !== couchSelectedCardID)
        couchChooseCard(closest.dataset.couchCard);
    }, 135);
  }, {passive:true});
  stage.querySelector('#couch-hand-target').addEventListener('change', e => {
    couchSelectedTargetID = e.target.value;
    couchActionNotice = '';
    couchScheduleActionsRender();
  });
  stage.querySelector('#couch-hand-prev').addEventListener('click', () => {
    const cards = couchHandCards(), index = cards.findIndex(card => card.id === couchSelectedCardID);
    if(index > 0) couchChooseCard(cards[index-1].id, true);
  });
  stage.querySelector('#couch-hand-next').addEventListener('click', () => {
    const cards = couchHandCards(), index = cards.findIndex(card => card.id === couchSelectedCardID);
    if(index < cards.length-1) couchChooseCard(cards[index+1].id, true);
  });

  couchScheduleHandRender();
}

if(couchMode === 'phone') {
  onLoad(couchInstallHand);
  onMessage('state', couchScheduleHandRender);
  onMessage('delta', couchScheduleHandRender);
  onMessage('meta', couchScheduleHandRender);
}
