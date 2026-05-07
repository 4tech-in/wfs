'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CalendarDay } from '@/types/calendar';
import { Reminder } from '@/types/reminder';
import { AttendanceDashboardCount } from '@/types/attendance';
import { Bell } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CalendarDayCellProps {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  data?: CalendarDay;
  reminders?: Reminder[];
  attendanceStats?: AttendanceDashboardCount;
  onClick: (date: Date) => void;
}

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  day,
  month,
  year,
  isCurrentMonth,
  isSelected,
  isToday,
  data,
  reminders,
  attendanceStats,
  onClick,
}) => {
  const date = new Date(year, month, day);
  const isSunday = date.getDay() === 0;
  const isHoliday = data?.dayType === 'holiday';


  return (
    <div
      onClick={() => onClick(date)}
      className={cn(
        "min-h-[140px] p-2 border-r border-b border-sidebar-border/30 transition-all cursor-pointer relative group overflow-hidden",
        !isCurrentMonth && "bg-slate-100/80 text-slate-300 opacity-90",
        isSelected && "ring-2 ring-teal-500/50 ring-inset bg-teal-50/20 z-10",
        isToday && "bg-teal-50/10",
        "hover:bg-teal-50/30"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={cn(
          "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full transition-colors",
          isToday ? "bg-teal-500 text-white" : isCurrentMonth ? "text-slate-600" : "text-slate-400",
          isSelected && !isToday && "bg-teal-500/20 text-teal-700"
        )}>
          {day}
        </span>
      </div>

      <div className="space-y-1.5 overflow-y-auto max-h-[90px] custom-scrollbar scrollbar-hide">
        {isHoliday && data?.description && (
          <div className={cn(
            "p-2 rounded-lg border-0 text-[10px] sm:text-[11px] leading-tight font-semibold shadow-sm relative group/event",
            data.isNationalHoliday 
              ? "bg-[#ECF5DE] text-[#617F30]" 
              : "bg-[#FFF8E1] text-[#B45309]"
          )}>
            <div className="text-[8px] font-bold uppercase tracking-tight opacity-60 mb-0.5">
              {data.isNationalHoliday ? 'National Holiday' : 'Company Holiday'}
            </div>
            <div className="line-clamp-2 pr-4">{data.description}</div>
            
            {/* Standard time placeholder */}
            <div className="mt-2 text-[9px] font-medium opacity-60">All Day</div>
            
            {/* Indicator Dot at bottom right */}
            <div className={cn(
               "absolute bottom-2 right-2 w-2 h-2 rounded-full",
               data.isNationalHoliday ? "bg-[#10B981]" : "bg-[#047857]" 
            )} />
          </div>
        )}

        {reminders && reminders.length > 0 && (
          <div className="space-y-1">
            {reminders.slice(0, 2).map((reminder) => (
              <div 
                key={reminder._id}
                className={cn(
                  "p-2 rounded-lg border-0 text-[10px] sm:text-[11px] leading-tight font-semibold shadow-sm relative group/event bg-teal-50 text-teal-700 border-l-2 border-teal-500",
                )}
              >
                <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-tight opacity-60 mb-0.5">
                  <Bell className="h-2 w-2" />
                  {reminder.frequency === 'once' ? 'One-time' : reminder.frequency}
                </div>
                <div className="line-clamp-1 pr-4">{reminder.title}</div>
                
                <div className="mt-1 text-[9px] font-medium opacity-60">{reminder.time}</div>
                
                <div className={cn(
                   "absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-teal-500"
                )} />
              </div>
            ))}
            {reminders.length > 2 && (
              <div className="text-[9px] font-black uppercase tracking-widest text-teal-600 px-2 py-1.5 bg-teal-50/80 rounded-lg border border-teal-100 text-center animate-pulse">
                +{reminders.length - 2} More Reminders
              </div>
            )}
          </div>
        )}{/* Placeholder for future events/agendas */}
        {!isHoliday && isSunday && isCurrentMonth && (
          <div className="p-2 rounded-lg bg-slate-100/50 border border-slate-200 text-slate-500 text-[11px] leading-tight font-medium opacity-60 italic">
            Weekend Break
          </div>
        )}

        {/* Attendance Stats Summary */}
        {attendanceStats && attendanceStats.totalUsers > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="pt-2 mt-auto border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                    T: <span className="text-slate-900">{attendanceStats.totalUsers}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <div className="flex items-center gap-1 text-emerald-600 text-[9px] font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>P: {attendanceStats.present}</span>
                    </div>
                    <div className="flex items-center gap-1 text-rose-600 text-[9px] font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>A: {attendanceStats.absent}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-600 text-[9px] font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>L: {attendanceStats.onLeave}</span>
                    </div>
                    <div className="flex items-center gap-1 text-teal-800 text-[9px] font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-900 shrink-0" />
                      <span>NM: {attendanceStats.notMarked}</span>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="p-3 bg-slate-900 text-white rounded-xl border-slate-800 shadow-2xl">
                <div className="space-y-2 min-w-[140px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Labor</span>
                    <span className="text-xs font-black">{attendanceStats.totalUsers}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-slate-400 font-bold">Present</span>
                      <span className="ml-auto text-[10px] font-black text-emerald-400">{attendanceStats.present}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span className="text-[10px] text-slate-400 font-bold">Absent</span>
                      <span className="ml-auto text-[10px] font-black text-rose-400">{attendanceStats.absent}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-[10px] text-slate-400 font-bold">Leave</span>
                      <span className="ml-auto text-[10px] font-black text-amber-400">{attendanceStats.onLeave}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-900" />
                      <span className="text-[10px] text-slate-400 font-bold">Not Marked</span>
                      <span className="ml-auto text-[10px] font-black text-white">{attendanceStats.notMarked}</span>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Modern hover indicator at bottom */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-1 bg-teal-500 transform scale-x-0 transition-transform origin-left group-hover:scale-x-100",
        isSelected ? "scale-x-100 opacity-100" : "opacity-0"
      )} />
    </div>
  );
};

export default CalendarDayCell;
