import { useState, useEffect, useMemo } from 'react';
import { Popover, Input } from 'antd';
import { CalendarOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import NepaliFunctions from '@sajanm/nepali-functions';

const NEPALI_CALENDAR_STYLE_ID = 'nepali-calendar-dark-override';

const injectCalendarStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(NEPALI_CALENDAR_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = NEPALI_CALENDAR_STYLE_ID;
  style.textContent = `
    .nepali-datepicker-popover .ant-popover,
    .nepali-datepicker-popover [class*="ant-popover"],
    .nepali-datepicker-popover .ant-popover-inner,
    .nepali-datepicker-popover [class*="ant-popover-inner"],
    .nepali-datepicker-popover .ant-popover-inner-content,
    .nepali-datepicker-popover [class*="ant-popover-inner-content"] {
      background: transparent !important;
      box-shadow: none !important;
      padding: 0 !important;
      border: none !important;
    }
    .nepali-datepicker-popover .ant-popover-arrow,
    .nepali-datepicker-popover [class*="ant-popover-arrow"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
    }
  `;
  document.head.appendChild(style);
};

// --- Nepali Constants ---
const NEPALI_MONTHS_NP = [
  'वैशाख', 'जेठ', 'असार', 'साउन',
  'भदौ', 'असोज', 'कात्तिक', 'मंसिर',
  'पुस', 'माघ', 'फागुन', 'चैत',
];

const NEPALI_DAYS_NP = ['आ', 'सो', 'मं', 'बु', 'बि', 'शु', 'श'];

const NEPALI_NUMERALS: Record<string, string> = {
  '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
  '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
};

const toNepaliNumerals = (num: number | string): string =>
  String(num).replace(/\d/g, (d) => NEPALI_NUMERALS[d] || d);

const padZero = (num: number): string => String(num).padStart(2, '0');

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface AntdNepaliDatePickerProps {
  value?: string;
  onChange?: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  returnEnglishDate?: boolean;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export default function AntdNepaliDatePicker({
  value,
  onChange,
  placeholder = 'YYYY/MM/DD',
  className = '',
  returnEnglishDate = false,
  disabled = false,
  style,
}: AntdNepaliDatePickerProps) {
  useEffect(() => {
    injectCalendarStyles();
  }, []);

  const [open, setOpen] = useState(false);

  // Current today in BS
  const todayBs = useMemo(() => {
    try {
      const today = new Date();
      const adStr = `${today.getFullYear()}-${padZero(today.getMonth() + 1)}-${padZero(today.getDate())}`;
      const [y, m, d] = adStr.split('-').map(Number);
      return NepaliFunctions.AD2BS({ year: y, month: m, day: d }) as {
        year: number;
        month: number;
        day: number;
      };
    } catch {
      return { year: 2081, month: 1, day: 1 };
    }
  }, []);

  const [viewYear, setViewYear] = useState<number>(todayBs.year);
  const [viewMonth, setViewMonth] = useState<number>(todayBs.month);

  const [selectedBs, setSelectedBs] = useState<{
    year: number;
    month: number;
    date: number;
  } | null>(null);

  // Sync external value
  useEffect(() => {
    if (value) {
      if (returnEnglishDate) {
        try {
          const adDate = new Date(value);
          if (!isNaN(adDate.getTime())) {
            const y = adDate.getFullYear();
            const m = adDate.getMonth() + 1;
            const d = adDate.getDate();
            const bs = NepaliFunctions.AD2BS({ year: y, month: m, day: d }) as {
              year: number;
              month: number;
              day: number;
            };
            setSelectedBs({ year: bs.year, month: bs.month, date: bs.day });
            setViewYear(bs.year);
            setViewMonth(bs.month);
          }
        } catch {
          const parts = value.replace(/-/g, '/').split('/');
          if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const d = parseInt(parts[2], 10);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
              const bs = NepaliFunctions.AD2BS({ year: y, month: m, day: d }) as {
                year: number;
                month: number;
                day: number;
              };
              setSelectedBs({ year: bs.year, month: bs.month, date: bs.day });
              setViewYear(bs.year);
              setViewMonth(bs.month);
            }
          }
        }
      } else {
        const parts = value.replace(/-/g, '/').split('/');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          const d = parseInt(parts[2], 10);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            setSelectedBs({ year: y, month: m, date: d });
            setViewYear(y);
            setViewMonth(m);
          }
        }
      }
    } else {
      setSelectedBs(null);
    }
  }, [value, returnEnglishDate]);

  // Month info: start weekday, days in month, AD day for each BS day, Saturdays
  const monthInfo = useMemo(() => {
    try {
      const daysInMonth = NepaliFunctions.BS.GetDaysInMonth(viewYear, viewMonth);

      const adForDay1 = NepaliFunctions.BS2AD({
        year: viewYear,
        month: viewMonth,
        day: 1,
      }) as { year: number; month: number; day: number };

      const startDay = new Date(
        adForDay1.year,
        adForDay1.month - 1,
        adForDay1.day
      ).getDay();

      const adDays: number[] = [];
      const saturdays = new Set<number>();

      for (let d = 1; d <= daysInMonth; d++) {
        try {
          const ad = NepaliFunctions.BS2AD({
            year: viewYear,
            month: viewMonth,
            day: d,
          }) as { year: number; month: number; day: number };
          adDays[d] = ad.day;
          if (new Date(ad.year, ad.month - 1, ad.day).getDay() === 6) {
            saturdays.add(d);
          }
        } catch {
          adDays[d] = d;
        }
      }

      // English month range for header (from first & last day of BS month)
      const adFirst = NepaliFunctions.BS2AD({
        year: viewYear,
        month: viewMonth,
        day: 1,
      }) as { year: number; month: number; day: number };

      const adLast = NepaliFunctions.BS2AD({
        year: viewYear,
        month: viewMonth,
        day: daysInMonth,
      }) as { year: number; month: number; day: number };

      let engMonthRange = '';
      if (adFirst.month === adLast.month) {
        engMonthRange = `${MONTH_SHORT[adFirst.month - 1]} ${adFirst.year}`;
      } else if (adFirst.year === adLast.year) {
        engMonthRange = `${MONTH_SHORT[adFirst.month - 1]} / ${MONTH_SHORT[adLast.month - 1]} ${adFirst.year}`;
      } else {
        engMonthRange = `${MONTH_SHORT[adFirst.month - 1]} ${adFirst.year} / ${MONTH_SHORT[adLast.month - 1]} ${adLast.year}`;
      }

      return { startDay, daysInMonth, saturdays, adDays, engMonthRange };
    } catch {
      return {
        startDay: 0,
        daysInMonth: 30,
        saturdays: new Set<number>(),
        adDays: [] as number[],
        engMonthRange: '',
      };
    }
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formattedBs = `${viewYear}/${padZero(viewMonth)}/${padZero(day)}`;
    setSelectedBs({ year: viewYear, month: viewMonth, date: day });

    if (returnEnglishDate) {
      try {
        const [y, m, d] = formattedBs.split('/').map(Number);
        const ad = NepaliFunctions.BS2AD({ year: y, month: m, day: d }) as {
          year: number;
          month: number;
          day: number;
        };
        const adStr = `${ad.year}-${padZero(ad.month)}-${padZero(ad.day)}`;
        onChange?.(adStr);
      } catch {
        onChange?.(formattedBs);
      }
    } else {
      onChange?.(formattedBs);
    }
    setOpen(false);
  };

  const displayValue = selectedBs
    ? `${toNepaliNumerals(selectedBs.year)}/${toNepaliNumerals(padZero(selectedBs.month))}/${toNepaliNumerals(padZero(selectedBs.date))}`
    : '';

  const calendarContent = (
    <div
      style={{
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        width: 280,
        padding: '10px 8px 8px',
        userSelect: 'none',
        boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          onClick={handlePrevMonth}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <LeftOutlined />
        </button>

        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              color: '#fff',
              fontWeight: 600,
              fontSize: 15,
              lineHeight: 1.3,
            }}
          >
            {NEPALI_MONTHS_NP[viewMonth - 1]} {toNepaliNumerals(viewYear)}
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 10,
              marginTop: 1,
              fontWeight: 400,
            }}
          >
            {monthInfo.engMonthRange}
          </div>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <RightOutlined />
        </button>
      </div>

      {/* Divider */}
      <div
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          marginBottom: 6,
        }}
      />

      {/* Weekday headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          marginBottom: 4,
        }}
      >
        {NEPALI_DAYS_NP.map((day, idx) => (
          <span
            key={day}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: idx === 6 ? '#f87171' : '#ffffff',
              padding: '3px 0',
            }}
          >
            {day}
          </span>
        ))}
      </div>

      {/* Day grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px 0',
        }}
      >
        {Array.from({ length: monthInfo.startDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: monthInfo.daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const isSelected =
            selectedBs?.year === viewYear &&
            selectedBs?.month === viewMonth &&
            selectedBs?.date === dayNum;

          const isToday =
            todayBs.year === viewYear &&
            todayBs.month === viewMonth &&
            todayBs.day === dayNum;

          const isSaturday = monthInfo.saturdays.has(dayNum);
          const adDay = monthInfo.adDays[dayNum] ?? dayNum;

          let nepaliColor = 'rgba(255,255,255,0.92)';
          let engColor = 'rgba(255,255,255,0.38)';

          if (isSelected) {
            nepaliColor = '#fff';
            engColor = 'rgba(255,255,255,0.85)';
          } else if (isToday) {
            nepaliColor = '#60a5fa';
            engColor = 'rgba(96,165,250,0.75)';
          } else if (isSaturday) {
            nepaliColor = '#f87171';
            engColor = 'rgba(248,113,113,0.7)';
          }

          return (
            <button
              key={dayNum}
              type="button"
              onClick={() => handleSelectDay(dayNum)}
              style={{
                height: 36,
                border: 'none',
                borderRadius: 6,
                background: isSelected ? '#2563eb' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                position: 'relative',
                transition: 'background 0.12s',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: 1.15,
                  color: nepaliColor,
                }}
              >
                {toNepaliNumerals(dayNum)}
              </span>
              <span
                style={{
                  fontSize: 9,
                  lineHeight: 1,
                  marginTop: 1,
                  color: engColor,
                  position: 'absolute',
                  bottom: 2,
                  right: 4,
                }}
              >
                {adDay}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <Popover
      content={calendarContent}
      trigger="click"
      open={open && !disabled}
      onOpenChange={(v) => !disabled && setOpen(v)}
      placement="bottomLeft"
      overlayClassName="nepali-datepicker-popover"
      overlayStyle={{ backgroundColor: 'transparent', boxShadow: 'none', padding: 0 }}
      styles={{
        root: { backgroundColor: 'transparent' },
        container: { backgroundColor: 'transparent', padding: 0, boxShadow: 'none' },
      }}
      getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
    >
      <Input
        readOnly
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        className={`cursor-pointer ${className}`}
        style={style}
        suffix={<CalendarOutlined className="text-slate-400" />}
      />
    </Popover>
  );
}
