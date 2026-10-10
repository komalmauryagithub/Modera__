import React, { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
} from 'date-fns';
import CalendarDayCell from './CalendarDayCell';
import '../../styles/calendar.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarGrid = ({
  currentMonth,
  eventsByDate = {},
  onSelectDay,
  onSelectEvent,
}) => {
  // Compute complete 7-column calendar matrix with correct weekday alignment
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  return (
    <div className="calendar-grid-wrapper">
      {/* Weekday Column Headers */}
      <div className="calendar-weekdays-grid">
        {WEEKDAYS.map((dayName) => (
          <div key={dayName} className="calendar-weekday-col">
            {dayName}
          </div>
        ))}
      </div>

      {/* Days Matrix */}
      <div className="calendar-days-grid">
        {calendarDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];

          return (
            <CalendarDayCell
              key={dateKey}
              day={day}
              currentMonth={currentMonth}
              events={dayEvents}
              onSelectDay={onSelectDay}
              onSelectEvent={onSelectEvent}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
