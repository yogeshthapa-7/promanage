'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import NepaliDate from 'nepali-date-converter';
import { getMonthGrid, NEPALI_MONTHS_EN, NEPALI_DAYS_SHORT } from '@/lib/calendar-helpers';

interface NepaliDatePickerProps {
  value?: string; // Formatted YYYY-MM-DD or YYYY/MM/DD
  onChange?: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
}

export default function NepaliDatePicker({
  value,
  onChange,
  placeholder = 'YYYY/MM/DD',
  className = '',
}: NepaliDatePickerProps) {
  const today = new NepaliDate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active view state
  const [viewYear, setViewYear] = useState<number>(today.getYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());

  // Selected date parsed
  const [selectedDate, setSelectedDate] = useState<{ y: number; m: number; d: number } | null>(null);

  useEffect(() => {
    if (value) {
      const parts = value.split(/[-/]/).map(Number);
      if (parts.length === 3 && !isNaN(parts[0])) {
        setSelectedDate({ y: parts[0], m: parts[1] - 1, d: parts[2] });
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
      }
    }
  }, [value]);

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthGrid = getMonthGrid(viewYear, viewMonth);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((v) => v - 1);
    } else {
      setViewMonth((v) => v - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((v) => v + 1);
    } else {
      setViewMonth((v) => v + 1);
    }
  };

  const handleSelectDay = (day: number, month: number, year: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const result = `${year}/${formattedMonth}/${formattedDay}`;

    setSelectedDate({ y: year, m: month, d: day });
    onChange?.(result);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const y = today.getYear();
    const m = today.getMonth();
    const d = today.getDate();
    handleSelectDay(d, m, y);
  };

  return (
    <div className={`relative inline-block w-full ${className}`} ref={containerRef}>
      {/* Trigger Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full h-9 px-3 bg-white border border-slate-300 rounded-md text-sm cursor-pointer hover:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all shadow-sm"
      >
        <span className={value ? 'text-slate-800 font-medium' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-400" />
      </div>

      {/* Premium Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-[9999] mt-1.5 w-72 p-3 bg-white border border-slate-200/80 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-100">
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="text-sm font-semibold text-slate-800 bg-transparent border-none outline-none cursor-pointer"
              >
                {Array.from({ length: 60 }, (_, i) => 2040 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="text-sm font-semibold text-slate-800 bg-transparent border-none outline-none cursor-pointer"
              >
                {NEPALI_MONTHS_EN.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center mb-1">
            {NEPALI_DAYS_SHORT.map((day, idx) => (
              <span
                key={day}
                className={`text-sm font-semibold ${
                  idx === 0 ? 'text-red-500' : 'text-slate-400'
                }`}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {monthGrid.map((item, index) => {
              const isSelected =
                selectedDate?.y === item.year &&
                selectedDate?.m === item.month &&
                selectedDate?.d === item.day;

              const isToday =
                today.getYear() === item.year &&
                today.getMonth() === item.month &&
                today.getDate() === item.day;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectDay(item.day, item.month, item.year)}
                  className={`h-8 w-full rounded-md text-sm font-medium flex flex-col items-center justify-center transition-all ${
                    !item.isCurrentMonth
                      ? 'text-slate-300 hover:bg-slate-50'
                      : isSelected
                      ? 'bg-violet-600 text-white font-semibold shadow-md shadow-violet-500/20'
                      : isToday
                      ? 'border border-violet-500 text-violet-600 font-semibold hover:bg-violet-50'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Footer Control */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-violet-600 font-medium hover:underline"
            >
              Today: {today.getYear()}/{String(today.getMonth() + 1).padStart(2, '0')}/{String(today.getDate()).padStart(2, '0')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}