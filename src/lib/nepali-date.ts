
import NepaliDate from 'nepali-date-converter';
import DateConverter from '@remotemerge/nepali-date-converter';

export interface BSDate {
  year: number;   // e.g. 2081
  month: number;  // 0 to 11
  day: number;    // 1 to 32
}

export const NEPALI_MONTHS_EN = [
  'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

export const NEPALI_DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;

  const parts = dateStr.replace(/-/g, '/').split('/');
  if (parts.length !== 3) return null;

  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

  const date = new Date(y, m, d);
  if (isNaN(date.getTime())) return null;

  return date;
}

function convertBsToAd(bsDateStr: string): Date | null {
  try {
    const ad = DateConverter(bsDateStr).toAd();
    return new Date(ad.year, ad.month - 1, ad.date);
  } catch {
    return null;
  }
}

export function calculateProgressFromDates(startDateStr: string, endDateStr: string, existingProgress: number): number {
  if (!startDateStr || !endDateStr) return existingProgress;

  let startDate = parseDateString(startDateStr);
  let endDate = parseDateString(endDateStr);

  if (!startDate || !endDate) {
    startDate = convertBsToAd(startDateStr);
    endDate = convertBsToAd(endDateStr);
  }

  if (!startDate || !endDate) return existingProgress;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  if (today <= startDate) return 0;
  if (today >= endDate) return 100;

  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = today.getTime() - startDate.getTime();

  const progress = Math.round((elapsed / totalDuration) * 100);
  return Math.min(Math.max(progress, 0), 100);
}