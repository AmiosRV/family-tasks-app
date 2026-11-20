
const BERLIN_TIME_ZONE = 'Europe/Berlin';

export type RepeatType =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly';

export function getTodayBerlin(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BERLIN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}`;
}

function parseDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    throw new Error(`Invalid date format: ${date}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const check = new Date(Date.UTC(year, month - 1, day));

  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${date}`);
  }

  return { year, month, day };
}

export function formatDateBerlin(
  date: string,
  locale = 'de-DE',
): string {
  const { year, month, day } = parseDate(date);

  const value = new Date(Date.UTC(year, month - 1, day, 12));

  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(value);
}

export function getNextOccurrence(
  date: string,
  repeatType: RepeatType,
): string {
  const { year, month, day } = parseDate(date);

  const nextDate = new Date(Date.UTC(year, month - 1, 1));

  switch (repeatType) {
    case 'daily':
      nextDate.setUTCDate(day + 1);
      break;

    case 'weekly':
      nextDate.setUTCDate(day + 7);
      break;

    case 'monthly':
      nextDate.setUTCMonth(month + 1);
      nextDate.setUTCDate(0);
      break;

    case 'yearly': {
      const nextYear = year + 1;
      const lastDay = new Date(
        Date.UTC(nextYear, month, 0),
      ).getUTCDate();

      nextDate.setUTCFullYear(nextYear);
      nextDate.setUTCDate(Math.min(day, lastDay));
      break;
    }

    case 'none':
      return date;
  }

  return [
    nextDate.getUTCFullYear(),
    String(nextDate.getUTCMonth() + 1).padStart(2, '0'),
    String(nextDate.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

