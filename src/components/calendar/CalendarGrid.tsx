'use client';

import React from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  format
} from 'date-fns';
import { CalendarDayCell } from './CalendarDayCell';
import { CalendarDay } from '@/types/calendar';
import { Reminder } from '@/types/reminder';
import { AttendanceDashboardCount } from '@/types/attendance';

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  onDateClick: (date: Date) => void;
  calendarData?: CalendarDay[];
  reminders?: Reminder[];
  attendanceStats?: (AttendanceDashboardCount | undefined)[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  selectedDate,
  onDateClick,
  calendarData = [],
  reminders = [],
  attendanceStats = [],
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  // Helper to find data for a specific date
  const getDataForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return calendarData.find(d => d.date?.startsWith(dateStr));
  };

  const getRemindersForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reminders.filter(r => {
      const targetDate = r.nextOccurrence || r.startDate;
      return targetDate?.startsWith(dateStr);
    });
  };

  const getAttendanceForDate = (index: number) => {
    return attendanceStats[index];
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="grid grid-cols-7 bg-slate-50/50 border-b border-sidebar-border/30 shrink-0">
        {WEEKDAYS.map(day => (
          <div key={day} className="py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
            {day}
          </div>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-hide">
        <div className="grid grid-cols-7 border-l border-sidebar-border/30 h-full">
          {days.map((date, index) => (
            <CalendarDayCell 
              key={date.toString()}
              day={date.getDate()}
              month={date.getMonth()}
              year={date.getFullYear()}
              isCurrentMonth={isSameMonth(date, monthStart)}
              isSelected={selectedDate ? isSameDay(date, selectedDate) : false}
              isToday={isSameDay(date, new Date())}
              data={getDataForDate(date)}
              reminders={getRemindersForDate(date)}
              attendanceStats={getAttendanceForDate(index)}
              onClick={onDateClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;
