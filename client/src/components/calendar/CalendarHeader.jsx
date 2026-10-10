import React from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import Button from '../common/Button';
import '../../styles/calendar.css';

const CalendarHeader = ({
  currentDate,
  eventCount = 0,
  onPrevMonth,
  onNextMonth,
  onToday,
  onAddEvent,
}) => {
  return (
    <div className="calendar-header">
      <div className="calendar-title-group">
        <h2 className="calendar-month-title">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <span className="calendar-event-count">
          {eventCount} {eventCount === 1 ? 'Memory' : 'Memories'}
        </span>
      </div>

      <div className="calendar-nav-controls">
        <button
          type="button"
          className="calendar-today-btn"
          onClick={onToday}
          title="Jump to current date"
        >
          Today
        </button>

        <button
          type="button"
          className="calendar-nav-btn"
          onClick={onPrevMonth}
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          type="button"
          className="calendar-nav-btn"
          onClick={onNextMonth}
          aria-label="Next month"
        >
          <ChevronRight size={20} />
        </button>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={onAddEvent}
          style={{ marginLeft: '0.5rem' }}
        >
          New Event
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
