import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import eventApi from '../api/eventApi';
import CalendarHeader from '../components/calendar/CalendarHeader';
import CalendarGrid from '../components/calendar/CalendarGrid';
import EventModal from '../components/events/EventModal';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';
import '../styles/calendar.css';

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'view' | 'edit'
    selectedDate: '',
    selectedEvent: null,
    dayEvents: [],
  });

  const monthParam = useMemo(() => format(currentMonth, 'yyyy-MM'), [currentMonth]);

  // Fetch events for the active month
  const fetchMonthEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await eventApi.getEvents({ month: monthParam });
      if (response?.success && Array.isArray(response.events)) {
        setEvents(response.events);
      } else {
        setEvents([]);
      }
    } catch (err) {
      setError(err.message || 'Unable to load events for this month. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [monthParam]);

  useEffect(() => {
    fetchMonthEvents();
  }, [fetchMonthEvents]);

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      if (!map[ev.date]) {
        map[ev.date] = [];
      }
      map[ev.date].push(ev);
    });
    return map;
  }, [events]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  // Day Cell click handler
  const handleSelectDay = (dateKey, dayEvents) => {
    if (dayEvents.length > 0) {
      // If day has events, open view mode on the first event with list of others
      setModalState({
        isOpen: true,
        mode: 'view',
        selectedDate: dateKey,
        selectedEvent: dayEvents[0],
        dayEvents,
      });
    } else {
      // Empty day: open create mode with preselected date
      setModalState({
        isOpen: true,
        mode: 'create',
        selectedDate: dateKey,
        selectedEvent: null,
        dayEvents: [],
      });
    }
  };

  // Event chip click handler
  const handleSelectEvent = (event) => {
    const dayEvents = eventsByDate[event.date] || [event];
    setModalState({
      isOpen: true,
      mode: 'view',
      selectedDate: event.date,
      selectedEvent: event,
      dayEvents,
    });
  };

  // Add event from header button
  const handleHeaderAddEvent = () => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    setModalState({
      isOpen: true,
      mode: 'create',
      selectedDate: todayKey,
      selectedEvent: null,
      dayEvents: [],
    });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Callback when event is created or updated
  const handleEventSaved = () => {
    fetchMonthEvents();
  };

  // Callback when event is deleted
  const handleEventDeleted = () => {
    fetchMonthEvents();
  };

  return (
    <div className="calendar-container">
      <div className="calendar-card">
        <div className="washi-tape"></div>

        <CalendarHeader
          currentDate={currentMonth}
          eventCount={events.length}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
          onAddEvent={handleHeaderAddEvent}
        />

        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        {loading ? (
          <Loader message="Arranging your monthly scrapbook..." />
        ) : (
          <CalendarGrid
            currentMonth={currentMonth}
            eventsByDate={eventsByDate}
            onSelectDay={handleSelectDay}
            onSelectEvent={handleSelectEvent}
          />
        )}
      </div>

      {/* Reusable Event Modal (View, Create, Edit) */}
      <EventModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        initialMode={modalState.mode}
        initialDate={modalState.selectedDate}
        event={modalState.selectedEvent}
        dayEvents={modalState.dayEvents}
        onEventSaved={handleEventSaved}
        onEventDeleted={handleEventDeleted}
      />
    </div>
  );
};

export default CalendarPage;
