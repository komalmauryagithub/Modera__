import React, { useState, useEffect } from 'react';
import eventApi from '../../api/eventApi';
import Input from '../common/Input';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';
import {
  X,
  Calendar,
  Clock,
  Tag,
  UploadCloud,
  Trash2,
  Edit3,
  Plus,
  Heart,
  Sparkles,
} from 'lucide-react';
import '../../styles/calendar.css';

const CATEGORIES = [
  'General',
  'Birthday',
  'Anniversary',
  'Travel',
  'Milestone',
  'Holiday',
  'Romantic',
  'Family',
  'Other',
];

const EventModal = ({
  isOpen,
  onClose,
  initialMode = 'create', // 'create' | 'view' | 'edit'
  initialDate = '',
  event = null,
  dayEvents = [],
  onEventSaved,
  onEventDeleted,
}) => {
  const [mode, setMode] = useState(initialMode);
  const [activeEvent, setActiveEvent] = useState(event);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    date: '',
    time: '',
    category: 'General',
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Synchronize state when modal opens or active event changes
  useEffect(() => {
    if (!isOpen) return;

    setMode(initialMode);
    setActiveEvent(event);
    setModalError(null);
    setFormErrors({});
    setPhotoFile(null);
    setRemoveExistingPhoto(false);

    if (event) {
      setFormData({
        title: event.title || '',
        caption: event.caption || '',
        date: event.date || initialDate,
        time: event.time || '',
        category: event.category || 'General',
      });
      setPhotoPreview(event.imageUrl || null);
    } else {
      setFormData({
        title: '',
        caption: '',
        date: initialDate || new Date().toISOString().split('T')[0],
        time: '',
        category: 'General',
      });
      setPhotoPreview(null);
    }
  }, [isOpen, initialMode, initialDate, event]);

  if (!isOpen) return null;

  // Handle Photo File Selection
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors((prev) => ({
        ...prev,
        photo: 'Photo size cannot exceed 5MB.',
      }));
      return;
    }

    // Check type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setFormErrors((prev) => ({
        ...prev,
        photo: 'Only JPEG, PNG, and WebP images are allowed.',
      }));
      return;
    }

    setFormErrors((prev) => ({ ...prev, photo: null }));
    setPhotoFile(file);
    setRemoveExistingPhoto(false);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemoveExistingPhoto(true);
  };

  const validate = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Event title is required.';
    } else if (formData.title.trim().length > 120) {
      errors.title = 'Title cannot exceed 120 characters.';
    }

    if (!formData.date || !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      errors.date = 'Valid date (YYYY-MM-DD) is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (formErrors[id]) {
      setFormErrors((prev) => ({ ...prev, [id]: null }));
    }
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    setModalError(null);

    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('date', formData.date.trim());
      if (formData.caption.trim()) data.append('caption', formData.caption.trim());
      if (formData.time) data.append('time', formData.time.trim());
      if (formData.category) data.append('category', formData.category);

      if (photoFile) {
        data.append('photo', photoFile);
      } else if (removeExistingPhoto) {
        data.append('removePhoto', 'true');
      }

      if (mode === 'create') {
        const res = await eventApi.createEvent(data);
        onEventSaved(res.event);
      } else if (mode === 'edit' && activeEvent) {
        const res = await eventApi.updateEvent(activeEvent.id, data);
        onEventSaved(res.event);
      }

      onClose();
    } catch (err) {
      setModalError(err.message || 'Failed to save event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!activeEvent || submitting) return;
    if (!window.confirm(`Are you sure you want to delete "${activeEvent.title}"?`)) {
      return;
    }

    setSubmitting(true);
    setModalError(null);
    try {
      await eventApi.deleteEvent(activeEvent.id);
      onEventDeleted(activeEvent.id);
      onClose();
    } catch (err) {
      setModalError(err.message || 'Failed to delete event.');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="washi-tape"></div>

        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <ErrorMessage message={modalError} onDismiss={() => setModalError(null)} />

        {/* ===================== VIEW MODE ===================== */}
        {mode === 'view' && activeEvent && (
          <div className="event-view-content">
            <div className="modal-header">
              <div className="modal-date-badge">
                <Calendar size={14} />
                <span>{activeEvent.date}</span>
                {activeEvent.time && (
                  <>
                    <span>•</span>
                    <Clock size={14} />
                    <span>{activeEvent.time}</span>
                  </>
                )}
              </div>
              <h2 className="modal-title">{activeEvent.title}</h2>
              <div style={{ marginTop: '0.4rem' }}>
                <span className={`event-chip cat-${activeEvent.category || 'General'}`} style={{ display: 'inline-flex', padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
                  <Tag size={12} style={{ marginRight: '4px' }} />
                  {activeEvent.category || 'General'}
                </span>
              </div>
            </div>

            <div className="polaroid-view-frame">
              {activeEvent.imageUrl ? (
                <img
                  src={activeEvent.imageUrl}
                  alt={activeEvent.title}
                  className="polaroid-view-image"
                />
              ) : (
                <div style={{ padding: '2.5rem 1rem', background: 'var(--color-lavender-light)', borderRadius: '4px', marginBottom: '1rem', color: 'var(--color-muted-purple)' }}>
                  <Heart size={36} color="var(--color-blush-dark)" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                  <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>No photo attached to this memory.</p>
                </div>
              )}

              {activeEvent.caption && (
                <p className="polaroid-view-caption">
                  "{activeEvent.caption}"
                </p>
              )}
            </div>

            {/* Other events on the same date */}
            {dayEvents.length > 1 && (
              <div style={{ marginBottom: '1.5rem', background: 'var(--bg-cream)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-soft)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted-purple)', display: 'block', marginBottom: '0.4rem' }}>
                  Other memories on this date:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {dayEvents
                    .filter((ev) => ev.id !== activeEvent.id)
                    .map((other) => (
                      <button
                        key={other.id}
                        type="button"
                        className={`event-chip cat-${other.category || 'General'}`}
                        onClick={() => {
                          setActiveEvent(other);
                          setFormData({
                            title: other.title,
                            caption: other.caption,
                            date: other.date,
                            time: other.time || '',
                            category: other.category || 'General',
                          });
                        }}
                      >
                        {other.title}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={handleDelete}
                disabled={submitting}
                style={{ color: '#dc2626' }}
              >
                Delete
              </Button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() => {
                    setMode('create');
                    setActiveEvent(null);
                    setFormData({
                      title: '',
                      caption: '',
                      date: activeEvent.date,
                      time: '',
                      category: 'General',
                    });
                    setPhotoPreview(null);
                    setPhotoFile(null);
                  }}
                >
                  Add Another
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  icon={Edit3}
                  onClick={() => setMode('edit')}
                >
                  Edit Memory
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== CREATE / EDIT MODE ===================== */}
        {(mode === 'create' || mode === 'edit') && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <div className="modal-date-badge">
                <Sparkles size={14} />
                <span>{mode === 'create' ? 'RECORD NEW MEMORY' : 'EDIT MEMORY'}</span>
              </div>
              <h2 className="modal-title">
                {mode === 'create' ? 'Add to Scrapbook' : 'Edit Your Story'}
              </h2>
            </div>

            <Input
              id="title"
              label="Event Title *"
              placeholder="e.g. Grandma's 80th Birthday"
              value={formData.title}
              onChange={handleInputChange}
              error={formErrors.title}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                id="date"
                type="date"
                label="Date *"
                value={formData.date}
                onChange={handleInputChange}
                error={formErrors.date}
                required
              />

              <Input
                id="time"
                type="time"
                label="Time (Optional)"
                value={formData.time}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="category" className="form-label">
                Category
              </label>
              <select
                id="category"
                className="form-input"
                value={formData.category}
                onChange={handleInputChange}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="caption" className="form-label">
                Caption / Scrapbook Note
              </label>
              <textarea
                id="caption"
                className="form-input"
                rows="3"
                placeholder="Write a heartfelt story or memory for this date..."
                value={formData.caption}
                onChange={handleInputChange}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Photo Attachment Section */}
            <div className="form-group">
              <label className="form-label">Photo Memory (Optional)</label>

              {photoPreview ? (
                <div className="photo-preview-wrap">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="photo-preview-img"
                  />
                  <button
                    type="button"
                    className="btn-remove-photo"
                    onClick={handleRemovePhoto}
                    title="Remove photo"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="photo-uploader">
                  <UploadCloud size={32} color="var(--color-muted-purple)" style={{ margin: '0 auto 0.4rem', display: 'block' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-deep-purple)' }}>
                    Click to upload a memory photo
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                    Supports JPG, PNG, or WebP (up to 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
              {formErrors.photo && (
                <span className="form-error">{formErrors.photo}</span>
              )}
            </div>

            <div className="modal-actions">
              {mode === 'edit' && (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setMode('view')}
                  disabled={submitting}
                >
                  Back to View
                </Button>
              )}

              <Button
                variant="ghost"
                size="md"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={submitting}
              >
                {mode === 'create' ? 'Save Memory' : 'Update Memory'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EventModal;
