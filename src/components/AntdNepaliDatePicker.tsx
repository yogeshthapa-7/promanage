'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Popover, Input, Select, Button } from 'antd';
import { CalendarOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import DateConverter from '@remotemerge/nepali-date-converter';

// --- Nepali Constants ---
const NEPALI_MONTHS_NP = [
  'वैशाख', 'जेठ', 'असार', 'साउन',
  'भदौ', 'असोज', 'कात्तिक', 'मंसिर',
  'पुस', 'माघ', 'फागुन', 'चैत',
];

const NEPALI_DAYS_NP = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिही', 'शुक्र', 'शनि'];

const NEPALI_NUMERALS: Record<string, string> = {
  '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
  '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
};

// Utility to translate digits to Devanagari numerals
const toNepaliNumerals = (num: number | string): string =>
  String(num).replace(/\d/g, (d) => NEPALI_NUMERALS[d] || d);

// Helper to convert padded number strings (e.g., 5 -> "05")
const padZero = (num: number): string => String(num).padStart(2, '0');

interface AntdNepaliDatePickerProps {
  value?: string;
  onChange?: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  returnEnglishDate?: boolean;
}

export default function AntdNepaliDatePicker({
  value,
  onChange,
  placeholder = 'YYYY/MM/DD',
  className = '',
  returnEnglishDate = false,
}: AntdNepaliDatePickerProps) {
  const [open, setOpen] = useState(false);

  // Get current today in BS
  const todayBs = useMemo(() => {
    try {
      const today = new Date();
      const adStr = `${today.getFullYear()}-${padZero(today.getMonth() + 1)}-${padZero(today.getDate())}`;
      return new DateConverter(adStr).toBs();
    } catch {
      return { year: 2081, month: 1, date: 1 };
    }
  }, []);

  // View state for current active calendar month/year
  const [viewYear, setViewYear] = useState<number>(todayBs.year);
  const [viewMonth, setViewMonth] = useState<number>(todayBs.month); // 1-indexed (1 = Baisakh)

  // Selected date state
  const [selectedBs, setSelectedBs] = useState<{ year: number; month: number; date: number } | null>(null);

  // Sync external value
  useEffect(() => {
    if (value) {
      if (returnEnglishDate) {
        try {
          const adDate = new Date(value);
          if (!isNaN(adDate.getTime())) {
            const adStr = `${adDate.getFullYear()}/${padZero(adDate.getMonth() + 1)}/${padZero(adDate.getDate())}`;
            const bs = new DateConverter(adStr).toBs();
            setSelectedBs({ year: bs.year, month: bs.month, date: bs.date });
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
              setSelectedBs({ year: y, month: m, date: d });
              setViewYear(y);
              setViewMonth(m);
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

  // Compute month information: start weekday offset and total days in month
  const monthInfo = useMemo(() => {
    try {
      // Get starting AD date for the 1st day of this BS month
      const adForDay1 = new DateConverter(`${viewYear}/${viewMonth}/1`).toAd();
      const startDay = new Date(adForDay1.year, adForDay1.month - 1, adForDay1.date).getDay(); // 0 = Sun ... 6 = Sat

      // Calculate total days in this BS month (testing 29 to 32)
      let daysInMonth = 29;
      for (let d = 29; d <= 32; d++) {
        try {
          const check = new DateConverter(`${viewYear}/${viewMonth}/${d}`).toBs();
          if (check.year === viewYear && check.month === viewMonth) {
            daysInMonth = d;
          } else {
            break;
          }
        } catch {
          break;
        }
      }

      return { startDay, daysInMonth };
    } catch {
      return { startDay: 0, daysInMonth: 30 };
    }
  }, [viewYear, viewMonth]);

  // Handlers for month navigation
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
        const ad = new DateConverter(formattedBs).toAd();
        const adStr = `${ad.year}-${padZero(ad.month)}-${padZero(ad.date)}`;
        onChange?.(adStr);
      } catch {
        onChange?.(formattedBs);
      }
    } else {
      onChange?.(formattedBs);
    }
    setOpen(false);
  };

  // Formatted display string for input box (Devanagari script)
  const displayValue = selectedBs
    ? `${toNepaliNumerals(selectedBs.year)}/${toNepaliNumerals(padZero(selectedBs.month))}/${toNepaliNumerals(padZero(selectedBs.date))}`
    : '';

  // Generate Year options (2000 BS to 2090 BS)
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = 2000; y <= 2090; y++) {
      years.push({ label: toNepaliNumerals(y), value: y });
    }
    return years;
  }, []);

  const calendarContent = (
    <div className="w-72 p-2 select-none">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <Button
          type="text"
          size="small"
          icon={<LeftOutlined />}
          onClick={handlePrevMonth}
          className="text-slate-600 hover:text-violet-600"
        />

        <div className="flex items-center gap-1.5">
          <Select
            size="small"
            value={viewMonth}
            onChange={(val) => setViewMonth(val)}
            options={NEPALI_MONTHS_NP.map((m, idx) => ({ label: m, value: idx + 1 }))}
            className="w-24 text-xs font-semibold"
            popupMatchSelectWidth={false}
          />
          <Select
            size="small"
            value={viewYear}
            onChange={(val) => setViewYear(val)}
            options={yearOptions}
            className="w-20 text-xs font-semibold"
            popupMatchSelectWidth={false}
          />
        </div>

        <Button
          type="text"
          size="small"
          icon={<RightOutlined />}
          onClick={handleNextMonth}
          className="text-slate-600 hover:text-violet-600"
        />
      </div>

      {/* Weekday Names Header */}
      <div className="grid grid-cols-7 text-center mb-1 border-b border-slate-100 pb-1">
        {NEPALI_DAYS_NP.map((day, idx) => (
          <span
            key={day}
            className={`text-xs font-bold ${idx === 6 ? 'text-red-500' : 'text-slate-500'}`}
          >
            {day}
          </span>
        ))}
      </div>

      {/* Day Cells Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Empty offset cells for start weekday */}
        {Array.from({ length: monthInfo.startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8" />
        ))}

        {/* Month Day Buttons */}
        {Array.from({ length: monthInfo.daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const isSelected =
            selectedBs?.year === viewYear &&
            selectedBs?.month === viewMonth &&
            selectedBs?.date === dayNum;

          const isToday =
            todayBs.year === viewYear &&
            todayBs.month === viewMonth &&
            todayBs.date === dayNum;

          return (
            <button
              key={dayNum}
              type="button"
              onClick={() => handleSelectDay(dayNum)}
              className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-violet-600 text-white font-bold shadow-sm'
                  : isToday
                  ? 'border border-violet-500 text-violet-700 font-bold'
                  : 'text-slate-700 hover:bg-violet-50 hover:text-violet-600'
              }`}
            >
              {toNepaliNumerals(dayNum)}
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
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
      overlayClassName="nepali-datepicker-popover"
      getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
    >
      <Input
        readOnly
        value={displayValue}
        placeholder={placeholder}
        className={`cursor-pointer ${className}`}
        suffix={<CalendarOutlined className="text-slate-400" />}
      />
    </Popover>
  );
}