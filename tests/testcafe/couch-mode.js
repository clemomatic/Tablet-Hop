test.page('http://127.0.0.1:8272/')
('home presents Tablet-Hop and lets users create or join rooms', async t => {
  await t.resizeWindow(1200, 800);
  await t.expect(Selector('title').innerText).contains('Tablet-Hop');
  await t.expect(Selector('#create-room').exists).ok();
  await t.click('#create-room');
  await t.expect(Selector('#room-result').visible).ok();
  await t.expect(Selector('#open-tv').getAttribute('href')).contains('couch=tv');
  await t.expect(Selector('#open-phone').getAttribute('href')).contains('couch=phone');
  await t.typeText('#room-input', 'friends-night', { replace: true });
  await t.click('#join-form button[type="submit"]');
  await t.expect(Selector('#room-code').innerText).eql('friends-night');
  await t.expect(Selector('#open-classic').getAttribute('href')).eql('/friends-night');
});

import { Selector } from 'testcafe';

fixture('Tablet-Hop Couch Mode smoke').page('http://127.0.0.1:8272/tablet-hop-smoke?couch=phone');

test('phone presents player navigation and card shortcuts', async t => {
  await t.resizeWindow(390, 844);
  await t.expect(Selector('body').getAttribute('data-couch-mode')).eql('phone');
  await t.expect(Selector('#couch-ui').exists).ok();
  await t.expect(Selector('[data-couch-view="hand"]').exists).ok();
  await t.expect(Selector('[data-couch-view="board"]').exists).ok();
  await t.click('[data-couch-view="actions"]');
  await t.expect(Selector('#couch-action-tray').visible).ok();
  await t.expect(Selector('#couch-action-cards').exists).ok();
  await t.expect(Selector('#couch-action-play').hasAttribute('disabled')).ok();
});

test('phone offers nickname editing and sharing', async t => {
  await t.resizeWindow(390, 844);
  await t.click('#couch-profile-button');
  await t.expect(Selector('#couch-profile-panel').visible).ok();
  await t.expect(Selector('#couch-player-name').exists).ok();
  await t.expect(Selector('#couch-invite-link').value).contains('couch=phone');
});

test.page('http://127.0.0.1:8272/tablet-hop-smoke-tv?couch=tv')
('tv removes toolbar and identifies its room', async t => {
  await t.resizeWindow(1360, 768);
  await t.expect(Selector('body').getAttribute('data-couch-mode')).eql('tv');
  await t.expect(Selector('#couch-tv-room').innerText).contains('tablet-hop-smoke-tv');
  await t.expect(Selector('#toolbar').visible).notOk();
});

test.page('http://127.0.0.1:8272/tablet-hop-smoke-classic')
('classic mode remains unaffected', async t => {
  await t.resizeWindow(1000, 800);
  await t.expect(Selector('body').hasAttribute('data-couch-mode')).notOk();
  await t.expect(Selector('#couch-ui').exists).notOk();
  await t.expect(Selector('#toolbar').exists).ok();
});
