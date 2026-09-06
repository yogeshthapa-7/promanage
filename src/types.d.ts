declare module '@remotemerge/nepali-date-converter' {
  interface BSDate {
    year: number;
    month: number;
    date: number;
  }

  interface ADDate {
    year: number;
    month: number;
    date: number;
  }

  class DateConverter {
    constructor(dateStr: string);
    toBs(): BSDate;
    toAd(): ADDate;
  }

  export default DateConverter;
}
