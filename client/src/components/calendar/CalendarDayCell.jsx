import React from 'react';
import { format, isSameMonth, isToday } from 'date-fns';
import '../../styles/calendar.css';

const CalendarDayCell = ({
  day,
  currentMonth,
  events = [],
  onSelectDay,
  onSelectEvent,
}) => {
  const dateKey = format(day, 'yyyy-MM-dd');
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isCurrentDay = isToday(day);

  const handleCellClick = (e) => {
    // Open day modal or create modal
    onSelectDay(dateKey, events);
  };

  const handleEventClick = (e, event) => {
    e.stopPropagation(); // Prevent triggering cell click
    onSelectEvent(event);
  };

  // Preview at most 2 events directly in cell
  const visibleEvents = events.slice(0, 2);
  const remainingCount = events.length - visibleEvents.length;

  return (
    <div
      className={`calendar-day-cell ${!isCurrentMonth ? 'other-month' : ''} ${isCurrentDay ? 'is-today' : ''}`}
      onClick={handleCellClick}
      title={`${format(day, 'EEEE, MMMM d, yyyy')} (${events.length} events)`}
    >
      <div className="day-header">
        <span className="day-number">{format(day, 'd')}</span>
        {events.length > 0 && (
          <span className="day-event-count-badge" title={`${events.length} events`}>
            {events.length}
          </span>
        )}
      </div>

      <div className="day-events-list">
        {visibleEvents.map((event) => (
          <div
            key={event.id}
            className={`event-chip cat-${event.category || 'General'}`}
            onClick={(e) => handleEventClick(e, event)}
            title={`${event.title}${event.time ? ` (${event.time})` : ''}`}
          >
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                alt=""
                className="event-chip-thumb"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <span className="event-chip-text">{event.title}</span>
          </div>
        ))}

        {remainingCount > 0 && (
          <div className="more-events-chip">
            +{remainingCount} more
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarDayCell;
