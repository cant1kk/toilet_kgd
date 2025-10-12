import React, { useEffect, useState } from 'react';
import { telegramService } from '../services/telegram';

interface SimpleMapTestProps {
  initialUserLocation?: { lat: number; lon: number } | null;
  isTelegram: boolean;
}

export function SimpleMapTest({ initialUserLocation, isTelegram }: SimpleMapTestProps) {
  const [mapStatus, setMapStatus] = useState<string>('Initializing...');
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    const checkDependencies = () => {
      console.log('Checking map dependencies...');
      
      // Проверяем Leaflet
      if (typeof window !== 'undefined' && window.L) {
        console.log('✅ Leaflet loaded');
        setLeafletLoaded(true);
        setMapStatus('Leaflet loaded');
      } else {
        console.error('❌ Leaflet not loaded');
        setMapStatus('Leaflet not loaded');
      }

      // Проверяем React-Leaflet
      try {
        const { MapContainer } = require('react-leaflet');
        console.log('✅ React-Leaflet loaded');
        setMapStatus(prev => prev + ' | React-Leaflet loaded');
      } catch (error) {
        console.error('❌ React-Leaflet not loaded:', error);
        setMapStatus(prev => prev + ' | React-Leaflet failed');
      }

      // Проверяем Telegram WebApp
      if (isTelegram) {
        console.log('✅ Telegram WebApp mode');
        setMapStatus(prev => prev + ' | Telegram mode');
      }

      // Проверяем viewport
      if (typeof window !== 'undefined') {
        const height = window.innerHeight;
        const width = window.innerWidth;
        console.log(`Viewport: ${width}x${height}`);
        setMapStatus(prev => prev + ` | Viewport: ${width}x${height}`);
      }
    };

    // Отложенная проверка для гарантии загрузки всех зависимостей
    setTimeout(checkDependencies, 2000);
  }, [isTelegram]);

  if (!leafletLoaded) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#f8f9fa' }}>
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5>Загрузка карты...</h5>
        <p className="text-muted">{mapStatus}</p>
        {isTelegram && (
          <div className="mt-3 p-3 bg-info text-white rounded">
            <small>📱 Telegram WebApp detected</small>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4" style={{ height: '100vh', backgroundColor: '#f8f9fa' }}>
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">🗺️ Тест карты</h5>
        </div>
        <div className="card-body">
          <div className="alert alert-info">
            <strong>Статус:</strong> {mapStatus}
          </div>
          
          {isTelegram && (
            <div className="alert alert-success">
              <strong>✅ Telegram WebApp</strong> - карта должна адаптироваться под мобильный интерфейс
            </div>
          )}

          <div className="mt-3">
            <h6>Проверка компонентов:</h6>
            <ul className="list-unstyled">
              <li>📦 Leaflet: {leafletLoaded ? '✅ Загружен' : '❌ Не загружен'}</li>
              <li>📱 Telegram: {isTelegram ? '✅ Обнаружен' : '❌ Не в Telegram'}</li>
              <li>🌐 HTTPS: {typeof window !== 'undefined' && window.location.protocol === 'https:' ? '✅' : '❌'}</li>
            </ul>
          </div>

          <div className="mt-3">
            <button 
              className="btn btn-primary"
              onClick={() => {
                if (telegramService.isTelegramApp()) {
                  telegramService.showAlert('Карта готова к использованию!');
                } else {
                  alert('Карта готова к использованию!');
                }
              }}
            >
              🧪 Тестировать уведомления
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}