import React from 'react';
import '../styles/map.css';

interface LegendProps {
  isTelegram: boolean;
}

const Legend: React.FC<LegendProps> = ({ isTelegram }) => {
  return (
    <div className={`legend-container ${isTelegram ? 'telegram-legend' : ''}`}>
      <h6 className="mb-2">Легенда</h6>
      
      <div className="legend-item">
        <div className="legend-icon free"></div>
        <span>Бесплатный</span>
      </div>
      
      <div className="legend-item">
        <div className="legend-icon paid"></div>
        <span>Платный</span>
      </div>
      
      <div className="legend-item">
        <div className="legend-icon purchase-required"></div>
        <span>За покупку</span>
      </div>
      
      <div className="legend-item mt-2">
        <div className="legend-icon user"></div>
        <span>Вы здесь</span>
      </div>
      
      {isTelegram && (
        <div className="mt-2 text-muted small">
          <small>Кликните по карте для добавления точки</small>
        </div>
      )}
    </div>
  );
};

export default Legend;