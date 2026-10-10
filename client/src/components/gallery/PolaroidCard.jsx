import React, { useState } from 'react';
import { Calendar, Clock, Tag, Image as ImageIcon } from 'lucide-react';
import '../../styles/gallery.css';

const PolaroidCard = ({ event, onClick }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="polaroid-scrap-item" onClick={() => onClick(event)}>
      <div className="polaroid-pin"></div>

      <div className="polaroid-image-container">
        {event.imageUrl && !imageError ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="polaroid-img"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="polaroid-placeholder">
            <ImageIcon size={32} className="polaroid-placeholder-icon" />
            <span className="polaroid-placeholder-text">Story Note</span>
          </div>
        )}

        <div className={`polaroid-category-badge cat-${event.category || 'General'}`}>
          {event.category || 'General'}
        </div>
      </div>

      <div className="polaroid-caption-area">
        <h3 className="polaroid-title" title={event.title}>
          {event.title}
        </h3>

        {event.caption ? (
          <p className="polaroid-caption-text">
            "{event.caption}"
          </p>
        ) : (
          <p className="polaroid-caption-text empty-caption">
            Every date has a story...
          </p>
        )}

        <div className="polaroid-footer-meta">
          <span className="polaroid-meta-item">
            <Calendar size={13} />
            <span>{event.date}</span>
          </span>
          {event.time && (
            <span className="polaroid-meta-item">
              <Clock size={13} />
              <span>{event.time}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolaroidCard;
