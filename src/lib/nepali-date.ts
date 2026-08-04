
import NepaliDate from 'nepali-date-converter';

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