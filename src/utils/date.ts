
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


function getBerlinDateTimeParts(timestamp: number) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BERLIN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp));

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

function getBerlinOffset(timestamp: number): number {
  const parts = getBerlinDateTimeParts(timestamp);

  const berlinAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return berlinAsUtc - Math.floor(timestamp / 1000) * 1000;
}

/**
 * Converts a Berlin calendar date and local time into a real Date.
 *
 * DST behavior:
 * - Nonexistent spring time is shifted forward by the DST gap.
 * - Repeated autumn time uses the earlier occurrence.
 */
export function getBerlinDateTimeInstant(
  date: string,
  time: string,
): Date {
  const { year, month, day } = parseDate(date);

  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time);

  if (!timeMatch) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = Number(timeMatch[3] ?? '0');

  if (hour > 23 || minute > 59 || second > 59) {
    throw new Error(`Invalid time: ${time}`);
  }

  const target = {
    year,
    month,
    day,
    hour,
    minute,
    second,
  };

  const wallTime = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
  );

  const offsets = new Set<number>();

  // Collect offsets around the target date, including both DST sides.
  for (let hours = -36; hours <= 36; hours += 6) {
    offsets.add(getBerlinOffset(wallTime + hours * 60 * 60 * 1000));
  }

  const candidates = [...offsets].map((offset) => {
    const timestamp = wallTime - offset;
    const local = getBerlinDateTimeParts(timestamp);

    const localWallTime = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second,
    );

    return {
      timestamp,
      localWallTime,
      matches:
        local.year === target.year &&
        local.month === target.month &&
        local.day === target.day &&
        local.hour === target.hour &&
        local.minute === target.minute &&
        local.second === target.second,
    };
  });

  // Autumn: two exact matches. Choose the earlier instant.
  const exactMatches = candidates
    .filter((candidate) => candidate.matches)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (exactMatches.length > 0) {
    return new Date(exactMatches[0].timestamp);
  }

  // Spring: the requested local time does not exist.
  // Choose the first valid local time after the requested one.
  const afterGap = candidates
    .filter((candidate) => candidate.localWallTime > wallTime)
    .sort((a, b) => a.localWallTime - b.localWallTime);

  if (afterGap.length > 0) {
    return new Date(afterGap[0].timestamp);
  }

  throw new Error(`Cannot resolve Berlin date and time: ${date} ${time}`);
}
