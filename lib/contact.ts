/** Accept Ukrainian national/international numbers, allowing normal separators. */
export function normalizePhone(input: string): string | null {
  if (!/^[+\d\s()-]+$/.test(input.trim())) return null;
  if (
    (input.match(/\+/g) || []).length > 1 ||
    (input.includes('+') && !input.trim().startsWith('+'))
  )
    return null;
  const digits = input.replace(/\D/g, '');
  if (/^0\d{9}$/.test(digits) && !input.includes('+')) return `+38${digits}`;
  return /^380\d{9}$/.test(digits) ? `+${digits}` : null;
}
export function viberLink(
  phone: string,
  userAgent: string,
  fallbackUrl: string,
): string {
  const number = encodeURIComponent(phone);
  if (/Android/i.test(userAgent)) {
    return `intent://chat?number=${number}#Intent;scheme=viber;package=com.viber.voip;S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`;
  }
  return `viber://chat?number=${number}`;
}
/** Official Telegram phone-number universal link; app privacy may restrict lookup. */
export function telegramLink(phone: string): string {
  return `https://t.me/${phone}`;
}
