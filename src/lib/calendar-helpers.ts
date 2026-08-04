
import NepaliDate, { dateConfigMap } from 'nepali-date-converter';

export const NEPALI_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Paush',
  'Magh',
  'Falgun',
  'Chaitra',
];

export const NEPALI_DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface CalendarDay {
  year: number;
  month: number;
  day: number;
  isCurrentMonth: boolean;
  adSubText?: string; // Optional AD date (e.g., 2024/06/15) underneath
}

export const getMonthGrid = (bsYear: number, bsMonth: number): CalendarDay[] => {
  const currentMonthFirstDay = new NepaliDate(bsYear, bsMonth, 1);
  const startDayOfWeek = currentMonthFirstDay.getDay(); // 0 = Sun, 6 = Sat
  const totalDays = dateConfigMap[bsYear]?.[NEPALI_MONTHS_EN[bsMonth]] ?? 30;

  const grid: CalendarDay[] = [];

  // 1. Previous month padding
  const prevMonth = bsMonth === 0 ? 11 : bsMonth - 1;
  const prevYear = bsMonth === 0 ? bsYear - 1 : bsYear;
  const prevMonthDays = dateConfigMap[prevYear]?.[NEPALI_MONTHS_EN[prevMonth]] ?? 30;

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    grid.push({
      year: prevYear,
      month: prevMonth,
      day: prevMonthDays - i,
      isCurrentMonth: false,
    });
  }

  // 2. Current month days
  for (let d = 1; d <= totalDays; d++) {
    grid.push({
      year: bsYear,
      month: bsMonth,
      day: d,
      isCurrentMonth: true,
    });
  }

  // 3. Next month padding to fill remaining 7-column rows
  const remaining = (7 - (grid.length % 7)) % 7;
  const nextMonth = bsMonth === 11 ? 0 : bsMonth + 1;
  const nextYear = bsMonth === 11 ? bsYear + 1 : bsYear;

  for (let d = 1; d <= remaining; d++) {
    grid.push({
      year: nextYear,
      month: nextMonth,
      day: d,
      isCurrentMonth: false,
    });
  }

  return grid;
};