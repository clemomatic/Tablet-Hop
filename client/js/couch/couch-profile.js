// Tablet-Hop: room invitation and player identity controls for Couch Mode.
// UI-only additions: the VTT room/player protocol remains unchanged.
function couchRoomName() {
  const parts = location.pathname.split('/').filter(Boolean);
  const tail = parts.length ? parts[parts.length - 1] : '';
  try { return decodeURIComponent(tail) || 'nouvelle partie'; }
  catch(_) { return tail || 'nouvelle partie'; }
}

function couchJoinURL() {
  const url = new URL(location.href);
  url.searchParams.set('couch', 'phone');
  url.hash = '';
  return url.toString();
}

function couchProfileNotice(message) {
  const el = document.getElementById('couch-profile-feedback');
  if(el) el.textContent = message;
}

function couchInstallProfile() {
  if(couchMode !== 'phone') return;
  const header = document.querySelector('#couch-ui .couch-header');
  const nav = document.querySelector('#couch-ui .couch-nav');
  if(!header || !nav) return;

  const actions = document.createElement('div');
  actions.className = 'couch-profile-actions';
  actions.innerHTML =
    '<button type="button" id="couch-share-button" aria-label="Partager la salle" title="Partager la salle">↗</button>' +
    '<button type="button" id="couch-profile-button" aria-label="Changer de nom" title="Changer de nom">♙</button>';
  header.appendChild(actions);

  const panel = document.createElement('section');
  panel.id = 'couch-profile-panel';
  panel.className = 'couch-profile-panel';
  panel.hidden = true;
  panel.innerHTML =
    '<div class="couch-profile-heading"><strong>Ma soirée</strong><span id="couch-room-label"></span></div>' +
    '<label for="couch-player-name">Ton nom dans la partie</label>' +
    '<div class="couch-profile-row"><input id="couch-player-name" maxlength="40" autocomplete="nickname">' +
    '<button type="button" id="couch-rename-button">Valider</button></div>' +
    '<label for="couch-invite-link">Lien à envoyer aux amis</label>' +
    '<div class="couch-profile-row"><input id="couch-invite-link" readonly>' +
    '<button type="button" id="couch-copy-button">Copier</button></div>' +
    '<p id="couch-profile-feedback" role="status" aria-live="polite"></p>';
  nav.parentElement.insertBefore(panel, nav);
  const input = panel.querySelector('#couch-player-name');
  const link = panel.querySelector('#couch-invite-link');
  const playerButton = document.getElementById('couch-profile-button');
  const shareButton = document.getElementById('couch-share-button');

  panel.querySelector('#couch-room-label').textContent = couchRoomName();
  input.value = playerName;
  link.value = couchJoinURL();

  function togglePanel(force) {
    panel.hidden = typeof force === 'boolean' ? !force : !panel.hidden;
    playerButton.setAttribute('aria-expanded', String(!panel.hidden));
    if(!panel.hidden) {
      // Keep the phone footer compact: identity and card actions never expand together.
      if(couchView === 'actions') {
        couchView = 'board';
        couchUpdateUI();
      }
      input.value = playerName;
      link.value = couchJoinURL();
    }
    couchScheduleActionsRender();
  }

  async function copyLink() {
    try {
      if(!navigator.clipboard || !navigator.clipboard.writeText)
        throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(couchJoinURL());
      couchProfileNotice('Lien copié !');
    } catch(error) {
      togglePanel(true);
      link.focus();
      link.select();
      couchProfileNotice('Sélectionne le lien pour le copier.');
    }
  }

  playerButton.addEventListener('click', () => togglePanel());
  shareButton.addEventListener('click', async () => {
    if(navigator.share) {
      try {
        await navigator.share({title:'Rejoins ma partie Tablet-Hop',text:'On joue ensemble ?',url:couchJoinURL()});
        return;
      } catch(e) {
        if(e.name === 'AbortError') return;
      }
    }
    await copyLink();
  });
  panel.querySelector('#couch-copy-button').addEventListener('click', copyLink);
  panel.querySelector('#couch-rename-button').addEventListener('click', () => {
    const name = input.value.trim();
    if(!name) {
      couchProfileNotice('Indique un nom pour rejoindre la partie.');
      return;
    }
    if(name === playerName) {
      couchProfileNotice('Ce nom est déjà utilisé sur ton téléphone.');
      return;
    }
    toServer('rename', {oldName:playerName, newName:name, updateWidgets:true});
    couchProfileNotice('Changement de nom demandé…');
  });
  input.addEventListener('keydown', e => {
    if(e.key === 'Enter') panel.querySelector('#couch-rename-button').click();
  });
  onMessage('rename', () => {
    input.value = playerName;
    couchProfileNotice('Nom mis à jour.');
    couchScheduleActionsRender();
  });
}

function couchInstallTVInfo() {
  if(couchMode !== 'tv') return;
  const bar = document.getElementById('couch-ui');
  if(!bar) return;
  const info = document.createElement('span');
  info.id = 'couch-tv-room';
  info.className = 'couch-tv-room';
  info.textContent = 'SALLE : ' + couchRoomName();
  bar.appendChild(info);
  const count = document.createElement('span');
  count.id = 'couch-tv-players';
  count.className = 'couch-tv-players';
  count.textContent = 'En attente des joueurs';
  bar.appendChild(count);
  onMessage('meta', args => {
    const players = new Set(args.activePlayers || []);
    // A screen typically joins under a guest name, so this is a connected-session count,
    // not necessarily the number of people seated at the table.
    count.textContent = players.size + ' connexion' + (players.size > 1 ? 's' : '');
  });
}

if(couchEnabled) {
  onLoad(couchInstallProfile);
  onLoad(couchInstallTVInfo);
}
