import React, { useState, useEffect, useCallback } from 'react';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import eventApi from '../api/eventApi';
import EventModal from '../components/events/EventModal';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';
import { Clock, Calendar, Plus, Sparkles } from 'lucide-react';
import '../styles/upcoming.css';

const UpcomingPage = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'view', // 'view' | 'create'
    event: null,
  });

  const fetchUpcoming = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await eventApi.getUpcomingEvents(30);
      if (response?.success && Array.isArray(response.events)) {
        setUpcomingEvents(response.events);
      } else {
        setUpcomingEvents([]);
      }
    } catch (err) {
      setError(err.message || 'Unable to load upcoming events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  // Compute countdown label relative to today
  const getCountdownLabel = (dateStr) => {
    const today = new Date();
    // Parse YYYY-MM-DD safely into local date
    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const daysDiff = differenceInCalendarDays(targetDate, today);

    if (daysDiff === 0) {
      return { text: 'Today', type: 'today' };
    } else if (daysDiff === 1) {
      return { text: 'Tomorrow', type: 'tomorrow' };
    } else if (daysDiff > 1) {
      return { text: `In ${daysDiff} days`, type: 'future' };
    } else {
      return { text: 'Happening Now', type: 'today' };
    }
  };

  const handleCardClick = (event) => {
    setModalState({
      isOpen: true,
      mode: 'view',
      event,
    });
  };

  const handleAddNew = () => {
    setModalState({
      isOpen: true,
      mode: 'create',
      event: null,
    });
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, mode: 'view', event: null });
  };

  const handleEventSaved = () => {
    fetchUpcoming();
  };

  const handleEventDeleted = () => {
    fetchUpcoming();
  };

  return (
    <div className="upcoming-page-container">
      <div className="upcoming-header-section">
        <div className="upcoming-badge">
          <Sparkles size={14} />
          <span>APPROACHING MOMENTS</span>
        </div>
        <h1 className="upcoming-title">Upcoming Events</h1>
        <p className="upcoming-subtitle">"Moments to Look Forward To"</p>
        <div style={{ marginTop: '1rem' }}>
          <Button variant="primary" size="sm" icon={Plus} onClick={handleAddNew}>
            Plan New Event
          </Button>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {loading ? (
        <Loader message="Gathering your upcoming dates..." />
      ) : upcomingEvents.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No Upcoming Events"
          description="You don't have any future events scheduled right now. Plan your next anniversary, holiday, or birthday celebration!"
          actionLabel="Add New Event"
          onAction={handleAddNew}
        />
      ) : (
        <div className="upcoming-timeline">
          {upcomingEvents.map((event) => {
            const [y, m, d] = event.date.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            const monthText = format(dateObj, 'MMM');
            const dayText = format(dateObj, 'dd');
            const countdown = getCountdownLabel(event.date);

            return (
              <div
                key={event.id}
                className="upcoming-card"
                onClick={() => handleCardClick(event)}
              >
                {/* Date Box */}
                <div className="upcoming-date-box">
                  <span className="upcoming-date-month">{monthText}</span>
                  <span className="upcoming-date-day">{dayText}</span>
                </div>

                {/* Thumbnail if present */}
                {event.imageUrl && (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="upcoming-thumb"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}

                {/* Event info */}
                <div className="upcoming-info">
                  <div className="upcoming-card-header">
                    <span className={`countdown-pill ${countdown.type}`}>
                      {countdown.text}
                    </span>
                    <span className={`event-chip cat-${event.category || 'General'}`}>
                      {event.category || 'General'}
                    </span>
                  </div>

                  <h3 className="upcoming-event-title">{event.title}</h3>

                  {event.caption && (
                    <p className="upcoming-caption">"{event.caption}"</p>
                  )}

                  <div className="upcoming-meta-row">
                    <span className="upcoming-meta-item">
                      <Calendar size={13} />
                      <span>{event.date}</span>
                    </span>
                    {event.time && (
                      <span className="upcoming-meta-item">
                        <Clock size={13} />
                        <span>{event.time}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reusable Event Modal */}
      <EventModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        initialMode={modalState.mode}
        event={modalState.event}
        onEventSaved={handleEventSaved}
        onEventDeleted={handleEventDeleted}
      />
    </div>
  );
};

export default UpcomingPage;
