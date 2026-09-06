import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, viberLink, telegramLink } from '../lib/contact.ts';
test('Ukrainian numbers normalize consistently without silently accepting malformed input', () => {
  for (const phone of [
    '0970864989',
    '+380970864989',
    '380970864989',
    '+380 (97) 086-49-89',
    '097 086 49 89',
  ])
    assert.equal(normalizePhone(phone), '+380970864989');
  for (const phone of [
    '',
    '097',
    '+0970864989',
    '++380970864989',
    '38+0970864989',
    '+380970864989123',
    'call 0970864989',
    '0970864989 ext 4',
    '1234567890',
  ])
    assert.equal(normalizePhone(phone), null, phone);
});
test('Viber uses an explicit app intent with a safe same-page fallback on Android', () => {
  const fallback = 'https://example.test/aframe/#contact';
  const link = viberLink(
    '+380970864989',
    'Mozilla/5.0 (Linux; Android 15)',
    fallback,
  );
  assert.ok(link.startsWith('intent://chat?number=%2B380970864989#Intent;'));
  assert.ok(link.includes('package=com.viber.voip;'));
  assert.ok(
    link.includes(`S.browser_fallback_url=${encodeURIComponent(fallback)};end`),
  );
});
test('iOS and desktop preserve the direct Viber chat scheme', () => {
  for (const agent of ['iPhone OS 18', 'Macintosh', 'Windows NT 10.0'])
    assert.equal(
      viberLink('+380970864989', agent, 'https://example.test'),
      'viber://chat?number=%2B380970864989',
    );
});
test('Telegram provides its documented HTTPS phone-number link', () =>
  assert.equal(telegramLink('+380970864989'), 'https://t.me/+380970864989'));
