import React, { useState, useEffect, useCallback } from 'react';
import eventApi from '../api/eventApi';
import FilterBar from '../components/common/FilterBar';
import PolaroidCard from '../components/gallery/PolaroidCard';
import EventModal from '../components/events/EventModal';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';
import { Image as ImageIcon, Sparkles } from 'lucide-react';
import '../styles/gallery.css';

const DEFAULT_FILTERS = {
  search: '',
  category: 'All',
  startDate: '',
  endDate: '',
};

const GalleryPage = () => {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected event for viewing / editing in modal
  const [modalState, setModalState] = useState({
    isOpen: false,
    event: null,
  });

  // Fetch events from API using active filters
  const fetchGalleryEvents = useCallback(async (activeFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (activeFilters.search?.trim()) params.search = activeFilters.search.trim();
      if (activeFilters.category && activeFilters.category !== 'All') params.category = activeFilters.category;
      if (activeFilters.startDate) params.startDate = activeFilters.startDate;
      if (activeFilters.endDate) params.endDate = activeFilters.endDate;

      const response = await eventApi.getEvents(params);
      if (response?.success && Array.isArray(response.events)) {
        setEvents(response.events);
      } else {
        setEvents([]);
      }
    } catch (err) {
      setError(err.message || 'Unable to load gallery memories.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced effect on filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGalleryEvents(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, fetchGalleryEvents]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleCardClick = (event) => {
    setModalState({
      isOpen: true,
      event,
    });
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, event: null });
  };

  const handleEventSaved = () => {
    fetchGalleryEvents(filters);
  };

  const handleEventDeleted = () => {
    fetchGalleryEvents(filters);
  };

  return (
    <div className="gallery-page-container">
      <div className="gallery-header-section">
        <div className="gallery-badge">
          <Sparkles size={14} />
          <span>VISUAL SCRAPBOOK</span>
        </div>
        <h1 className="gallery-title">Memory Gallery</h1>
        <p className="gallery-subtitle">"Every Snapshot Has a Story to Tell"</p>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        resultCount={events.length}
        loading={loading}
      />

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {loading ? (
        <Loader message="Arranging your memory wall..." />
      ) : events.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No Memories Found"
          description={
            filters.search || filters.category !== 'All' || filters.startDate
              ? 'No events match your current search and filter criteria. Try resetting the filters.'
              : 'Your gallery is empty! Head to the Calendar and add memories with photos and captions.'
          }
          actionLabel={
            filters.search || filters.category !== 'All' || filters.startDate
              ? 'Clear Filters'
              : undefined
          }
          onAction={handleResetFilters}
        />
      ) : (
        <div className="polaroid-grid">
          {events.map((event) => (
            <PolaroidCard
              key={event.id}
              event={event}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {/* Reusable Event Modal */}
      <EventModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        initialMode="view"
        event={modalState.event}
        onEventSaved={handleEventSaved}
        onEventDeleted={handleEventDeleted}
      />
    </div>
  );
};

export default GalleryPage;
