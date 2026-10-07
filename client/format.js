import { locales } from './i18n';

export const timeZone = 'Asia/Tashkent';
export function formatMoney(value, language) {
  const amount = new Intl.NumberFormat(locales[language], { maximumFractionDigits: 2 }).format(Number(value));
  return `${amount} ${language === 'uz' ? 'so‘m' : 'UZS'}`;
}
export function formatDate(value, language) {
  return new Intl.DateTimeFormat(locales[language], {
    timeZone, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(value));
}
export function tashkentInput(value) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const fields = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}`;
}
// Pickup inputs use Tashkent wall time, independent of the browser's zone.
export const pickupInstant = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? Date.parse(`${value}:00+05:00`) : NaN;
