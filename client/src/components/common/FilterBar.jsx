import React from 'react';
import { Search, Filter, X, Calendar, RotateCcw } from 'lucide-react';
import '../../styles/common.css';

const CATEGORIES = [
  'All',
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

const FilterBar = ({
  filters,
  onChange,
  onReset,
  resultCount = 0,
  loading = false,
}) => {
  const handleInputChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    (filters.category && filters.category !== 'All') ||
    filters.startDate ||
    filters.endDate
  );

  return (
    <div className="filter-bar-card">
      <div className="filter-bar-row">
        {/* Search Input */}
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search memories by title or caption..."
            value={filters.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
          />
          {filters.search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => handleInputChange('search', '')}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category Select */}
        <div className="filter-select-wrap">
          <select
            className="filter-select"
            value={filters.category || 'All'}
            onChange={(e) => handleInputChange('category', e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="filter-date-wrap">
          <label className="filter-date-label">From</label>
          <input
            type="date"
            className="filter-date-input"
            value={filters.startDate || ''}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
          />
        </div>

        {/* End Date */}
        <div className="filter-date-wrap">
          <label className="filter-date-label">To</label>
          <input
            type="date"
            className="filter-date-input"
            value={filters.endDate || ''}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
          />
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn-clear-filters"
            onClick={onReset}
            title="Reset all filters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Results status badge */}
      <div className="filter-status-row">
        <span className="results-badge">
          {loading ? 'Searching memories...' : `${resultCount} ${resultCount === 1 ? 'memory' : 'memories'} found`}
        </span>
        {hasActiveFilters && (
          <span className="active-filters-indicator">
            Filters active
          </span>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
