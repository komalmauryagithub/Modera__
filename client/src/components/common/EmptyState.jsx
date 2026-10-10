import React from 'react';
import { CalendarHeart } from 'lucide-react';
import Button from './Button';
import '../../styles/common.css';

const EmptyState = ({
  icon: Icon = CalendarHeart,
  title = 'No memories recorded yet',
  description = 'Every date holds a special story waiting to be remembered.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">
        <Icon size={32} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
