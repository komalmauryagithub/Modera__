import React from 'react';
import '../../styles/common.css';

const Loader = ({ message = 'Opening your scrapbook...' }) => {
  return (
    <div className="loader-container">
      <div className="loader-spinner"></div>
      <p className="loader-text">{message}</p>
    </div>
  );
};

export default Loader;
