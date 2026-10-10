import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Image, Clock, Heart, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';

const DashboardPlaceholder = ({ pageTitle = 'Calendar Dashboard' }) => {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: '960px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      <div className="polaroid-card" style={{ position: 'relative', marginBottom: '2rem' }}>
        <div className="washi-tape"></div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-lavender)', color: 'var(--color-muted-purple)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <ShieldCheck size={14} />
              <span>AUTHENTICATED SESSION ACTIVE</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', color: 'var(--color-deep-purple)' }}>
              Welcome to MEMORA, {user?.name}!
            </h1>
            <p style={{ fontFamily: 'var(--font-handwriting)', fontSize: '1.4rem', color: 'var(--color-blush-dark)' }}>
              "Every Date Has a Story."
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={logout}>
            Log Out
          </Button>
        </div>

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', padding: '1rem 1.25rem', marginBottom: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#166534' }}>
          <CheckCircle2 size={20} color="#16a34a" />
          <div style={{ fontSize: '0.88rem' }}>
            <strong>Session Restored Successfully:</strong> Logged in as <code>{user?.email}</code> (User ID: <code>{user?.id}</code>). Authentication state persists through page refreshes.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div style={{ background: 'var(--color-lavender-light)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-lavender)' }}>
            <Calendar size={28} color="var(--color-muted-purple)" style={{ marginBottom: '0.6rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.3rem', color: 'var(--color-deep-purple)' }}>Monthly Calendar</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {pageTitle === 'Calendar Dashboard' ? 'Active Route. Calendar views and date modals will be constructed in Phase 5.' : 'Navigate to Calendar tab in navigation.'}
            </p>
          </div>

          <div style={{ background: 'var(--color-blush-light)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-blush)' }}>
            <Image size={28} color="var(--color-blush-dark)" style={{ marginBottom: '0.6rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.3rem', color: 'var(--color-deep-purple)' }}>Photo Gallery</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {pageTitle === 'Photo Gallery' ? 'Active Route. Polaroid gallery grid will be integrated in Phase 6.' : 'Explore memories via the Gallery tab.'}
            </p>
          </div>

          <div style={{ background: '#FFFDF9', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-soft)' }}>
            <Clock size={28} color="var(--color-muted-purple)" style={{ marginBottom: '0.6rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.3rem', color: 'var(--color-deep-purple)' }}>Upcoming Events</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {pageTitle === 'Upcoming Events' ? 'Active Route. Timeline dashboard will be integrated in Phase 6.' : 'Track approaching dates via the Upcoming tab.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPlaceholder;
