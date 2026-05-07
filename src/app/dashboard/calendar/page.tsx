'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { DetailsSidebar } from '@/components/calendar/DetailsSidebar';
import { useCalendarMonth, useUpdateCalendarDay } from '@/hooks/queries/use-calendar-queries';
import { useRemindersQuery } from '@/hooks/queries/use-reminders';
import { addMonths, subMonths, format, parseISO, isValid, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isBefore, endOfToday, isSameDay } from 'date-fns';
import { useQueries } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance-service';
import { QUERY_KEYS } from '@/constants/query-keys';

function CalendarPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();



  // Initialize state from URL or default to today
  const [currentDate, setCurrentDate] = useState(() => {
    const monthParam = searchParams.get('month');
    if (monthParam) {
      const parsed = parseISO(`${monthParam}-01`);
      if (isValid(parsed)) return parsed;
    }
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsed = parseISO(dateParam);
      if (isValid(parsed)) return parsed;
    }
    return new Date();
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsed = parseISO(dateParam);
      if (isValid(parsed)) return parsed;
    }
    return null;
  });

  const [sidebarOpen, setSidebarOpen] = useState(!!selectedDate);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Synchronize state with URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const oldParams = params.toString();
    
    if (selectedDate) {
      params.set('date', format(selectedDate, 'yyyy-MM-dd'));
      params.delete('month'); 
    } else {
      params.delete('date');
      params.set('month', format(currentDate, 'yyyy-MM'));
    }
    
    // Only update if the string representation has actually changed
    if (params.toString() !== oldParams) {
      const newUrl = `${pathname}?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [selectedDate, currentDate, router, pathname, searchParams]);

  // Fetch monthly data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const { data, isLoading } = useCalendarMonth(year, month);

  // Fetch reminders
  const { data: remindersData } = useRemindersQuery({ limit: 1000000 });
  
  // Mutation for updating day
  const updateMutation = useUpdateCalendarDay();

  // Attendance stats for the grid interval
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = useMemo(() => eachDayOfInterval({
    start: startDate,
    end: endDate,
  }), [startDate, endDate]);

  const attendanceResults = useQueries({
    queries: days.map(date => ({
      queryKey: [...QUERY_KEYS.attendance.dashboardCount(), format(date, 'yyyy-MM-dd')],
      queryFn: () => attendanceService.getDashboardCount(format(date, 'yyyy-MM-dd'), format(date, 'yyyy-MM-dd')),
      enabled: isBefore(date, endOfToday()) || isSameDay(date, new Date()),
      staleTime: 300000,
    }))
  });

  const attendanceStats = useMemo(() => attendanceResults.map(r => r.data), [attendanceResults]);

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const handleDateChange = (date: Date) => setCurrentDate(date);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setSidebarOpen(true);
  };

  const handleUpdateDay = async (updateData: {
    dayType: 'working' | 'holiday';
    isNationalHoliday: boolean;
    isCompanyHoliday: boolean;
    description: string;
  }) => {
    if (!selectedDate) return;

    await updateMutation.mutateAsync({
      date: format(selectedDate, 'yyyy-MM-dd'),
      ...updateData
    });
  };

  // Find data for currently selected date
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return undefined;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return data?.days?.find(d => d.date?.startsWith(dateStr));
  }, [selectedDate, data]);

  // Find reminders for currently selected date
  const selectedReminders = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return remindersData?.data?.filter(r => {
      const targetDate = r.nextOccurrence || r.startDate;
      return targetDate?.startsWith(dateStr);
    }) || [];
  }, [selectedDate, remindersData]);

  // Find attendance stats for currently selected date
  const selectedAttendanceStats = useMemo(() => {
    if (!selectedDate) return undefined;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const index = days.findIndex(d => format(d, 'yyyy-MM-dd') === dateStr);
    return index !== -1 ? attendanceStats[index] : undefined;
  }, [selectedDate, days, attendanceStats]);

  // Use API data for the grid
  const mergedCalendarData = useMemo(() => {
    return data?.days || [];
  }, [data]);

  if (!isMounted) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-slate-50/20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">Initializing Calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50/20">
      <div className="flex-1 flex flex-col p-6 min-w-0 h-full">
        <CalendarHeader 
          currentDate={currentDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onDateChange={handleDateChange}
        />

        <div className="mt-6 flex-1 flex bg-white border border-sidebar-border/30 rounded-[24px] overflow-hidden relative shadow-none">
          <div className="flex-1 flex flex-col min-w-0 relative h-full">
            {isLoading && (
              <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                  <p className="text-sm font-medium text-slate-500 animate-pulse">Updating Schedule...</p>
                </div>
              </div>
            )}
            
            <CalendarGrid 
              currentDate={currentDate}
              selectedDate={selectedDate}
              onDateClick={handleDayClick}
              calendarData={mergedCalendarData}
              reminders={remindersData?.data || []}
              attendanceStats={attendanceStats}
            />
          </div>

          {sidebarOpen && selectedDate && (
            <>
              <div className="w-px bg-sidebar-border/20 self-stretch" />
              <DetailsSidebar 
                key={selectedDate.toISOString()}
                selectedDate={selectedDate}
                onClose={() => setSidebarOpen(false)}
                data={selectedDayData}
                reminders={selectedReminders}
                attendanceStats={selectedAttendanceStats}
                onUpdate={handleUpdateDay}
                isLoading={updateMutation.isPending}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-slate-50/20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">Initializing Calendar...</p>
        </div>
      </div>
    }>
      <CalendarPageContent />
    </Suspense>
  );
}